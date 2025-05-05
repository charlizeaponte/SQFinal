const jwt = require("jsonwebtoken");
require('dotenv').config(); 

const generateAccessToken = (user) => {
  return jwt.sign(
    { username: user.username, role: user.role, _id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "2s" }
  );
};
const generateRefreshToken = (user) => {
  return jwt.sign(
    { username: user.username, role: user.role, _id: user._id },
    process.env.JWT_REFRESH_SECRET
  );
};

module.exports = { generateAccessToken, generateRefreshToken };
