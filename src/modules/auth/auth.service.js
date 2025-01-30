const { createToken } = require("../../middleware/authorization");
const { DB, userCollection } = require("../../models/db");
const { hashPassword, comparePassword } = require("../../utils/passwordHash");

const registerNewUser = async (data) => {
  const { email, password, name } = data;
  if (!email || !password || !name) {
    return ({
      success: false,
      message: "Register Failed! Please fill up all the fields.",
    });
  }

  try {
    const existingUser = await userCollection.findOne({ email: data?.email });
    if (existingUser) {
      return {
        success: false,
        message: "Register Failed. User with this email already exists.",
      };
    }
    const encryptedPassword = await hashPassword(password);
    const user = {
      email,
      name,
      password: encryptedPassword,
      created_at: new Date().toLocaleDateString(),
      role: "user",
      isVerified: false,
    };

    const result = await userCollection.insertOne(user);
    const token = createToken(user);
    if (result?.insertedId) {
      return {
        success: true,
        message: "Registration Successful.",
        token: token,
      };
    } else {
      return {
        success: false,
        message: "Registration Failed. Please try again",
      };
    }
  } catch (error) {
    console.log(error);
  }
};

const verifyUserLogin = async (data) => {
  const { email, password } = data;
  const filter = { email: email };
  const user = await userCollection.findOne(filter);
  if (!user) {
    return { success: false, message: "Failed. User does not exist." };
  }
  const verifyPassword = await comparePassword(password, user?.password);
  if (!verifyPassword) {
    return {
      success: false,
      message: "Failed. Incorrect credentials.",
    };
  }
  const token = createToken(user);
  return { success: true, message: "Login Successful.", token: token };
};

const authServices = { registerNewUser, verifyUserLogin };

module.exports = authServices;
