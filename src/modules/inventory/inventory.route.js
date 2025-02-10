const express = require("express");
const { verifyToken } = require("../../middleware/authorization");
const {
  addItems,
  getItems,
  getInventoryReport,
  deleteInventoryReport,
} = require("./inventory.controller");
const router = express.Router();

router.post("/add-items", verifyToken, addItems);
router.get("/get-items", verifyToken, getItems);
router.get("/inventory-report/:id", verifyToken, getInventoryReport);
router.delete("/delete-report/:id", verifyToken, deleteInventoryReport);

module.exports = router;
