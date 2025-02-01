const express = require("express");
const { verifyToken } = require("../../middleware/authorization");
const {
  addAttribute,
  getAttributes,
  getAttribute,
  updateAttribute,
  deleteAttribute,
} = require("./attribute.controller");
const router = express.Router();

module.exports = router;

router.post("/add-attribute", verifyToken, addAttribute);

router.get("/attributes", verifyToken, getAttributes);

router.patch("/update-attribute/:id", verifyToken, updateAttribute);

router.delete("/delete-attribute/:id", verifyToken, deleteAttribute);

router.get("/attribute/:id", verifyToken, getAttribute);
