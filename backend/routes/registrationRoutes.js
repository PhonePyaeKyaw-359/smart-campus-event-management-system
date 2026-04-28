const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  registerForEvent,
  getMyRegistrations,
  cancelMyRegistration,
} = require("../controllers/registrationController");

router.post(
  "/",
  verifyToken,
  authorizeRoles("student", "faculty", "admin"),
  registerForEvent
);

router.get("/my", verifyToken, getMyRegistrations);

router.put("/:id/cancel", verifyToken, cancelMyRegistration);

module.exports = router;