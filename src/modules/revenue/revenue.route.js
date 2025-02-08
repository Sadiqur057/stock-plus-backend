const express = require("express");
const { verifyToken } = require("../../middleware/authorization");
const {
  addRevenue,
  getRevenues,
  getRevenue,
  updateRevenue,
  deleteRevenue,
} = require("./revenue.controller");
const router = express.Router();

module.exports = router;

router.post("/add-revenue", verifyToken, addRevenue);

router.get("/revenues", verifyToken, getRevenues);

router.patch("/update-revenue/:id", verifyToken, updateRevenue);

router.delete("/delete-revenue/:id", verifyToken, deleteRevenue);

router.get("/revenue/:id", verifyToken, getRevenue);
