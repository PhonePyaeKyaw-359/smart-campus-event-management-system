const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  multipleStatements: true,
});

const schemaPath = path.join(__dirname, '../database/schema.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf8');

// We also need to drop the database first to ensure a clean slate
const dropAndCreateSql = `
  DROP DATABASE IF EXISTS \`${process.env.DB_NAME}\`;
  CREATE DATABASE \`${process.env.DB_NAME}\`;
  USE \`${process.env.DB_NAME}\`;
` + schemaSql.replace(/CREATE DATABASE IF NOT EXISTS smart_campus_db;/g, '').replace(/USE smart_campus_db;/g, '');

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  }
  
  db.query(dropAndCreateSql, (err) => {
    if (err) {
      console.error("❌ Failed to apply schema:", err.message);
      db.end();
      process.exit(1);
    }
    console.log("✅ Schema applied successfully");
    db.end();
  });
});
