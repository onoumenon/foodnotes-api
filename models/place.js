const mongoose = require("mongoose");

const placeSchema = new mongoose.Schema(
  {
    _id: { type: String, require: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    latitude: { type: Number },
    longitude: { type: Number },
    notes: { type: String },
    openingHours: { type: String },
    recommend: { type: String },
    contact: { type: String }
  },
  { timestamps: false }
);

const Place = mongoose.model("Place", placeSchema);

module.exports = Place;
