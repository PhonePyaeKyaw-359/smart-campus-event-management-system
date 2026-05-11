const db = require("../config/db");
const { createAuditLog } = require("../models/auditLogModel");

const notifyAdmins = (organizationId, title, message) => {
  const sql = `
    INSERT INTO notifications (user_id, title, message)
    SELECT id, ?, ?
    FROM users
    WHERE role = 'admin' AND organization_id = ?
  `;

  db.query(sql, [title, message, organizationId], (err) => {
    if (err) console.error("Admin notification error:", err.message);
  });
};

const toMysqlDateTime = (value) => {
  if (!value) return null;
  return value.replace("T", " ").slice(0, 19);
};

const buildDateTime = (date, time) => new Date(`${date}T${time}`);

const toDateOnly = (value) => {
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return String(value).split("T")[0];
};

const getEventDateTime = (event, timeField) => {
  const time = event[timeField] || event.event_time;
  return new Date(`${toDateOnly(event.event_date)}T${time}`);
};

const getEventPhase = (event, now = new Date()) => {
  const start = getEventDateTime(event, "event_time");
  const end = getEventDateTime(event, "event_end_time");

  if (now < start) return "upcoming";
  if (now <= end) return "available";
  return "finished";
};

const getRegistrationState = (event, now = new Date()) => {
  const deadline = event.registration_deadline ? new Date(event.registration_deadline) : null;

  if (event.registration_status === "closed") {
    return { registration_open: 0, registration_closed_reason: "Closed manually" };
  }

  if (!deadline) {
    return { registration_open: 0, registration_closed_reason: "No deadline set" };
  }

  if (now > deadline) {
    return { registration_open: 0, registration_closed_reason: "Deadline passed" };
  }

  return { registration_open: 1, registration_closed_reason: "Open" };
};

const validateEventSchedule = ({ event_date, event_time, event_end_time, registration_deadline }) => {
  const start = buildDateTime(event_date, event_time);
  const end = buildDateTime(event_date, event_end_time);
  const deadline = new Date(registration_deadline);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || Number.isNaN(deadline.getTime())) {
    return "Event schedule is invalid";
  }

  if (end <= start) {
    return "End time must be after start time";
  }

  if (deadline > start) {
    return "Registration deadline must be before the event starts";
  }

  return null;
};

const createEvent = (req, res) => {
  const {
    title,
    description,
    event_date,
    event_time,
    event_end_time,
    registration_deadline,
    registration_status,
    visibility,
    location,
    capacity,
  } = req.body;

  if (!title || !event_date || !event_time || !event_end_time || !registration_deadline || !location || !capacity) {
    return res.status(400).json({
      message: "Title, date, start time, end time, registration deadline, location, and capacity are required",
    });
  }

  const scheduleError = validateEventSchedule({ event_date, event_time, event_end_time, registration_deadline });
  if (scheduleError) {
    return res.status(400).json({ message: scheduleError });
  }

  const sql = `
    INSERT INTO events 
    (organization_id, department_id, title, description, event_date, event_time, event_end_time, registration_deadline, registration_status, visibility, location, capacity, created_by, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      req.user.organization_id,
      req.user.department_id || null,
      title,
      description,
      event_date,
      event_time,
      event_end_time,
      toMysqlDateTime(registration_deadline),
      registration_status || "open",
      visibility === "public" ? "public" : "department",
      location,
      capacity,
      req.user.id,
      req.user.role === "admin" ? "active" : "pending",
    ],
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
        `${req.user.role === "admin" ? "Created" : "Requested"} event: ${title}`,
        "Event",
        eventId
      );

      if (req.user.role === "faculty") {
        notifyAdmins(
          req.user.organization_id,
          "Event approval needed",
          `${req.user.full_name || "A faculty member"} requested approval for "${title}".`
        );
      }

      res.status(201).json({
        message: req.user.role === "admin"
          ? "Event created successfully"
          : "Event created and pending admin approval",
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
     roleFilter = "WHERE e.organization_id = ? AND e.status = 'active' AND (e.visibility = 'public' OR e.department_id = ?)";
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
      CASE WHEN ur.status IN ('pending', 'registered') THEN 1 ELSE 0 END AS user_registered,
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

    const now = new Date();
    const enriched = results.map((event) => {
      const registrationState = getRegistrationState(event, now);
      return {
        ...event,
        event_phase: getEventPhase(event, now),
        ...registrationState,
      };
    });

    res.status(200).json(enriched);
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
  const { title, description, event_date, event_time, event_end_time, registration_deadline, registration_status, visibility, location, capacity, status } = req.body;

  if (!title || !event_date || !event_time || !event_end_time || !registration_deadline || !location || !capacity) {
    return res.status(400).json({
      message: "Title, date, start time, end time, registration deadline, location, and capacity are required",
    });
  }

  const scheduleError = validateEventSchedule({ event_date, event_time, event_end_time, registration_deadline });
  if (scheduleError) {
    return res.status(400).json({ message: scheduleError });
  }

  const nextStatus = req.user.role === "admin"
    ? (status || "active")
    : status === "cancelled"
      ? "pending_cancel"
      : "pending";

  const sql = `
    UPDATE events
    SET title = ?, description = ?, event_date = ?, event_time = ?, event_end_time = ?, registration_deadline = ?, registration_status = ?, visibility = ?, location = ?, capacity = ?, status = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [
      title,
      description,
      event_date,
      event_time,
      event_end_time,
      toMysqlDateTime(registration_deadline),
      registration_status || "open",
      visibility === "public" ? "public" : "department",
      location,
      capacity,
      nextStatus,
      id,
    ],
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
        `${req.user.role === "admin" ? "Updated" : nextStatus === "pending_cancel" ? "Requested cancellation for" : "Requested update for"} event ID: ${id}`,
        "Event",
        id
      );

      if (req.user.role === "faculty") {
        notifyAdmins(
          req.user.organization_id,
          nextStatus === "pending_cancel" ? "Event cancellation approval needed" : "Event update approval needed",
          `${req.user.full_name || "A faculty member"} ${nextStatus === "pending_cancel" ? "requested cancellation for" : "updated"} "${title}" and it is waiting for approval.`
        );
      }

      res.status(200).json({
        message: req.user.role === "admin"
          ? "Event updated successfully"
          : nextStatus === "pending_cancel"
            ? "Event cancellation submitted for admin approval"
            : "Event update submitted for admin approval",
      });
    }
  );
};

const deleteEvent = (req, res) => {
  const { id } = req.params;

  if (req.user.role === "faculty") {
    const requestSql = `
      UPDATE events
      SET status = 'pending_delete'
      WHERE id = ? AND created_by = ? AND status <> 'pending_delete'
    `;

    return db.query(requestSql, [id, req.user.id], (err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Database error",
          error: err.message,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Event not found or delete already requested",
        });
      }

      createAuditLog(
        req.user.id,
        "REQUEST_DELETE_EVENT",
        `Requested delete for event ID: ${id}`,
        "Event",
        id
      );

      notifyAdmins(
        req.user.organization_id,
        "Event delete approval needed",
        `${req.user.full_name || "A faculty member"} requested deletion for event ID ${id}.`
      );

      return res.status(200).json({
        message: "Event deletion submitted for admin approval",
      });
    });
  }

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
