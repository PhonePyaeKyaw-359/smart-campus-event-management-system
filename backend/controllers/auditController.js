const db = require("../config/db");

const getAuditLogs = (req, res) => {
  const sql = `
    SELECT 
      audit_logs.id,
      audit_logs.action,
      audit_logs.description,
      audit_logs.entity_type,
      audit_logs.entity_id,
      audit_logs.created_at,
      users.full_name,
      users.email,
      users.role
    FROM audit_logs
    LEFT JOIN users ON audit_logs.user_id = users.id
    ORDER BY audit_logs.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    res.status(200).json(results);
  });
};

module.exports = {
  getAuditLogs,
};