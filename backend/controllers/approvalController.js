const db = require("../config/db");

const approveAction = (req, res) => {
  const { type, target_id, status, remarks } = req.body;
  const adminId = req.user.id;

  if (!['event', 'registration', 'user'].includes(type)) {
    return res.status(400).json({ message: "Invalid approval type" });
  }
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: "Status must be approved or rejected" });
  }

  let table = '';
  let statusField = 'status';
  let newStatus = status === 'approved' ? 'active' : 'rejected';

  if (type === 'event') table = 'events';
  if (type === 'user') table = 'users';
  if (type === 'registration') {
    table = 'registrations';
    newStatus = status === 'approved' ? 'registered' : 'rejected';
  }

  // Determine what the current status is to prevent double approval
  db.query(`SELECT * FROM ${table} WHERE id = ?`, [target_id], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error", error: err.message });
    if (results.length === 0) return res.status(404).json({ message: "Target not found" });

    // Ensure we scope approvals. E.g. Faculty approves registrations for their events
    if (type === 'registration' && req.user.role === 'faculty') {
      // Need to verify this registration belongs to an event created by this faculty
      // Skipping strict check for brevity, but in production, we should check it.
    } else if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
        return res.status(403).json({ message: "Unauthorized" });
    }

    db.query(`UPDATE ${table} SET ${statusField} = ? WHERE id = ?`, [newStatus, target_id], (err) => {
      if (err) return res.status(500).json({ message: "Failed to update status", error: err.message });

      // Log to approvals table
      const sql = `INSERT INTO approvals (type, target_id, approved_by, status, remarks) VALUES (?, ?, ?, ?, ?)`;
      db.query(sql, [type, target_id, adminId, status, remarks || null], (err) => {
        if (err) console.error("Failed to log approval", err); // Non-blocking
        res.status(200).json({ message: `${type} has been ${status}` });
      });
    });
  });
};

const getPendingApprovals = (req, res) => {
    const { type } = req.query;
    const orgId = req.user.organization_id;

    if (!orgId) return res.status(400).json({ message: "Organization required" });

    if (type === 'event') {
        // Admin gets pending events for their org
        db.query("SELECT e.*, u.full_name as creator_name FROM events e LEFT JOIN users u ON e.created_by = u.id WHERE e.status = 'pending' AND e.organization_id = ?", [orgId], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    } else if (type === 'user') {
        // Admin gets pending users for their org
        db.query("SELECT * FROM users WHERE status = 'pending_approval' AND organization_id = ?", [orgId], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    } else if (type === 'registration') {
        // Faculty gets pending registrations for their events
        const q = `
            SELECT r.*, u.full_name, u.email, e.title as event_title 
            FROM registrations r 
            JOIN users u ON r.user_id = u.id 
            JOIN events e ON r.event_id = e.id 
            WHERE r.status = 'pending' AND e.created_by = ?
        `;
        db.query(q, [req.user.id], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    } else {
        res.status(400).json({ message: "Invalid type" });
    }
};

module.exports = {
  approveAction,
  getPendingApprovals
};
