const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const { getAllUsers, createUser, updateUserRole, deleteUser } = require("../controllers/userController");

// User management routes
router.get("/", verifyToken, authorizeRoles("admin", "faculty"), getAllUsers);
router.post("/", verifyToken, authorizeRoles("admin", "faculty"), createUser);
router.put("/:id/role", verifyToken, authorizeRoles("admin"), updateUserRole);
router.delete("/:id", verifyToken, authorizeRoles("admin"), deleteUser);

module.exports = router;
