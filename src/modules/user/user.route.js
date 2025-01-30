const express = require("express");
const { getUser, updateAccount } = require("./user.controller");
const { verifyToken } = require("../../middleware/authorization");
const router = express.Router();

router.get("/user", verifyToken, getUser);
router.patch("/update-account", verifyToken, updateAccount);

module.exports = router;
