const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  createResource,
  getAllResources,
  updateResource,
  deleteResource,
} = require("../controllers/resourceController");

router.post("/", verifyToken, authorizeRoles("admin"), createResource);

router.get("/", verifyToken, authorizeRoles("admin", "faculty"), getAllResources);

router.put("/:id", verifyToken, authorizeRoles("admin"), updateResource);

router.delete("/:id", verifyToken, authorizeRoles("admin"), deleteResource);

module.exports = router;