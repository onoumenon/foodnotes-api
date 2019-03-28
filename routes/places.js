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
    return res.status(403).json(err.message);
  }
};

router
  .route("/")
  .get((req, res) => {
    const { notes, name, time, getOne } = req.query;
    const notesRegex = new RegExp(notes, "i");
    const nameRegex = new RegExp(name, "i");
    const getOneRegex = new RegExp(getOne, "i");

    if (time) {
      const now = new Date(time);
      const day = parseInt(now.getDay(), 10);
      const hour = parseInt(now.getHours(), 10);
      return Place.find({ "openingHours.close": { $gte: hour } })
        .find({ "openingHours.off": { $ne: day } })
        .then(place => res.json(place))
        .catch(function(error) {
          res.status(500).json(error.message);
        });
    }

    if (notes) {
      return Place.find({ notes: notesRegex }).then(place => res.json(place));
    }
    if (name) {
      return Place.find({ name: nameRegex }).then(place => res.json(place));
    }
    if (getOne) {
      return Place.findOne({ name: getOneRegex }).then(place =>
        res.json(place)
      );
    }

    return Place.find().then(place => res.json(place));
  })
  .post(async (req, res) => {
    try {
      const place = new Place(req.body);
      await Place.init();
      await place.save();

      return res.status(201).json("Success");
    } catch (err) {
      return res.status(500).json(err.message);
    }
  });

router
  .route("/:id")
  .put(async (req, res) => {
    try {
      await Place.findByIdAndUpdate(req.params.id, req.body, {
        new: true
      });
      return res.status(202).json("Success");
    } catch (err) {
      return res.status(404).json(err.message);
    }
  })
  .delete(async (req, res) => {
    Place.findByIdAndDelete(req.params.id, (err, place) => {
      if (err) {
        return res.sendStatus(500);
      }
      if (!place) {
        return res.sendStatus(404);
      }
      return res.status(202).json("Success");
    });
  });

module.exports = router;
