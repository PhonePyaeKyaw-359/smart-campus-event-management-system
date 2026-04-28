const db = require("../config/db");
const { createAuditLog } = require("../models/auditLogModel");

const createNotification = (req, res) => {
  const { user_id, title, message } = req.body;

  if (!title || !message) {
    return res.status(400).json({
      message: "Title and message are required",
    });
  }

  const sql = `
    INSERT INTO notifications (user_id, title, message)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [user_id || null, title, message], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    createAuditLog(
      req.user.id,
      "CREATE_NOTIFICATION",
      `Created notification: ${title}`,
      "Notification",
      result.insertId
    );

    res.status(201).json({
      message: "Notification created successfully",
      notificationId: result.insertId,
    });
  });
};

const getMyNotifications = (req, res) => {
  const user_id = req.user.id;

  const sql = `
    SELECT *
    FROM notifications
    WHERE user_id = ? OR user_id IS NULL
    ORDER BY created_at DESC
  `;

  db.query(sql, [user_id], (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    res.status(200).json(results);
  });
};

const markNotificationAsRead = (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  const sql = `
    UPDATE notifications
    SET is_read = TRUE
    WHERE id = ? AND (user_id = ? OR user_id IS NULL)
  `;

  db.query(sql, [id, user_id], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    res.status(200).json({
      message: "Notification marked as read",
    });
  });
};

module.exports = {
  createNotification,
  getMyNotifications,
  markNotificationAsRead,
};