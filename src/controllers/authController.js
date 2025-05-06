const bcrypt = require("bcrypt");
const User = require("../Models/userModel");
const jwt = require("jsonwebtoken");
const generateToken = require("../utils/generateToken");
require('dotenv').config(); 

const signup = async (req, res) => {
  try {
    const data = req.body;
    const { username, password, email } = data;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const createduser = new User({
      username: username,
      password: hashedPassword,
      email: email,
    });
    /*Remove the saveuser variable
     fixed issue: Remove the declaration of the unused 'saveuser' variable. (https://sonarcloud.io/project/issues?open=AZaZzF5yxttRV5zrRk8x&id=charlizeaponte_SQFinal)
     and Remove this useless assignment to variable "saveuser" (https://sonarcloud.io/project/issues?open=AZaZzF5yxttRV5zrRk8y&id=charlizeaponte_SQFinal)
    */
    await createduser.save();
    res.status(200).send({
      status: "success",
      message: "user saved successfully",
      data: {
        user: username,
      },
    });
  } catch (e) {
    res.status(500).send({
      status: "failure",
      message: e.message,
    });
  }
};
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
     /*
     fixed issue: Change this code to not construct database queries directly from user-controlled data. (https://sonarcloud.io/project/issues?open=AZaZzF5yxttRV5zrRk82&id=charlizeaponte_SQFinal)
    */
    const user = await User.findOne({ username: { $eq: username } });
    if (!user) {
      return res.status(401).send({
        status: "failure",
        message: "user does not exist",
      });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).send({
        status: "failure",
        message: "password is incorrect",
      });
    }
    const accessToken = generateToken.generateAccessToken(user);
    const refreshToken = generateToken.generateRefreshToken(user);
    await User.findByIdAndUpdate(user._id, {
      jwtToken: refreshToken,
    });
    /* Removed newpass 
    Fixed Issue : Remove the declaration of the unused 'newpass' variable. (https://sonarcloud.io/project/issues?open=AZaZzF5yxttRV5zrRk8z&id=charlizeaponte_SQFinal)
     */
    const { jwtToken, ...other } = user._doc;
    res.status(200).send({
      status: "success",
      message: "logged in successfully",
      data: other,
      accessToken,
      refreshToken,
    });
  } catch (e) {
    res.status(500).send({
      status: "failure",
      message: e.message,
    });
  }
};
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      /*Fixed Issue: Change this code to not construct database queries directly from user-controlled data.
(https://sonarcloud.io/project/issues?open=AZaZzF5yxttRV5zrRk80&id=charlizeaponte_SQFinal)
      */ 
      await User.updateOne({ jwtToken: refreshToken }, { $unset: ["jwtToken"] }); 
      res.status(200).send({
        status: "success",
        message: "You've been logged out",
      });
    } else {
      return res.status(400).send({
        status: "failure",
        message: "logout error",
      });
    }
  } catch (e) {
    res.status(500).send({
      status: "failure",
      message: e.message,
    });
  }
};
const verify = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(403).json("You are not authorized");
  }
  const token = authHeader.split(" ")[1];
  try {
    if (authHeader) {
      jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
          throw new Error("token is not valid!");
        }
        req.user = user;
        next();
      });
    }
  } catch (e) {
    res.status(500).send({
      status: "failure",
      message: e.message,
    });
  }
};
const refresh = async (req, res) => {
  const refreshToken = req.body.token;
  if (!refreshToken) {
    res.status(401).send({
      status: "failure",
      message: "You are not authenticated!",
    });
  }
  try {
    /*Fixed Issue: Change this code to not construct database queries directly from user-controlled data. (https://sonarcloud.io/project/issues?open=AZaZzF5yxttRV5zrRk81&id=charlizeaponte_SQFinal)
    */
    const token = await User.findOne(       
      { jwtToken: refreshToken },
      { jwtToken: true }
    );
    if (!token) {
      res.status(200).send({
        status: "failure",
        message: "Refresh token is not valid!",
      });
    }
    jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET,
      async (err, user) => {
        if (err) {
          throw new Error("token is not valid!");
        }
        const newAccessToken = generateToken.generateAccessToken(user);
        const newRefreshToken = generateToken.generateRefreshToken(user);
        await User.updateOne(
          { jwtToken: refreshToken },
          { $set: { jwtToken: newRefreshToken } }
        );
        res.status(200).json({
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        });
      }
    );
  } catch (e) {
    res.status(500).send({
      status: "failure",
      message: e.message,
    });
  }
};

module.exports = {
  signup,
  login,
  logout,
  verify,
  refresh,
};
