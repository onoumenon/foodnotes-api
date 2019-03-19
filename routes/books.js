const uuid = require("uuid/v4");
const express = require("express");
const router = express.Router();
const { books } = require("../data/db.json");

const Book = require("../models/book");

const filterBooksBy = (property, value) => {
  return books.filter(b => b[property] === value);
};

const verifyToken = (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    res.sendStatus(403);
  } else {
    if (authorization === "Bearer my-awesome-token") {
      next();
    } else {
      res.sendStatus(403);
    }
  }
};

router
  .route("/")
  .get((req, res) => {
    const { author, title } = req.query;

    if (title) {
      return Book.find({ title }).then(book => res.json(book));
    }

    if (author) {
      return Book.find({ author }).then(book => res.json(book));
    }

    return Book.find().then(book => res.json(book));
  })
  .post(verifyToken, (req, res) => {
    const book = new Book(req.body);
    book.save((err, book) => {
      if (err) {
        return res.status(500).end();
      }
      return res.status(201).json(book);
    });
  });

router
  .route("/:id")
  .put((req, res) => {
    Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
      (err, book) => {
        return res.status(202).json(book);
      }
    );
  })
  .delete((req, res) => {
    Book.findByIdAndDelete(req.params.id, (err, book) => {
      if (err) {
        return res.sendStatus(500);
      }
      if (!book) {
        return res.sendStatus(404);
      }
      return res.sendStatus(202);
    });
  });

module.exports = router;
