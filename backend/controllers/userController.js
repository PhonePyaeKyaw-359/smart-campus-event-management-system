const db = require("../config/db");
const bcrypt = require("bcryptjs");
const { createAuditLog } = require("../models/auditLogModel");

// GET all users (admin or faculty)
const getAllUsers = (req, res) => {
  const { organization_id, department_id, role } = req.user;
  let sql = "";
  let params = [];

  if (role === "admin") {
    sql = `SELECT * FROM users WHERE organization_id = ? ORDER BY created_at DESC`;
    params = [organization_id];
  } else if (role === "faculty") {
    sql = `SELECT * FROM users WHERE organization_id = ? AND department_id = ? AND role = 'student' ORDER BY created_at DESC`;
    params = [organization_id, department_id];
  } else {
    return res.status(403).json({ message: "Unauthorized" });
  }

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ message: "Database error", error: err.message });
    res.status(200).json(results);
  });
};

// POST create a user with any role (admin or faculty)
const createUser = async (req, res) => {
  const { full_name, email, password, role } = req.body;
  const creatorRole = req.user.role;
  const { organization_id, department_id } = req.user;

  if (!full_name || !email || !password || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const validRoles = ["student", "faculty", "admin"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  if (creatorRole === 'faculty' && role !== 'student') {
    return res.status(403).json({ message: "Faculty can only create student accounts" });
  }

  const status = creatorRole === 'admin' ? 'active' : 'pending_approval';
  const targetDeptId = (role === 'student' || role === 'faculty') ? department_id : null;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `INSERT INTO users (full_name, email, password, role, status, organization_id, department_id) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.query(sql, [full_name, email, hashedPassword, role, status, organization_id, targetDeptId], (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ message: "Email already exists" });
        }
        return res.status(500).json({ message: "Database error", error: err.message });
      }

      createAuditLog(req.user.id, "CREATE_USER", `Created ${role} account: ${email} (status: ${status})`, "User", result.insertId);

      res.status(201).json({
        message: status === 'pending_approval' ? "User created and pending admin approval" : "User created successfully",
        user: { id: result.insertId, full_name, email, role, status, organization_id, department_id: targetDeptId },
      });
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PUT update user role (admin only)
const updateUserRole = (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const validRoles = ["student", "faculty", "admin"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  // Prevent admin from changing their own role
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ message: "You cannot change your own role" });
  }

  const sql = `UPDATE users SET role = ? WHERE id = ?`;
  db.query(sql, [role, id], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error", error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ message: "User not found" });

    createAuditLog(req.user.id, "UPDATE_USER_ROLE", `Changed user ID ${id} role to ${role}`, "User", id);

    res.status(200).json({ message: "User role updated" });
  });
};

// DELETE user (admin only, cannot delete self)
const deleteUser = (req, res) => {
  const { id } = req.params;

  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ message: "You cannot delete your own account" });
  }

  const sql = `DELETE FROM users WHERE id = ?`;
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error", error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ message: "User not found" });

    createAuditLog(req.user.id, "DELETE_USER", `Deleted user ID: ${id}`, "User", id);

    res.status(200).json({ message: "User deleted" });
  });
};

module.exports = { getAllUsers, createUser, updateUserRole, deleteUser };
