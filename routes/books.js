const express = require("express");
const router = express.Router();
const { books } = require("../data/db.json");

router.route("/").get((req, res) => {
  res.send(books);
});

module.exports = router;
