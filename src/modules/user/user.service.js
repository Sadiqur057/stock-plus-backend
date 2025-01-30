const { userCollection } = require("../../models/db");

const getUserDetails = async (user) => {
  const query = { email: user.email };
  const targetUser = await userCollection.findOne(query);
  return targetUser;
};

const updateUserDetails = async (user, data) => {
  const filter = { email: user.email };
  const updatedDocument = {
    $set: data,
  };
  const result = await userCollection.updateOne(filter, updatedDocument);
  return result;
};

const userServices = { getUserDetails, updateUserDetails };
module.exports = userServices;
