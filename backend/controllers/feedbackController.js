const db = require("../config/db");

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