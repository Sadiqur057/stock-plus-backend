const { ObjectId } = require("mongodb");
const { productCollection } = require("../../models/db");
const { getProductDetails } = require("./product.controller");
const addNewProduct = async (data, user) => {
  const productData = {
    ...data,
    salePrice: Number(data?.salePrice),
    purchasePrice: Number(data?.purchasePrice),
    quantity: Number(data?.quantity),
    added_by: user?.name,
    user_email: user?.email,
  };
  const result = await productCollection.insertOne(productData);
  return result;
};

const updateExistingProduct = async (data, productId) => {
  const filter = { _id: new ObjectId(productId) };
  const updatedData = {
    ...data,
    salePrice: Number(data?.salePrice),
    purchasePrice: Number(data?.purchasePrice),
    quantity: Number(data?.quantity),
  };
  const updatedDoc = {
    $set: updatedData,
  };
  const result = await productCollection.updateOne(filter, updatedDoc);
  return result;
};

const getAllProducts = async (user, filters) => {
  const { search, filter, sort } = filters;
  const query = { user_email: user.email };

  if (filter && filter !== "all") {
    if (filter === "stockOut") {
      query.quantity = { $eq: 0 };
    } else if (filter === "inStock") {
      query.quantity = { $ne: 0 };
    }
  }

  if (search) {
    query.$or = [
      { productName: { $regex: search, $options: "i" } },
      { company: { $regex: search, $options: "i" } },
    ];
  }

  let sortOptions = { _id: -1 };

  if (sort === "price-asc") {
    sortOptions = { salePrice: 1 };
  } else if (sort === "price-desc") {
    sortOptions = { salePrice: -1 };
  } else if (sort === "quantity-asc") {
    sortOptions = { quantity: 1 };
  } else if (sort === "quantity-desc") {
    sortOptions = { quantity: -1 };
  } else if (sort === "date-desc") {
    sortOptions = { created_at: 1 };
  } else if (sort === "date-desc") {
    sortOptions = { created_at: -1 };
  }

  const cursor = productCollection.find(query).sort(sortOptions);
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
  console.log(result);
  return result;
};

const productServices = {
  addNewProduct,
  getAllProducts,
  getSingleProduct,
  getProductDetails,
  deleteProduct,
  updateExistingProduct,
};

module.exports = productServices;
