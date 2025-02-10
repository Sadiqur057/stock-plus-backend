const { ObjectId } = require("mongodb");
const { inventoryCollection } = require("../../models/db");

const getSingleReport = async (id) => {
  const filter = { _id: new ObjectId(id) };
  const result = await inventoryCollection.findOne(filter);
  return result;
};

const deleteReport = async (id) => {
  const filter = { _id: new ObjectId(id) };
  const result = await inventoryCollection.deleteOne(filter);
  return result;
};
module.exports = { getSingleReport, deleteReport };
