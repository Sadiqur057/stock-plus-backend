const { ObjectId } = require("mongodb");
const { revenueCollection } = require("../../models/db");

const getAllRevenue = async (user, params) => {
  const query = { company_email: user?.company_email };
  const { limit, page } = params;
  const skip = (page - 1) * limit;
  const cursor = revenueCollection
    .find(query)
    .limit(parseInt(limit))
    .skip(skip)
    .sort({ _id: -1 });
  const result = await cursor.toArray();
  if (!result) {
    return {
      success: false,
      message: "No revenue found",
    };
  }
  const countDocuments = await revenueCollection.countDocuments(query);
  const totalPages = Math.ceil(countDocuments / limit);
  const updatedData = {
    revenues: result,
    success: true,
    message: "Revenues fetched successfully",
    pagination: {
      countDocuments,
      totalPages,
    },
  };
  return {
    success: true,
    message: "Revenue fetched successfully",
    data: updatedData,
  };
};

const saveRevenueToDB = async (data, user) => {
  const updatedData = {
    ...data,
    company_email: user?.company_email,
    created_by_email: user?.email,
    created_by_name: user?.name,
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
