const { ObjectId } = require("mongodb");
const { customerCollection } = require("../../models/db");

const getAllCustomer = async (user, params) => {
  const query = { company_email: user?.company_email };
  const { limit, page } = params || {};
  const skip = (page - 1) * limit;
  const cursor = customerCollection
    .find(query)
    .skip(parseInt(skip))
    .limit(parseInt(limit))
    .sort({ created_at: -1 });
  const result = await cursor.toArray();

  if (!result) {
    return {
      success: false,
      message: "No user found",
    };
  }
  const totalDocuments = await customerCollection.countDocuments(query);
  const totalPages = Math.ceil(totalDocuments / limit);
  const updatedData = {
    customers: result,
    pagination: {
      totalDocuments,
      totalPages,
    },
  };
  return {
    success: true,
    message: "Customer fetched successfully",
    data: updatedData,
  };
};

const saveCustomerToDB = async (data, user) => {
  const updatedData = {
    ...data,
    company_email: user?.company_email,
    created_by_email: user?.email,
    created_by_name: user?.name,
    created_at: new Date(),
  };
  const result = await customerCollection.insertOne(updatedData);
  return result;
};

const getSingleCustomer = async (customerId) => {
  const filter = { _id: new ObjectId(customerId) };
  const result = await customerCollection.findOne(filter);
  return result;
};

const deleteCustomerFromDB = async (customerId) => {
  const filter = { _id: new ObjectId(customerId) };
  const result = await customerCollection.deleteOne(filter);
  return result;
};

const updateCustomerDetails = async (data, customerId) => {
  const filter = { _id: new ObjectId(customerId) };
  const updatedDoc = {
    $set: data,
  };
  const result = await customerCollection.updateOne(filter, updatedDoc);
  return result;
};

const services = {
  saveCustomerToDB,
  getAllCustomer,
  getSingleCustomer,
  updateCustomerDetails,
  deleteCustomerFromDB,
};
module.exports = services;
