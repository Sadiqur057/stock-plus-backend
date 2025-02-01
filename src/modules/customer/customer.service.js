const { ObjectId } = require("mongodb");
const { customerCollection } = require("../../models/db");

const getAllCustomer = async (user) => {
  const query = { added_by: user?.email };
  const cursor = customerCollection.find(query);
  const result = await cursor.toArray();
  return result;
};

const saveCustomerToDB = async (data, user) => {
  const updatedData = {
    ...data,
    added_by: user?.email,
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
  deleteCustomerFromDB
};
module.exports = services;
