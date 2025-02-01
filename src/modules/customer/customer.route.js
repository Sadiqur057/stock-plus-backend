const express = require("express");
const { verifyToken } = require("../../middleware/authorization");
const {
  addCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
} = require("./customer.controller");
const router = express.Router();

module.exports = router;

router.post("/add-customer", verifyToken, addCustomer);

router.get("/customers", verifyToken, getCustomers);

router.patch("/update-customer/:id", verifyToken, updateCustomer);

router.delete("/delete-customer/:id", verifyToken, deleteCustomer);

router.get("/customer/:id", verifyToken, getCustomer);
