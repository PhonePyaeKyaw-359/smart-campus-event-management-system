const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} = require("../controllers/eventController");

router.post("/", verifyToken, authorizeRoles("faculty", "admin"), createEvent);

router.get("/", verifyToken, getAllEvents);

router.get("/:id", verifyToken, getEventById);

router.put("/:id", verifyToken, authorizeRoles("faculty", "admin"), updateEvent);

router.delete("/:id", verifyToken, authorizeRoles("faculty", "admin"), deleteEvent);

module.exports = router;