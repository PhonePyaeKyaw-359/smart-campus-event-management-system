const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const { getAuditLogs } = require("../controllers/auditController");

router.get("/", verifyToken, authorizeRoles("admin"), getAuditLogs);

module.exports = router;