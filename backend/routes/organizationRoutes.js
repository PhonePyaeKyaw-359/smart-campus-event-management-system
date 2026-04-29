const express = require("express");
const router = express.Router();
const { getOrganizations, getDepartments, setOrganizationAndDepartment } = require("../controllers/organizationController");
const verifyToken = require("../middleware/authMiddleware");

// Public routes for fetching lists
router.get("/", getOrganizations);
router.get("/:orgId/departments", getDepartments);

// Protected routes
router.put("/onboard", verifyToken, setOrganizationAndDepartment);

module.exports = router;
