const bcrypt = require("bcryptjs");
const db = require("./config/db");

const accounts = [
  { email: "admin@campus.com",   password: "admin123",   role: "admin" },
  { email: "faculty@campus.com", password: "faculty123", role: "faculty" },
  { email: "student@campus.com", password: "student123", role: "student" },
];

async function fix() {
  for (const acc of accounts) {
    const hash = await bcrypt.hash(acc.password, 10);
    await new Promise((resolve, reject) => {
      db.query(
        "UPDATE users SET password = ? WHERE email = ?",
        [hash, acc.email],
        (err, result) => {
          if (err) { console.error("Error:", err.message); reject(err); return; }
          if (result.affectedRows === 0) {
            console.log(`⚠  Not found: ${acc.email} — skipping`);
          } else {
            console.log(`✅ Fixed: ${acc.email} → password: ${acc.password}`);
          }
          resolve();
        }
      );
    });
  }
  console.log("\nDone! You can now log in with:");
  console.log("  admin@campus.com    / admin123");
  console.log("  faculty@campus.com  / faculty123");
  console.log("  student@campus.com  / student123");
  console.log("  admin2@campus.com   / admin123");
  process.exit(0);
}

fix().catch((e) => { console.error(e); process.exit(1); });
