const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  submitFeedback,
  getEventFeedback,
} = require("../controllers/feedbackController");

router.post("/", verifyToken, submitFeedback);

router.get(
  "/event/:eventId",
  verifyToken,
  authorizeRoles("faculty", "admin"),
  getEventFeedback
);

module.exports = router;