const { ObjectId } = require("mongodb");
const { attributeCollection } = require("../../models/db");

const getAllAttribute = async (user, params) => {
  const query = { company_email: user?.company_email };
  const { limit, page } = params || {};
  const skip = (page - 1) * limit;
  const cursor = attributeCollection
    .find(query)
    .skip(parseInt(skip))
    .limit(parseInt(limit))
    .sort({ _id: -1 });
  const result = await cursor.toArray();
  if (!result) {
    return {
      success: false,
      message: "No attribute found",
    };
  }
  const totalDocuments = await attributeCollection.countDocuments(query);
  const totalPages = Math.ceil(totalDocuments / limit);
  const updatedData = {
    attributes: result,
    pagination: {
      totalDocuments,
      totalPages,
    },
  };
  return {
    success: true,
    message: "Attribute fetched successfully",
    data: updatedData,
  };
};

const saveAttributeToDB = async (data, user) => {
  const updatedData = {
    ...data,
    company_email: user?.company_email,
    created_by_email: user?.email,
    created_by_name: user?.name,
    created_at: new Date(),
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
