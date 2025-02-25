const express = require("express");
const {
  createInvoice,
  getInvoices,
  getInvoice,
  createTransaction,
  deleteInvoice,
} = require("./invoice.controller");
const { verifyToken } = require("../../middleware/authorization");
const router = express.Router();

router.post("/create-invoice", verifyToken, createInvoice);

router.get("/invoices", verifyToken, getInvoices);

router.get("/invoice/:id", verifyToken, getInvoice);

router.delete("/delete-invoice/:id", verifyToken, deleteInvoice);

router.patch("/create-transaction/:id", verifyToken, createTransaction);

module.exports = router;
