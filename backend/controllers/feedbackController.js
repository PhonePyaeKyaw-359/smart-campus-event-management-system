const db = require("../config/db");

const toDateOnly = (value) => {
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return String(value).split("T")[0];
};

const submitFeedback = (req, res) => {
  const { event_id, rating, comment } = req.body;
  const user_id = req.user.id;

  if (!event_id || !rating) {
    return res.status(400).json({
      message: "Event ID and rating are required",
    });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({
      message: "Rating must be between 1 and 5",
    });
  }

  const eventSql = `
    SELECT e.id, e.event_date, e.event_time, e.event_end_time, e.status, r.status AS registration_status
    FROM events e
    LEFT JOIN registrations r
      ON r.event_id = e.id AND r.user_id = ?
    WHERE e.id = ?
  `;

  db.query(eventSql, [user_id, event_id], (err, eventResults) => {
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
    const now = new Date();
    const eventEnd = new Date(`${toDateOnly(event.event_date)}T${event.event_end_time || event.event_time}`);

    if (event.registration_status !== "registered") {
      return res.status(403).json({
        message: "Only registered participants can submit feedback",
      });
    }

    if (event.status !== "active") {
      return res.status(400).json({
        message: "Feedback is not available for this event",
      });
    }

    if (now <= eventEnd) {
      return res.status(400).json({
        message: "Feedback opens after the event is finished",
      });
    }

    const sql = `
      INSERT INTO feedback (user_id, event_id, rating, comment)
      VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [user_id, event_id, rating, comment], (err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Database error",
          error: err.message,
        });
      }

      res.status(201).json({
        message: "Feedback submitted successfully",
        feedbackId: result.insertId,
      });
    });
  });
};

const getEventFeedback = (req, res) => {
  const { eventId } = req.params;

  const sql = `
    SELECT 
      feedback.id,
      feedback.rating,
      feedback.comment,
      feedback.created_at,
      users.full_name,
      events.title AS event_title
    FROM feedback
    JOIN users ON feedback.user_id = users.id
    JOIN events ON feedback.event_id = events.id
    WHERE feedback.event_id = ?
    ORDER BY feedback.created_at DESC
  `;

  db.query(sql, [eventId], (err, results) => {
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
  submitFeedback,
  getEventFeedback,
};
