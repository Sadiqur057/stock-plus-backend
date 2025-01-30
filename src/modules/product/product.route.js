const express = require("express");
const { getProducts, addProduct } = require("./product.controller");
const { verifyToken } = require("../../middleware/authorization");
const router = express.Router();

router.get("/", (req, res) => {
  res.send("Hello World");
});

router.get("/products", verifyToken, getProducts);

router.post("/add-product", verifyToken, addProduct);

module.exports = router;
