const express = require("express");
const { verifyToken } = require("../../middleware/authorization");
const {
  getDashboardData,
  getAccountingData,
} = require("./dashboard.controller");
const router = express.Router();

router.get("/dashboard", verifyToken, getDashboardData);
router.get("/accounting", verifyToken, getAccountingData);

module.exports = router;
