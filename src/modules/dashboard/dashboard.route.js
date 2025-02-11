const express = require("express");
const { verifyToken } = require("../../middleware/authorization");
const {
  getDashboardData,
  getAccountingData,
  getCurrenciesData,
} = require("./dashboard.controller");
const router = express.Router();

router.get("/dashboard", verifyToken, getDashboardData);
router.get("/accounting", verifyToken, getAccountingData);
router.get("/currencies", getCurrenciesData);

module.exports = router;
