const { ObjectId } = require("mongodb");
const { transactionCollection } = require("../../models/db");

const getAllTransaction = async (user) => {
  const query = { company_email: user?.company_email };
  const cursor = transactionCollection.find(query).sort({ _id: -1 });
  const result = await cursor.toArray();
  return result;
};

const saveTransactionToDB = async (data, user) => {
  const updatedData = {
    ...data,
    company_email: user?.company_email,
    created_by_email: user?.email,
    created_by_name: user?.name
  };
  const result = await transactionCollection.insertOne(updatedData);
  return result;
};

const getSingleTransaction = async (transactionId) => {
  const filter = { _id: new ObjectId(transactionId) };
  const result = await transactionCollection.findOne(filter);
  return result;
};

const deleteTransactionFromDB = async (transactionId) => {
  const filter = { _id: new ObjectId(transactionId) };
  const result = await transactionCollection.deleteOne(filter);
  return result;
};

const updateTransactionDetails = async (data, transactionId) => {
  const filter = { _id: new ObjectId(transactionId) };
  const updatedDoc = {
    $set: data,
  };
  const result = await transactionCollection.updateOne(filter, updatedDoc);
  return result;
};

const services = {
  saveTransactionToDB,
  getAllTransaction,
  getSingleTransaction,
  updateTransactionDetails,
  deleteTransactionFromDB,
};
module.exports = services;
