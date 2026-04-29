const db = require("../config/db");
const { createAuditLog } = require("../models/auditLogModel");

const createEvent = (req, res) => {
  const { title, description, event_date, event_time, location, capacity } = req.body;

  if (!title || !event_date || !event_time || !location || !capacity) {
    return res.status(400).json({
      message: "Title, date, time, location, and capacity are required",
    });
  }

  const sql = `
    INSERT INTO events 
    (organization_id, department_id, title, description, event_date, event_time, location, capacity, created_by, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `;

  db.query(
    sql,
    [req.user.organization_id, req.user.department_id || null, title, description, event_date, event_time, location, capacity, req.user.id],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Database error",
          error: err.message,
        });
      }

      const eventId = result.insertId;

      createAuditLog(
        req.user.id,
        "CREATE_EVENT",
        `Created event: ${title}`,
        "Event",
        eventId
      );

      res.status(201).json({
        message: "Event created and pending admin approval",
        eventId,
      });
    }
  );
};

const getAllEvents = (req, res) => {
  const userId = req.user ? req.user.id : null;
  const orgId = req.user ? req.user.organization_id : null;
  const deptId = req.user ? req.user.department_id : null;
  const role = req.user ? req.user.role : null;

  let roleFilter = "";
  let params = [userId];

  if (role === 'student') {
     roleFilter = "WHERE e.organization_id = ? AND e.department_id = ? AND e.status = 'active'";
     params.push(orgId, deptId);
  } else if (role === 'admin' || role === 'faculty') {
     roleFilter = "WHERE e.organization_id = ?";
     params.push(orgId);
  } else {
     roleFilter = "WHERE e.status = 'active'";
  }

  const sql = `
    SELECT 
      e.*,
      COALESCE(rc.registered_count, 0) AS registered_count,
      CASE WHEN ur.id IS NOT NULL THEN 1 ELSE 0 END AS user_registered,
      ur.status AS user_registration_status
    FROM events e
    LEFT JOIN (
      SELECT event_id, COUNT(*) AS registered_count
      FROM registrations
      WHERE status = 'registered'
      GROUP BY event_id
    ) rc ON e.id = rc.event_id
    LEFT JOIN registrations ur
      ON e.id = ur.event_id AND ur.user_id = ? 
    ${roleFilter}
    ORDER BY e.event_date ASC, e.event_time ASC
  `;

  db.query(sql, params, (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    res.status(200).json(results);
  });
};

const getEventById = (req, res) => {
  const { id } = req.params;

  const sql = "SELECT * FROM events WHERE id = ?";

  db.query(sql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    res.status(200).json(results[0]);
  });
};

const updateEvent = (req, res) => {
  const { id } = req.params;
  const { title, description, event_date, event_time, location, capacity, status } = req.body;

  const sql = `
    UPDATE events
    SET title = ?, description = ?, event_date = ?, event_time = ?, location = ?, capacity = ?, status = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [title, description, event_date, event_time, location, capacity, status || "active", id],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Database error",
          error: err.message,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Event not found",
        });
      }

      createAuditLog(
        req.user.id,
        "UPDATE_EVENT",
        `Updated event ID: ${id}`,
        "Event",
        id
      );

      res.status(200).json({
        message: "Event updated successfully",
      });
    }
  );
};

const deleteEvent = (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM events WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    createAuditLog(
      req.user.id,
      "DELETE_EVENT",
      `Deleted event ID: ${id}`,
      "Event",
      id
    );

    res.status(200).json({
      message: "Event deleted successfully",
    });
  });
};

module.exports = {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
};