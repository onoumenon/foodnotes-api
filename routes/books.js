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
      res.json(filterBooksBy("title", title));
    } else if (author) {
      res.json(filterBooksBy("author", author));
    } else {
      res.json(books);
    }
  })
  .post(verifyToken, (req, res) => {
    const book = new Book(req.body);
    book.save(err => {
      if (err) return res.status(500).send(err);
      return res.status(201).json(book);
    });
  });

router
  .route("/:id")
  .put((req, res) => {
    const book = books.find(b => b.id === req.params.id);
    if (book) {
      res.status(202).json(req.body);
    } else {
      res.sendStatus(400);
    }
  })
  .delete((req, res) => {
    const book = books.find(b => b.id === req.params.id);
    if (book) {
      res.sendStatus(202);
    } else {
      res.sendStatus(400);
    }
  });

module.exports = router;
