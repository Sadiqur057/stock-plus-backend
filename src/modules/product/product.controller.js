const { productCollection } = require("../../models/db");
const { getUserDetails } = require("../user/user.service");
const productServices = require("./product.service");

const getProducts = async (req, res) => {
  console.log("Hello there");
  const result = await productServices.getAllProducts(req.user);
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

module.exports = { getProducts, addProduct, getProductDetails, deleteProduct };
