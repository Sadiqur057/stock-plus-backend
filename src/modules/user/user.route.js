const express = require("express");
const { getUser, updateAccount, getVatRate } = require("./user.controller");
const { verifyToken } = require("../../middleware/authorization");
const router = express.Router();

router.get("/user", verifyToken, getUser);
router.patch("/update-account", verifyToken, updateAccount);
router.get("/vat", verifyToken, getVatRate)
module.exports = router;
