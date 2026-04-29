/**
 * reset-db.js
 * Wipes ALL data and recreates clean starter accounts + organization.
 */
const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true,
});

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  }
  console.log("✅ Connected to database");
  runReset();
});

function runReset() {
  const sql = `
    SET FOREIGN_KEY_CHECKS = 0;

    TRUNCATE TABLE audit_logs;
    TRUNCATE TABLE notifications;
    TRUNCATE TABLE feedback;
    TRUNCATE TABLE event_resources;
    TRUNCATE TABLE registrations;
    TRUNCATE TABLE events;
    TRUNCATE TABLE resources;
    TRUNCATE TABLE approvals;
    TRUNCATE TABLE users;
    TRUNCATE TABLE departments;
    TRUNCATE TABLE organizations;

    SET FOREIGN_KEY_CHECKS = 1;

    -- Insert Default Organization and Department
    INSERT INTO organizations (id, name) VALUES (1, 'Asia-Pacific International University');
    INSERT INTO departments (id, organization_id, name) VALUES (1, 1, 'Faculty of IT');
    INSERT INTO departments (id, organization_id, name) VALUES (2, 1, 'Faculty of Business');

    -- Insert the 3 default system accounts linked to the default org/dept
    INSERT INTO users (full_name, email, password, role, status, organization_id, department_id) VALUES
    (
      'System Admin',
      'admin@campus.com',
      '$2b$10$xZm0l5y5UyHWKnzL/mBPK.z7NoT0BsP8PfIt3fUoqXivVVG9p.2yS',
      'admin',
      'active',
      1,
      NULL
    ),
    (
      'Campus Faculty',
      'faculty@campus.com',
      '$2b$10$4QEG3uYuDzoGVzSrAFmiEOfCuAC.BnD3Xq8KFIe0ueD4W5fsgBhbK',
      'faculty',
      'active',
      1,
      1
    ),
    (
      'Sample Student',
      'student@campus.com',
      '$2b$10$swna.mLSqSwI2G9NSzc9s.QnEN393uUybp3le.8HzDDkKCxLTUZsS',
      'student',
      'active',
      1,
      1
    );

    INSERT INTO notifications (user_id, title, message)
    VALUES (NULL, 'Welcome to CampusEvent', 'Your smart campus event management system is ready. Multi-tenant structure enabled.');
  `;

  db.query(sql, (err) => {
    if (err) {
      console.error("❌ Reset failed:", err.message);
      db.end();
      process.exit(1);
    }

    console.log("\\n🎉 Database reset complete!");
    console.log("─────────────────────────────────────────");
    console.log("  Role      │ Email                │ Password");
    console.log("────────────┼──────────────────────┼──────────────");
    console.log("  Admin     │ admin@campus.com     │ admin123");
    console.log("  Faculty   │ faculty@campus.com   │ faculty123");
    console.log("  Student   │ student@campus.com   │ student123");
    console.log("─────────────────────────────────────────");
    console.log("\\nOrganization: Asia-Pacific International University created.");
    console.log("Default users linked to the Organization.\\n");

    db.end();
  });
}
