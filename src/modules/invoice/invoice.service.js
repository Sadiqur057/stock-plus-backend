const { ObjectId } = require("mongodb");
const { invoiceCollection } = require("../../models/db");

const saveInvoiceToDB = async (data) => {
  const result = await invoiceCollection.insertOne(data);
  return result;
};

const getAllInvoices = async (user) => {
  const query = { user_email: user?.email };
  const cursor = invoiceCollection.find(query);
  const result = await cursor.toArray();
  return result;
};

const getInvoiceDetails = async (id) => {
  const filter = { _id: new ObjectId(id) };
  const result = await invoiceCollection.findOne(filter);
  return result;
};

const invoiceServices = {
  saveInvoiceToDB,
  getAllInvoices,
  getInvoiceDetails
};
module.exports = invoiceServices;
