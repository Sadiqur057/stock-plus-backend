const { ObjectId } = require("mongodb");
const { revenueCollection } = require("../../models/db");

const getAllRevenue = async (user) => {
  const query = { company_email: user?.company_email };
  const cursor = revenueCollection.find(query).sort({ _id: -1 });
  const result = await cursor.toArray();
  return result;
};

const saveRevenueToDB = async (data, user) => {
  const updatedData = {
    ...data,
    company_email: user?.company_email,
    created_by_email: user?.email,
    created_by_name: user?.name
  };
  const result = await revenueCollection.insertOne(updatedData);
  return result;
};

const getSingleRevenue = async (revenueId) => {
  const filter = { _id: new ObjectId(revenueId) };
  const result = await revenueCollection.findOne(filter);
  return result;
};

const deleteRevenueFromDB = async (revenueId) => {
  const filter = { _id: new ObjectId(revenueId) };
  const result = await revenueCollection.deleteOne(filter);
  return result;
};

const updateRevenueDetails = async (data, revenueId) => {
  const filter = { _id: new ObjectId(revenueId) };
  const updatedDoc = {
    $set: data,
  };
  const result = await revenueCollection.updateOne(filter, updatedDoc);
  return result;
};

const services = {
  saveRevenueToDB,
  getAllRevenue,
  getSingleRevenue,
  updateRevenueDetails,
  deleteRevenueFromDB,
};
module.exports = services;
