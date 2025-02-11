const { userCollection } = require("../../models/db");
const userServices = require("./user.service");

const getUser = async (req, res) => {
  const user = req.user;
  const targetUser = await userServices.getUserDetails(user);
  return res.send({
    success: true,
    message: "User details fetched successfully",
    data: targetUser,
  });
};

const updateAccount = async (req, res) => {
  const user = req.user;
  const data = req.body;
  const result = await userServices.updateUserDetails(user, data);
  if (!result?.acknowledged) {
    res.send({
      success: false,
      message: "Something went wrong! Please try again",
    });
  }
  return res.send({
    success: true,
    message: "Your account information updated successfully.",
  });
};

const getVatRate = async (req, res) => {
  const user = req.user;
  try {
    const query = { company_email: user?.company_email };
    const result = await userCollection.findOne(query);
    if (result) {
      res.send({
        success: true,
        message: "successful",
        vat_rate: result?.company_vat_rate,
      });
    }
  } catch (error) {
    console.error(error);
  }
};

module.exports = { getUser, updateAccount, getVatRate };
