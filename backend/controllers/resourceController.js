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

module.exports = {
  createResource,
  getAllResources,
  updateResource,
  deleteResource,
};