const express = require("express");
const router = express.Router();
const { approveAction, getPendingApprovals } = require("../controllers/approvalController");
const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// Approvals can be fetched/performed by admin or faculty
router.get("/", verifyToken, authorizeRoles("admin", "faculty"), getPendingApprovals);
router.post("/", verifyToken, authorizeRoles("admin", "faculty"), approveAction);

module.exports = router;
