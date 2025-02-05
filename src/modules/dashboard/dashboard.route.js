const express = require("express");
const { verifyToken } = require("../../middleware/authorization");
const { getDashboardData } = require("./dashboard.controller");
const router = express.Router();

router.get("/dashboard", verifyToken, getDashboardData);

module.exports = router;
