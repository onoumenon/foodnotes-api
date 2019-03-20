const jwt = require("jsonwebtoken");
const express = require("express");
const router = express.Router();

router.route("/").get((req, res) => {
  res.sendStatus(200);
});

const secret = "THIS IS SUPER SECRET";

router
  .route("/token")
  .get(async (req, res) => {
    const userData = { _id: "123" };
    const expiresIn1hour = { expiresIn: "24h" };
    const token = await jwt.sign(userData, secret, expiresIn1hour);
    return res.status(200).json({
      token
    });
  })
  .post(async (req, res) => {
    if (!req.headers.authorization) {
      res.sendStatus(401);
    }
    const token = req.headers.authorization.split("Bearer ")[1];
    const userData = await jwt.verify(token, secret);
    return res.status(200).json(userData);
  });

module.exports = router;
