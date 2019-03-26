const mongoose = require("mongoose");

const placeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      index: { unique: true, dropDups: true }
    },
    uri: { type: String },
    address: { type: String, required: true },
    latitude: { type: Number },
    longitude: { type: Number },
    notes: { type: String },
    open: { type: Number },
    close: { type: Number },
    off: { type: Number },
    recommend: { type: String },
    contact: { type: String }
  },
  { timestamps: false }
);

placeSchema.post("save", function(error, res, next) {
  if (error.name === "MongoError" && error.code === 11000) {
    next(new Error("There was a duplicate key error"));
  } else {
    next();
  }
});

const Place = mongoose.model("Place", placeSchema);

module.exports = Place;
