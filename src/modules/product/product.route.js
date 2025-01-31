const express = require("express");
const {
  getProducts,
  addProduct,
  getProductDetails,
  deleteProduct,
  updateProduct,
} = require("./product.controller");
const { verifyToken } = require("../../middleware/authorization");
const router = express.Router();

router.get("/", (req, res) => {
  res.send("Hello World");
});

router.get("/products", verifyToken, getProducts);

router.post("/add-product", verifyToken, addProduct);

router.get("/product/:id", verifyToken, getProductDetails);

router.delete("/product/:id", verifyToken, deleteProduct);

router.patch("/update-product/:id", verifyToken, updateProduct);

module.exports = router;
