const { ObjectId } = require("mongodb");
const { transactionCollection } = require("../../models/db");
const { getDurationDates, toISOStringDate } = require("../../utils/utility");

const getAllTransaction = async (user, params) => {
  const query = { company_email: user?.company_email };
  const {
    limit,
    page,
    payment_method,
    payment_type,
    start_date,
    end_date,
    duration,
  } = params;
  const skip = (page - 1) * limit;
  if (payment_method && payment_method!=="all") {
    query.payment_method = payment_method;
  }
  if (payment_type && payment_type!=="all") {
    query.transaction_desc = payment_type;
  }
  if (start_date && end_date) {
    query.created_at = {
      $gte: toISOStringDate(start_date),
      $lte: toISOStringDate(end_date),
    };
  } else if (duration) {
    const dateRange = getDurationDates(duration);
    if (dateRange) {
      query.created_at = dateRange;
    }
  }
  const cursor = transactionCollection
    .find(query)
    .limit(parseInt(limit))
    .skip(parseInt(skip))
    .sort({ _id: -1 });
  const result = await cursor.toArray();
  if (!result) {
    return {
      success: false,
      message: "No transaction found",
    };
  }
  const totalDocuments = await transactionCollection.countDocuments(query);
  const totalPages = Math.ceil(totalDocuments / limit);
  const updatedData = {
    transactions: result,
    pagination: {
      totalPages,
      totalDocuments,
    },
  };
  return {
    success: true,
    message: "Transaction fetched successfully",
    data: updatedData,
  };
};

const saveTransactionToDB = async (data, user) => {
  const updatedData = {
    ...data,
    company_email: user?.company_email,
    created_by_email: user?.email,
    created_by_name: user?.name,
    transaction_desc: data?.transaction_desc || "sales",
    transaction_type: data?.transaction_type || "in",
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
