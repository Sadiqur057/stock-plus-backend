const { ObjectId } = require("mongodb");
const { productCollection } = require("../../models/db");
const { getProductDetails } = require("./product.controller");
const addNewProduct = async (data, user) => {
  const productData = {
    ...data,
    added_by: user?.name,
    user_email: user?.email,
  };
  const result = await productCollection.insertOne(productData);
  return result;
};

const getAllProducts = async (user) => {
  const query = { user_email: user.email };
  console.log("checking user email", user.email);
  const cursor = productCollection.find(query);
  const result = await cursor.toArray();
  return result;
};

const getSingleProduct = async (id) => {
  const query = { _id: new ObjectId(id) };
  const result = await productCollection.findOne(query);
  return result;
};

const deleteProduct = async (id) => {
  const filter = { _id: new ObjectId(id) };
  const result = await productCollection.deleteOne(filter);
  console.log(result)
  return result
};

const productServices = {
  addNewProduct,
  getAllProducts,
  getSingleProduct,
  getProductDetails,
  deleteProduct
};

module.exports = productServices;
