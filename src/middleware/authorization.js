var jwt = require("jsonwebtoken");
const jwt_secret = process.env.TOKEN_SECRET;

const createToken = (user) => {
  const tokenData = { email: user?.email, role: user?.role };
  const token = jwt.sign({ tokenData }, jwt_secret, {
    expiresIn: 60 * 60 * 24 * 7,
  });
  return token;
};

const verifyToken = (req, res, next) => {
  const token = req.headers?.authorization?.split(" ")[1];
  if (!req.headers.authorization) {
    return res.status(401).send({
      success: false,
      message: "unauthorized access",
    });
  }
  if (!token) {
    return res.status(401).send({
      success: false,
      message: "unauthorized access",
    });
  }
  jwt.verify(token, jwt_secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        success: false,
        message: "unauthorized access",
      });
    }
    req.user = decoded.tokenData;
    next();
  });
};

module.exports = { createToken, verifyToken };
