const express = require("express");
const User = require("../models/user");
const Place = require("../models/place");
const jwt = require("jsonwebtoken");
const oh = require("opening_hours");

const router = express.Router();
const secret = "SECRET";

const verifyToken = async (req, res, next) => {
  if (!req.headers.authorization) {
    throw new Error("Invalid Token");
  }
  const token = req.headers.authorization.split("Bearer ")[1];
  try {
    const userData = await jwt.verify(token, secret);

    const user = await User.findOne({ name: userData.name });

    if (!userData || !user) {
      throw new Error("Invalid Token");
    }
    next();
  } catch (err) {
    return res.status(403).send(err.message);
  }
};

router
  .route("/")
  .get((req, res) => {
    const { notes, name, time } = req.query;
    const notesRegex = new RegExp(notes, "i");
    const nameRegex = new RegExp(name, "i");

    if (time) {
      const now = new Date(time);
      const day = parseInt(now.getDay(), 10);
      const hour = parseInt(now.getHours(), 10);
      return Place.find({ close: { $gte: hour } })
        .find({ off: { $ne: day } })
        .then(place => res.json(place))
        .catch(function(error) {
          res.status(500).send(error);
        });
    }

    if (notes) {
      return Place.findOne({ notes: notesRegex }).then(place =>
        res.json(place)
      );
    }
    if (name) {
      return Place.findOne({ name: nameRegex }).then(place => res.json(place));
    }

    return Place.find().then(place => res.json(place));
  })
  .post(verifyToken, async (req, res) => {
    try {
      const place = new Place(req.body);
      await Place.init();
      newPlace = await place.save();

      return res.status(201).send(newPlace);
    } catch (err) {
      return res.status(500).send(err.message);
    }
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
