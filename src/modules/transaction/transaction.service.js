const { ObjectId } = require("mongodb");
const { transactionCollection } = require("../../models/db");

const getAllTransaction = async (user) => {
  const query = { added_by: user?.email };
  const cursor = transactionCollection.find(query).sort({ _id: -1 });
  const result = await cursor.toArray();
  return result;
};

const saveTransactionToDB = async (data, user) => {
  const updatedData = {
    ...data,
    added_by: user?.email,
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
