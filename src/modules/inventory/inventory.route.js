const express = require("express");
const { verifyToken } = require("../../middleware/authorization");
const { addItems, getItems } = require("./inventory.controller");
const router = express.Router();

router.post("/add-items", verifyToken, addItems);
router.get("/get-items", verifyToken, getItems);

module.exports = router;
