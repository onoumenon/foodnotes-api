const express = require("express");
const Place = require("../models/place");
const uuidv1 = require("uuid/v1");

const router = express.Router();

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
    const { notes } = req.query;

    if (notes) {
      return Place.find({ notes }).then(place => res.json(place));
    }

    return Place.find().then(place => res.json(place));
  })
  .post(verifyToken, (req, res) => {
    const place = new Place(req.body);
    place._id = uuidv1();
    place.save((err, place) => {
      if (err) {
        return res.status(500).end();
      }
      return res.status(201).json(place);
    });
  });

router
  .route("/:id")
  .put((req, res) => {
    Place.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
      (err, place) => {
        return res.status(202).json(place);
      }
    );
  })
  .delete((req, res) => {
    Place.findByIdAndDelete(req.params.id, (err, place) => {
      if (err) {
        return res.sendStatus(500);
      }
      if (!place) {
        return res.sendStatus(404);
      }
      return res.sendStatus(202);
    });
  });

module.exports = router;
