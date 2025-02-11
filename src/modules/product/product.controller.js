const { ObjectId } = require("mongodb");
const {
  productCollection,
  attributeCollection,
  client,
} = require("../../models/db");
const { getUserDetails } = require("../user/user.service");
const productServices = require("./product.service");

const getProducts = async (req, res) => {
  const user = req.user;
  const filters = req.query;
  const result = await productServices.getAllProducts(user, filters);
  return res.send({
    success: true,
    message: "Successfully fetched data",
    data: result,
  });
};

const addProduct = async (req, res) => {
  const data = req.body;
  const user = req.user;

  if (!data?.productName || !data?.company) {
    return res.send({
      success: false,
      message: "Please fill all the required fields",
    });
  }

  const result = await productServices.addNewProduct(data, user);
  console.log("lets", result);
  return res.send(result);
};

const updateProduct = async (req, res) => {
  const data = req.body;
  const productId = req.params.id;
  const user = req.user;

  if (!data || !productId) {
    return res.send({
      success: false,
      message: "Missing required fields.",
    });
  }
  console.log("checking", data);
  const result = await productServices.updateExistingProduct(
    data,
    productId,
    user
  );
  res.send(result);
};

const updateStock = async (req, res) => {
  const data = req.body;
  const productId = req.params.id;

  const result = await productServices.updateExistingProductStock(
    data,
    productId
  );

  return res.send(result);
};

const getProductDetails = async (req, res) => {
  const id = req.params.id;
  const result = await productServices.getSingleProduct(id);
  if (!result?._id) {
    return res.send({ success: false, message: "Something went wrong." });
  }
  res.send({
    success: true,
    message: "Product fetched successfully",
    data: result,
  });
};

const deleteProduct = async (req, res) => {
  const id = req.params.id;
  const result = await productServices.deleteProduct(id);
  if (!result?.deletedCount) {
    return res.send({
      success: false,
      message: "Something went wrong.",
    });
  }
  res.send({
    success: true,
    message: "Product deleted successfully",
  });
};

module.exports = {
  getProducts,
  addProduct,
  getProductDetails,
  deleteProduct,
  updateProduct,
  updateStock,
};
