const { productCollection } = require("../../models/db");
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
  console.log("checking user email",user.email)
  const cursor = productCollection.find(query);
  const result = await cursor.toArray();
  return result;
};

const productServices = { addNewProduct, getAllProducts };

module.exports = productServices;
