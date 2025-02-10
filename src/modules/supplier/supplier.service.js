const { ObjectId } = require("mongodb");
const { supplierCollection } = require("../../models/db");

const getAllSupplier = async (user) => {
  const query = { company_email: user?.company_email };
  const cursor = supplierCollection.find(query).sort({ _id: -1 });
  const result = await cursor.toArray();
  return result;
};

const saveSupplierToDB = async (data, user) => {
  const updatedData = {
    ...data,
    company_email: user?.company_email,
    created_by_email: user?.email,
    created_by_name: user?.name
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
  deleteSupplierFromDB
};
module.exports = services;
