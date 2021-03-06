const express = require("express");
const User = require("../models/user");
const Place = require("../models/place");
const jwt = require("jsonwebtoken");

const router = express.Router();
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const secret = process.env.SECRET;

const verifyToken = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      throw new Error("Invalid Token");
    }
    const token = req.headers.authorization.split("Bearer ")[1];
    const userData = await jwt.verify(token, secret);

    const user = await User.findOne({ name: userData.name });

    if (!userData || !user) {
      throw new Error("Invalid Token");
    }
    next();
  } catch (err) {
    return res.sendStatus(403);
  }
};

router
  .route("/")
  .get((req, res) => {
    const { notes, name, time, getOne, location } = req.query;
    const notesRegex = new RegExp(notes, "i");
    const nameRegex = new RegExp(name, "i");
    const getOneRegex = new RegExp(getOne, "i");
    const now = new Date(
      new Date().toLocaleString("en-US", {
        timeZone: "Asia/Singapore"
      })
    );
    const day = parseInt(now.getDay(), 10);
    const hour = parseInt(now.getHours(), 10);

    if (time && notes) {
      return Place.find({
        $and: [
          { "openingHours.close": { $gte: hour } },
          { "openingHours.open": { $lte: hour } },
          { "openingHours.off": { $ne: day } }
        ]
      })
        .find({ notes: notesRegex })
        .then(place => res.json(place))
        .then(place => res.json(place))
        .catch(function(error) {
          res.status(500).send(error.message);
        });
    }

    if (time && name) {
      return Place.find({
        $and: [
          { "openingHours.close": { $gte: hour } },
          { "openingHours.open": { $lte: hour } },
          { "openingHours.off": { $ne: day } }
        ]
      })
        .find({ name: nameRegex })
        .then(place => res.json(place))
        .then(place => res.json(place))
        .catch(function(error) {
          res.status(500).send(error.message);
        });
    }

    if (time) {
      return Place.find({
        $and: [
          { "openingHours.close": { $gte: hour } },
          { "openingHours.open": { $lte: hour } },
          { "openingHours.off": { $ne: day } }
        ]
      })
        .then(place => res.json(place))
        .catch(function(error) {
          res.status(500).send(error.message);
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

    if (location) {
      const coords = location;
      const METERS_PER_MILE = 1609.34;
      return Place.find({
        location: {
          $nearSphere: {
            $geometry: { type: "Point", coordinates: [coords[1], coords[0]] },
            $maxDistance: 0.5 * METERS_PER_MILE
          }
        }
      }).then(place => res.json(place));
    }

    return Place.find().then(place => res.json(place));
  })
  .post(verifyToken, async (req, res) => {
    try {
      const place = new Place(req.body);
      await Place.init();
      await place.save();

      return res.status(201).json("Success");
    } catch (err) {
      return res.status(500).send(err.message);
    }
  });

router
  .route("/:id")
  .put(verifyToken, async (req, res) => {
    try {
      await Place.findByIdAndUpdate(req.params.id, req.body, {
        new: true
      });
      return res.status(202).json("Success");
    } catch (err) {
      return res.status(404).send(err.message);
    }
  })
  .delete(verifyToken, async (req, res) => {
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
