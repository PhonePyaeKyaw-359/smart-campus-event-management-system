const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  getDashboardSummary,
  getEventAttendanceReport,
  getFeedbackReport,
} = require("../controllers/reportController");

router.get(
  "/summary",
  verifyToken,
  authorizeRoles("admin", "faculty"),
  getDashboardSummary
);

router.get(
  "/attendance",
  verifyToken,
  authorizeRoles("admin", "faculty"),
  getEventAttendanceReport
);

router.get(
  "/feedback",
  verifyToken,
  authorizeRoles("admin", "faculty"),
  getFeedbackReport
);

module.exports = router;