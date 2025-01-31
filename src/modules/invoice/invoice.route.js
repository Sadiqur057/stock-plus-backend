const express = require("express");
const {
  createInvoice,
  getInvoices,
  getInvoice,
} = require("./invoice.controller");
const { verifyToken } = require("../../middleware/authorization");
const router = express.Router();

router.post("/create-invoice", verifyToken, createInvoice);

router.get("/invoices", verifyToken, getInvoices);

router.get("/invoice/:id", verifyToken, getInvoice);

module.exports = router;
