const { ObjectId } = require("mongodb");
const { supplierCollection } = require("../../models/db");

const getAllSupplier = async (user, params) => {
  const query = { company_email: user?.company_email };
  const { limit, page } = params || {};
  const skip = (page - 1) * limit;
  const cursor = supplierCollection
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
  const totalDocuments = await supplierCollection.countDocuments(query);
  const totalPages = Math.ceil(totalDocuments / limit);
  const updatedData = {
    suppliers: result,
    pagination: {
      totalDocuments,
      totalPages,
    },
  };
  return {
    success: true,
    message: "Supplier fetched successfully",
    data: updatedData,
  };
};

const saveSupplierToDB = async (data, user) => {
  const updatedData = {
    ...data,
    company_email: user?.company_email,
    created_by_email: user?.email,
    created_by_name: user?.name,
    created_at: new Date(),
  };
  const result = await supplierCollection.insertOne(updatedData);
  return result;
};

const getSingleSupplier = async (supplierId) => {
  const filter = { _id: new ObjectId(supplierId) };
  const result = await supplierCollection.findOne(filter);
  return result;
};

const deleteSupplierFromDB = async (supplierId) => {
  const filter = { _id: new ObjectId(supplierId) };
  const result = await supplierCollection.deleteOne(filter);
  return result;
};

const updateSupplierDetails = async (data, supplierId) => {
  const filter = { _id: new ObjectId(supplierId) };
  const updatedDoc = {
    $set: data,
  };
  const result = await supplierCollection.updateOne(filter, updatedDoc);
  return result;
};

const services = {
  saveSupplierToDB,
  getAllSupplier,
  getSingleSupplier,
  updateSupplierDetails,
  deleteSupplierFromDB,
};
module.exports = services;
