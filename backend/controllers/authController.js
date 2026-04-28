const bcrypt = require("bcryptjs");
const db = require("../config/db");

const registerUser = async (req, res) => {
  const { full_name, email, password, role } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({
      message: "Full name, email, and password are required",
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO users (full_name, email, password, role)
      VALUES (?, ?, ?, ?)
    `;

    db.query(
      sql,
      [full_name, email, hashedPassword, role || "student"],
      (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
              message: "Email already exists",
            });
          }

          return res.status(500).json({
            message: "Database error",
            error: err.message,
          });
        }

        res.status(201).json({
          message: "User registered successfully",
          userId: result.insertId,
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  registerUser,
};