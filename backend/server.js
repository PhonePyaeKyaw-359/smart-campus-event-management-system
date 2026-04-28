const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const verifyToken = require("./middleware/authMiddleware");
const authorizeRoles = require("./middleware/roleMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);

app.get("/", (req, res) => {
  res.send("Smart Campus Event Management System API is running...");
});

app.get("/api/protected", verifyToken, (req, res) => {
  res.json({
    message: "Protected route accessed successfully",
    user: req.user,
  });
});

app.get("/api/admin-only", verifyToken, authorizeRoles("admin"), (req, res) => {
  res.json({
    message: "Welcome Admin. You can access this route.",
  });
});

app.get(
  "/api/faculty-only",
  verifyToken,
  authorizeRoles("faculty", "admin"),
  (req, res) => {
    res.json({
      message: "Welcome Faculty/Admin. You can access this route.",
    });
  }
);

app.get(
  "/api/student-only",
  verifyToken,
  authorizeRoles("student", "faculty", "admin"),
  (req, res) => {
    res.json({
      message: "Welcome authenticated user. You can access this route.",
    });
  }
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});