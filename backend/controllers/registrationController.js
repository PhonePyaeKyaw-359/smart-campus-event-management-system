const db = require("../config/db");

const registerForEvent = (req, res) => {
  const { event_id } = req.body;
  const user_id = req.user.id;

  if (!event_id) {
    return res.status(400).json({
      message: "Event ID is required",
    });
  }

  const eventSql = "SELECT * FROM events WHERE id = ?";

  db.query(eventSql, [event_id], (err, eventResults) => {
    if (err) {
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    if (eventResults.length === 0) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    const event = eventResults[0];

    if (event.status === "cancelled") {
      return res.status(400).json({
        message: "Cannot register for a cancelled event",
      });
    }

    const countSql = `
      SELECT COUNT(*) AS total 
      FROM registrations 
      WHERE event_id = ? AND status = 'registered'
    `;

    db.query(countSql, [event_id], (err, countResults) => {
      if (err) {
        return res.status(500).json({
          message: "Database error",
          error: err.message,
        });
      }

      const totalRegistered = countResults[0].total;

      if (totalRegistered >= event.capacity) {
        return res.status(400).json({
          message: "Event is already full",
        });
      }

      const insertSql = `
        INSERT INTO registrations (user_id, event_id)
        VALUES (?, ?)
      `;

      db.query(insertSql, [user_id, event_id], (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
              message: "You are already registered for this event",
            });
          }

          return res.status(500).json({
            message: "Database error",
            error: err.message,
          });
        }

        res.status(201).json({
          message: "Registered for event successfully",
          registrationId: result.insertId,
        });
      });
    });
  });
};

const getMyRegistrations = (req, res) => {
  const user_id = req.user.id;

  const sql = `
    SELECT 
      registrations.id AS registration_id,
      registrations.status AS registration_status,
      registrations.registered_at,
      events.id AS event_id,
      events.title,
      events.description,
      events.event_date,
      events.event_time,
      events.location,
      events.capacity,
      events.status AS event_status
    FROM registrations
    JOIN events ON registrations.event_id = events.id
    WHERE registrations.user_id = ?
    ORDER BY events.event_date ASC, events.event_time ASC
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

const cancelMyRegistration = (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  const sql = `
    UPDATE registrations
    SET status = 'cancelled'
    WHERE id = ? AND user_id = ?
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
        message: "Registration not found",
      });
    }

    res.status(200).json({
      message: "Registration cancelled successfully",
    });
  });
};

module.exports = {
  registerForEvent,
  getMyRegistrations,
  cancelMyRegistration,
};