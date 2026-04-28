const db = require("../config/db");

const createAuditLog = (userId, action, description, entityType = null, entityId = null) => {
  const sql = `
    INSERT INTO audit_logs (user_id, action, description, entity_type, entity_id)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [userId, action, description, entityType, entityId], (err) => {
    if (err) {
      console.error("Audit log error:", err.message);
    }
  });
};

module.exports = {
  createAuditLog,
};