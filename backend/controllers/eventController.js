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
    (title, description, event_date, event_time, location, capacity, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [title, description, event_date, event_time, location, capacity, req.user.id],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Database error",
          error: err.message,
        });
      }

      createAuditLog(
        req.user.id,
        "CREATE_EVENT",
        `Created event: ${title}`,
        "Event",
        result.insertId
      );

      res.status(201).json({
        message: "Event created successfully",
        eventId: result.insertId,
      });
    }
  );
};

const getAllEvents = (req, res) => {
  const sql = "SELECT * FROM events ORDER BY event_date ASC, event_time ASC";

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