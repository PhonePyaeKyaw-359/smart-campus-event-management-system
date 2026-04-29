const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
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

    const validRoles = ["student", "faculty", "admin"];
    const userRole = validRoles.includes(role) ? role : "student";

    const sql = `
      INSERT INTO users (full_name, email, password, role)
      VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [full_name, email, hashedPassword, userRole], (err, result) => {
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

      const token = jwt.sign(
        {
          id: result.insertId,
          role: userRole,
          organization_id: null,
          department_id: null
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "1d",
        }
      );

      return res.status(201).json({
        message: "User registered successfully",
        token,
        user: {
          id: result.insertId,
          full_name,
          email,
          role: userRole,
          status: 'active',
          organization_id: null,
          department_id: null
        },
      });
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const loginUser = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      message: "JWT secret is not configured",
    });
  }

  const sql = "SELECT * FROM users WHERE email = ?";

  db.query(sql, [email], async (err, results) => {
    try {
      if (err) {
        return res.status(500).json({
          message: "Database error",
          error: err.message,
        });
      }

      if (results.length === 0) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      const user = results[0];

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      if (user.status === 'pending_approval') {
        return res.status(403).json({
          message: "Your account is pending admin approval.",
        });
      }

      const token = jwt.sign(
        {
          id: user.id,
          role: user.role,
          organization_id: user.organization_id,
          department_id: user.department_id
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "1d",
        }
      );

      return res.status(200).json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          status: user.status,
          organization_id: user.organization_id,
          department_id: user.department_id
        },
      });
    } catch (error) {
      return res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  });
};

module.exports = {
  registerUser,
  loginUser,
};