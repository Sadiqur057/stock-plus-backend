const { ObjectId } = require("mongodb");
const { attributeCollection } = require("../../models/db");

const getAllAttribute = async (user) => {
  const query = { company_email: user?.company_email };
  const cursor = attributeCollection.find(query);
  const result = await cursor.toArray();
  return result;
};

const saveAttributeToDB = async (data, user) => {
  const updatedData = {
    ...data,
    company_email: user?.company_email,
    created_by_email: user?.email,
    created_by_name: user?.name
  };
  const result = await attributeCollection.insertOne(updatedData);
  return result;
};

const getSingleAttribute = async (attributeId) => {
  const filter = { _id: new ObjectId(attributeId) };
  const result = await attributeCollection.findOne(filter);
  return result;
};

const deleteAttributeFromDB = async (attributeId) => {
  const filter = { _id: new ObjectId(attributeId) };
  const result = await attributeCollection.deleteOne(filter);
  return result;
};

const updateAttributeDetails = async (data, attributeId) => {
  const filter = { _id: new ObjectId(attributeId) };
  const updatedDoc = {
    $set: data,
  };
  const result = await attributeCollection.updateOne(filter, updatedDoc);
  return result;
};

const services = {
  saveAttributeToDB,
  getAllAttribute,
  getSingleAttribute,
  updateAttributeDetails,
  deleteAttributeFromDB,
};
module.exports = services;
