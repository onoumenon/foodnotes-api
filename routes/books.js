const express = require("express");
const router = express.Router();
const { books } = require("../data/db.json");

router
  .route("/")
  .get((req, res) => {
    const title = req.query.title;
    if (title) {
      const filteredBooks = books.filter(b => b.title === title);
      res.send(filteredBooks);
    } else {
      res.json(books);
    }
  })
  .post((req, res) => {
    res.send(201);
  });

router
  .route("/:id")
  .put((req, res) => {
    res.send(202);
  })
  .delete((req, res) => {
    res.send(202);
  });

module.exports = router;
