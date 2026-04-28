const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  createNotification,
  getMyNotifications,
  markNotificationAsRead,
} = require("../controllers/notificationController");

router.post(
  "/",
  verifyToken,
  authorizeRoles("admin", "faculty"),
  createNotification
);

router.get("/my", verifyToken, getMyNotifications);

router.put("/:id/read", verifyToken, markNotificationAsRead);

module.exports = router;