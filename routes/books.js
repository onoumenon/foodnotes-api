const uuid = require("uuid/v4");
const express = require("express");
const jwt = require("jsonwebtoken");
const Book = require("../models/book");
const User = require("../models/user");

const router = express.Router();

const oldVerifyToken = (req, res, next) => {
  const { authorization } = req.headers;

  if (authorization && authorization === "Bearer my-awesome-token") {
    return next();
  }

  return res.sendStatus(403);
};

const verifyToken = async (req, res, next) => {
  if (!req.headers.authorization) {
    return res.sendStatus(403);
  }

  try {
    const token = req.headers.authorization.split("Bearer ")[1];
    console.log(token);
    const data = await jwt.verify(token, "THIS IS SUPER SECRET");
    return next();
  } catch {
    return res.sendStatus(403);
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
