const db = require("../config/db");

const getDashboardSummary = (req, res) => {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM users) AS total_users,
      (SELECT COUNT(*) FROM events) AS total_events,
      (SELECT COUNT(*) FROM events WHERE status = 'active') AS active_events,
      (SELECT COUNT(*) FROM events WHERE status = 'cancelled') AS cancelled_events,
      (SELECT COUNT(*) FROM registrations WHERE status = 'registered') AS total_registrations,
      (SELECT COUNT(*) FROM feedback) AS total_feedback,
      (SELECT COUNT(*) FROM resources) AS total_resources
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    res.status(200).json(results[0]);
  });
};

const getEventAttendanceReport = (req, res) => {
  const sql = `
    SELECT 
      events.id,
      events.title,
      events.event_date,
      events.event_time,
      events.location,
      events.capacity,
      COUNT(registrations.id) AS total_registered
    FROM events
    LEFT JOIN registrations 
      ON events.id = registrations.event_id 
      AND registrations.status = 'registered'
    GROUP BY 
      events.id,
      events.title,
      events.event_date,
      events.event_time,
      events.location,
      events.capacity
    ORDER BY events.event_date ASC
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

const getFeedbackReport = (req, res) => {
  const sql = `
    SELECT 
      events.id AS event_id,
      events.title,
      COUNT(feedback.id) AS total_feedback,
      ROUND(AVG(feedback.rating), 2) AS average_rating
    FROM events
    LEFT JOIN feedback ON events.id = feedback.event_id
    GROUP BY events.id, events.title
    ORDER BY average_rating DESC
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
  getDashboardSummary,
  getEventAttendanceReport,
  getFeedbackReport,
};