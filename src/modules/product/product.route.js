const express = require("express");
const {
  getProducts,
  addProduct,
  getProductDetails,
  deleteProduct,
  updateProduct,
  updateStock,
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

router.patch("/add-stock/:id", verifyToken, updateStock);

module.exports = router;
