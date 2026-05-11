const db = require("./db");

const eventColumns = [
  {
    name: "event_end_time",
    definition: "ADD COLUMN event_end_time TIME NULL AFTER event_time",
  },
  {
    name: "registration_deadline",
    definition: "ADD COLUMN registration_deadline DATETIME NULL AFTER event_end_time",
  },
  {
    name: "registration_status",
    definition: "ADD COLUMN registration_status ENUM('open', 'closed') DEFAULT 'open' AFTER registration_deadline",
  },
  {
    name: "visibility",
    definition: "ADD COLUMN visibility ENUM('department', 'public') DEFAULT 'department' AFTER registration_status",
  },
];

const ensureSchema = () => {
  db.query(
    "ALTER TABLE users MODIFY status ENUM('active', 'pending_approval', 'rejected') DEFAULT 'active'",
    (err) => {
      if (err) console.error("Failed to update users.status enum:", err.message);
    }
  );

  db.query(
    "ALTER TABLE events MODIFY status ENUM('pending', 'active', 'cancelled', 'rejected', 'pending_cancel', 'pending_delete') DEFAULT 'pending'",
    (err) => {
      if (err) console.error("Failed to update events.status enum:", err.message);
    }
  );

  db.query("SHOW COLUMNS FROM events", (err, columns) => {
    if (err) {
      console.error("Failed to inspect events table:", err.message);
      return;
    }

    const existing = new Set(columns.map((column) => column.Field));
    const missing = eventColumns.filter((column) => !existing.has(column.name));

    missing.forEach((column) => {
      db.query(`ALTER TABLE events ${column.definition}`, (err) => {
        if (err) {
          console.error(`Failed to add ${column.name}:`, err.message);
        }
      });
    });
  });
};

module.exports = ensureSchema;
