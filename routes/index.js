const jwt = require("jsonwebtoken");
const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();

const User = require("../models/user");

router.route("/").get((req, res) => {
  res.sendStatus(200);
});

const secret = "THIS IS SUPER SECRET";

const isAuthenticated = async (username, password) => {
  try {
    const user = await User.findOne({ username });
    if (!user) return false;
    return await bcrypt.compare(password, user.password);
  } catch {
    return false;
  }
};

router
  .route("/token")
  .get(async (req, res) => {
    const { username, password } = req.body;

    const user = await isAuthenticated(username, password);
    if (!user) return res.status(401).end();

    const payload = { username };
    const token = await jwt.sign(payload, secret, { expiresIn: "24h" });

    return res.status(200).json({ token });
  })
  .post(async (req, res) => {
    if (!req.headers.authorization) {
      res.sendStatus(401);
    }
    const token = req.headers.authorization.split("Bearer ")[1];
    const userData = await jwt.verify(token, secret);
    return res.status(200).json(userData);
  });

router.route("/register").post(async (req, res) => {
  try {
    const user = new User(req.body);
    await User.init();
    await user.save();
    return res.sendStatus(204);
  } catch (err) {
    return res.status(400).json(err);
  }
});

router.route("/login").post(async (req, res) => {
  try {
    const { username, password } = req.body;
    if (await isAuthenticated(username, password)) {
      return res.status(200).end("You are logged in");
    }
    throw new Error("You are not authorized");
  } catch (err) {
    return res.status(401).send(err.message);
  }
});

module.exports = router;
