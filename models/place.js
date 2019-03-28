const mongoose = require("mongoose");
// regex to filter out unit number from addresses for openCage api
const unitNoRegex = /#\d+-*\d+/g;

const placeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      index: { unique: true, dropDups: true }
    },
    uri: { type: String },
    address: { type: String, required: true },
    location: {
      type: {
        type: String,
        enum: ["Point"]
      },
      coordinates: {
        type: [Number]
      }
    },
    notes: { type: String },
    openingHours: {
      open: { type: Number },
      close: { type: Number },
      off: { type: Array }
    },
    recommend: { type: String },
    contact: { type: String }
  },
  { timestamps: false }
);

// placeSchema.pre("save", function(error, res, next) {});

placeSchema.post("save", function(error, res, next) {
  if (error.name === "MongoError" && error.code === 11000) {
    next(new Error("Place already exists. Did you want to edit the place?"));
  } else {
    next();
  }
});

const Place = mongoose.model("Place", placeSchema);

module.exports = Place;
