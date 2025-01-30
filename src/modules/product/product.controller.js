const { productCollection } = require("../../models/db");
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
  const result = await productServices.addNewProduct(data, user);

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

module.exports = { getProducts, addProduct };
