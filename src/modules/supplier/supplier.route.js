const express = require("express");
const { verifyToken } = require("../../middleware/authorization");
const {
  addSupplier,
  getSuppliers,
  getSupplier,
  updateSupplier,
  deleteSupplier,
} = require("./supplier.controller");
const router = express.Router();

module.exports = router;

router.post("/add-supplier", verifyToken, addSupplier);

router.get("/suppliers", verifyToken, getSuppliers);

router.patch("/update-supplier/:id", verifyToken, updateSupplier);

router.delete("/delete-supplier/:id", verifyToken, deleteSupplier);

router.get("/supplier/:id", verifyToken, getSupplier);
