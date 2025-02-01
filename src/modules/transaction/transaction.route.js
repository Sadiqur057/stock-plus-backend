const express = require("express");
const { verifyToken } = require("../../middleware/authorization");
const {
  addTransaction,
  getTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
} = require("./transaction.controller");
const router = express.Router();

module.exports = router;

router.post("/add-transaction", verifyToken, addTransaction);

router.get("/transactions", verifyToken, getTransactions);

router.patch("/update-transaction/:id", verifyToken, updateTransaction);

router.delete("/delete-transaction/:id", verifyToken, deleteTransaction);

router.get("/transaction/:id", verifyToken, getTransaction);
