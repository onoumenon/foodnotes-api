const jwt = require("jsonwebtoken");
const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();

const User = require("../models/user");

router.route("/").get((req, res) => {
  res.sendStatus(200);
});

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const secret = process.env.SECRET;

const isAuthenticated = async (username, password) => {
  try {
    const user = await User.findOne({ username });
    if (!user) return false;
    return await bcrypt.compare(password, user.password);
  } catch {
    return false;
  }
};

router.route("/token").post(async (req, res) => {
  if (!req.headers.authorization) {
    res.sendStatus(401);
  }
  const token = req.headers.authorization.split("Bearer ")[1];
  const userData = await jwt.verify(token, secret);
  if (!userData) {
    res.sendStatus(401);
  }
  return res.status(200).json(userData);
});

router.route("/register").post(async (req, res) => {
  try {
    const user = new User(req.body);
    await User.init();
    await user.save();
    const { username, password } = req.body;
    const validLogin = await isAuthenticated(username, password);
    if (!validLogin) {
      throw new Error("Sorry, something went wrong. Please try again.");
    }
    const payload = { username };
    const token = await jwt.sign(payload, secret, {
      expiresIn: "240h"
    });
    return res.status(200).json({ token });
  } catch (err) {
    return res.status(400).send(err.message);
  }
});

router.route("/login").post(async (req, res) => {
  try {
    const { username, password } = req.body;
    const validLogin = await isAuthenticated(username, password);
    if (!validLogin) {
      throw new Error("Wrong Username/ Password");
    }
    const payload = { username };
    const token = await jwt.sign(payload, secret, { expiresIn: "240h" });
    return res.status(200).json({ token });
  } catch (err) {
    return res.status(401).send(err.message);
  }
});

module.exports = router;
