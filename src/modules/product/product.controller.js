const { ObjectId } = require("mongodb");
const { productCollection } = require("../../models/db");
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
  if (!data?.productName || !data?.company || !data?.quantity) {
    return res.send({
      success: false,
      message: "Please fill all the required field",
    });
  }

  const targetUser = await getUserDetails(user);

  const result = await productServices.addNewProduct(data, targetUser);

  if (result?.insertedId) {
    return res.send({
      success: true,
      message: "Product Added Successfully",
      data: data,
    });
  } else {
    return res.send({
      success: false,
      message: "Something went wrong! Please try again.",
    });
  }
};

const updateProduct = async (req, res) => {
  const data = req.body;
  const productId = req.params.id;
  const result = await productServices.updateExistingProduct(data, productId);
  if (!result?.modifiedCount) {
    res.send({
      success: false,
      message: "Product cannot be updated",
    });
  }
  res.send({
    success: true,
    message: "Product updated successfully",
  });
  return result;
};

const updateStock = async (req, res) => {
  const data = req.body;
  const productId = req.params.id;

  const result = await productServices.updateExistingProductStock(
    data,
    productId
  );
  if (!result?.modifiedCount) {
    res.send({
      success: false,
      message: "Product cannot be updated",
    });
  }
  res.send({
    success: true,
    message: "Product updated successfully",
  });
  return result;
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
  console.log("I got the id", id);
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
  updateStock
};
