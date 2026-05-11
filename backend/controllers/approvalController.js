const db = require("../config/db");
const { createAuditLog } = require("../models/auditLogModel");

const notifyUser = (userId, title, message) => {
  if (!userId) return;

  db.query(
    "INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)",
    [userId, title, message],
    (err) => {
      if (err) console.error("Notification error:", err.message);
    }
  );
};

const finishApproval = ({ req, res, type, target_id, status, remarks, table, statusField, newStatus, target }) => {
  if (type === "event" && target.status === "pending_delete" && status === "approved") {
    return db.query("DELETE FROM events WHERE id = ?", [target_id], (err) => {
      if (err) return res.status(500).json({ message: "Failed to delete event", error: err.message });

      const sql = `INSERT INTO approvals (type, target_id, approved_by, status, remarks) VALUES (?, ?, ?, ?, ?)`;
      db.query(sql, [type, target_id, req.user.id, status, remarks || null], (err) => {
        if (err) console.error("Failed to log approval", err);
        createAuditLog(req.user.id, "APPROVED_EVENT_DELETE", `Approved delete for event ID ${target_id}`, "event", target_id);
        notifyUser(target.created_by, "Event delete approved", "Your event delete request has been approved.");
        res.status(200).json({ message: "event has been approved" });
      });
    });
  }

  if (type === "event" && target.status === "pending_cancel") {
    newStatus = status === "approved" ? "cancelled" : "active";
  }

  if (type === "event" && target.status === "pending_delete" && status === "rejected") {
    newStatus = "active";
  }

  db.query(`UPDATE ${table} SET ${statusField} = ? WHERE id = ?`, [newStatus, target_id], (err) => {
    if (err) return res.status(500).json({ message: "Failed to update status", error: err.message });

    const sql = `INSERT INTO approvals (type, target_id, approved_by, status, remarks) VALUES (?, ?, ?, ?, ?)`;
    db.query(sql, [type, target_id, req.user.id, status, remarks || null], (err) => {
      if (err) console.error("Failed to log approval", err);
      createAuditLog(
        req.user.id,
        `${status.toUpperCase()}_${type.toUpperCase()}`,
        `${req.user.role} ${status} ${type} ID ${target_id}`,
        type,
        target_id
      );

      if (type === "event") {
        notifyUser(target.created_by, `Event ${status}`, `Your event request has been ${status}.`);
      }

      if (type === "registration") {
        notifyUser(target.user_id, `Registration ${status}`, `Your event registration has been ${status}.`);
      }

      if (type === "user") {
        notifyUser(target.id, `Account ${status}`, `Your account has been ${status}.`);
      }

      res.status(200).json({ message: `${type} has been ${status}` });
    });
  });
};

const approveAction = (req, res) => {
  const { type, target_id, status, remarks } = req.body;

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

    const target = results[0];

    if (type === 'event' && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Only admins can approve events" });
    }

    if (type === 'user' && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Only admins can approve users" });
    }

    if (type === 'registration' && !['admin', 'faculty'].includes(req.user.role)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (type === "registration" && req.user.role === "faculty") {
      const scopeSql = `
        SELECT e.created_by
        FROM registrations r
        JOIN events e ON r.event_id = e.id
        WHERE r.id = ?
      `;
      return db.query(scopeSql, [target_id], (err, scopeResults) => {
        if (err) return res.status(500).json({ message: "Database error", error: err.message });
        if (!scopeResults[0] || scopeResults[0].created_by !== req.user.id) {
          return res.status(403).json({ message: "Faculty can only approve registrations for their own events" });
        }

        finishApproval({ req, res, type, target_id, status, remarks, table, statusField, newStatus, target });
      });
    }

    finishApproval({ req, res, type, target_id, status, remarks, table, statusField, newStatus, target });
  });
};

const getPendingApprovals = (req, res) => {
    const { type } = req.query;
    const orgId = req.user.organization_id;

    if (!orgId) return res.status(400).json({ message: "Organization required" });

    if (type === 'event') {
        // Admin gets pending events for their org
        db.query("SELECT e.*, u.full_name as creator_name FROM events e LEFT JOIN users u ON e.created_by = u.id WHERE e.status IN ('pending', 'pending_cancel', 'pending_delete') AND e.organization_id = ?", [orgId], (err, results) => {
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
        const q = req.user.role === "admin"
          ? `
            SELECT r.*, u.full_name, u.email, e.title as event_title
            FROM registrations r
            JOIN users u ON r.user_id = u.id
            JOIN events e ON r.event_id = e.id
            WHERE r.status = 'pending' AND e.organization_id = ?
          `
          : `
            SELECT r.*, u.full_name, u.email, e.title as event_title 
            FROM registrations r 
            JOIN users u ON r.user_id = u.id 
            JOIN events e ON r.event_id = e.id 
            WHERE r.status = 'pending' AND e.created_by = ?
        `;
        db.query(q, [req.user.role === "admin" ? orgId : req.user.id], (err, results) => {
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
