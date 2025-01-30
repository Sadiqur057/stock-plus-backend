const authServices = require("./auth.service");

const registerUser = async (req, res) => {
  const data = req.body;
  const result = await authServices.registerNewUser(data);
  res.send(result);
};

const loginUser = async (req, res) => {
  const data = req.body;
  const result = await authServices.verifyUserLogin(data);
  res.send(result);
};

module.exports = { registerUser, loginUser };
