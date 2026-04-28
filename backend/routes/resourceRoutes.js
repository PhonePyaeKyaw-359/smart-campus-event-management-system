const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  createResource,
  getAllResources,
  updateResource,
  deleteResource,
  assignResourceToEvent,
  getEventResources,
  removeResourceFromEvent,
} = require("../controllers/resourceController");

router.post("/", verifyToken, authorizeRoles("admin"), createResource);

router.get("/", verifyToken, authorizeRoles("admin", "faculty"), getAllResources);

router.put("/:id", verifyToken, authorizeRoles("admin"), updateResource);

router.delete("/:id", verifyToken, authorizeRoles("admin"), deleteResource);

router.post(
  "/assign",
  verifyToken,
  authorizeRoles("admin"),
  assignResourceToEvent
);

router.get(
  "/event/:eventId",
  verifyToken,
  authorizeRoles("admin", "faculty"),
  getEventResources
);

router.delete(
  "/assignment/:assignmentId",
  verifyToken,
  authorizeRoles("admin"),
  removeResourceFromEvent
);

module.exports = router;