const db = require("../config/db");
const { createAuditLog } = require("../models/auditLogModel");

const createResource = (req, res) => {
  const { name, type, description, availability_status } = req.body;

  if (!name || !type) {
    return res.status(400).json({
      message: "Resource name and type are required",
    });
  }

  const sql = `
    INSERT INTO resources (name, type, description, availability_status)
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    sql,
    [name, type, description, availability_status || "available"],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Database error",
          error: err.message,
        });
      }

      createAuditLog(
        req.user.id,
        "CREATE_RESOURCE",
        `Created resource: ${name}`,
        "Resource",
        result.insertId
      );

      res.status(201).json({
        message: "Resource created successfully",
        resourceId: result.insertId,
      });
    }
  );
};

const getAllResources = (req, res) => {
  const sql = "SELECT * FROM resources ORDER BY created_at DESC";

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

const updateResource = (req, res) => {
  const { id } = req.params;
  const { name, type, description, availability_status } = req.body;

  const sql = `
    UPDATE resources
    SET name = ?, type = ?, description = ?, availability_status = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [name, type, description, availability_status || "available", id],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Database error",
          error: err.message,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Resource not found",
        });
      }

      createAuditLog(
        req.user.id,
        "UPDATE_RESOURCE",
        `Updated resource ID: ${id}`,
        "Resource",
        id
      );

      res.status(200).json({
        message: "Resource updated successfully",
      });
    }
  );
};

const deleteResource = (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM resources WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Resource not found",
      });
    }

    createAuditLog(
      req.user.id,
      "DELETE_RESOURCE",
      `Deleted resource ID: ${id}`,
      "Resource",
      id
    );

    res.status(200).json({
      message: "Resource deleted successfully",
    });
  });
};

const assignResourceToEvent = (req, res) => {
  const { event_id, resource_id } = req.body;

  if (!event_id || !resource_id) {
    return res.status(400).json({
      message: "Event ID and Resource ID are required",
    });
  }

  const sql = `
    INSERT INTO event_resources (event_id, resource_id)
    VALUES (?, ?)
  `;

  db.query(sql, [event_id, resource_id], (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          message: "This resource is already assigned to this event",
        });
      }

      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    createAuditLog(
      req.user.id,
      "ASSIGN_RESOURCE",
      `Assigned resource ID ${resource_id} to event ID ${event_id}`,
      "EventResource",
      result.insertId
    );

    res.status(201).json({
      message: "Resource assigned to event successfully",
      assignmentId: result.insertId,
    });
  });
};

const getEventResources = (req, res) => {
  const { eventId } = req.params;

  const sql = `
    SELECT 
      event_resources.id AS assignment_id,
      resources.id AS resource_id,
      resources.name,
      resources.type,
      resources.description,
      resources.availability_status,
      event_resources.assigned_at
    FROM event_resources
    JOIN resources ON event_resources.resource_id = resources.id
    WHERE event_resources.event_id = ?
    ORDER BY event_resources.assigned_at DESC
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

const removeResourceFromEvent = (req, res) => {
  const { assignmentId } = req.params;

  const sql = "DELETE FROM event_resources WHERE id = ?";

  db.query(sql, [assignmentId], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Resource assignment not found",
      });
    }

    createAuditLog(
      req.user.id,
      "REMOVE_RESOURCE",
      `Removed resource assignment ID: ${assignmentId}`,
      "EventResource",
      assignmentId
    );

    res.status(200).json({
      message: "Resource removed from event successfully",
    });
  });
};

module.exports = {
  createResource,
  getAllResources,
  updateResource,
  deleteResource,
  assignResourceToEvent,
  getEventResources,
  removeResourceFromEvent,
};