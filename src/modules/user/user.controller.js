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

module.exports = { getUser, updateAccount };
