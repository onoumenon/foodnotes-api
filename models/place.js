const mongoose = require("mongoose");
const opencage = require("opencage-api-client");

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

placeSchema.pre("findOneAndUpdate", function(next) {
  // format addresses for opencage API
  const unitNoRegex = /#\d+-*\d+/g;
  const countryRegex = /Singapore/i;
  let newAddress = this._update.address.replace(unitNoRegex, "");
  if (newAddress.search(countryRegex) === -1) {
    newAddress = newAddress + ", Singapore";
  }

  // TO DO (Pass in country in user settings)
  opencage
    .geocode({ q: newAddress })
    .then(data => {
      if (data.status.code == 200) {
        if (
          data.results.length > 0 &&
          data.results[0].annotations.timezone.name === "Asia/Singapore"
        ) {
          const place = data.results[0];
          console.log(place.geometry.lng, place.geometry.lat);
          this._update.location = {
            type: "Point",
            coordinates: [place.geometry.lng, place.geometry.lat]
          };
        }
      } else if (data.status.code == 402) {
        throw new Error("Hit free trial limit");
      } else {
        throw new Error(data.status.message);
      }
      next();
    })
    .catch(error => {
      console.log("error", error.message);
      next(error);
    });
});

placeSchema.pre("save", function(next) {
  // format addresses for opencage API
  const unitNoRegex = /#\d+-*\d+/g;
  const countryRegex = /Singapore/i;
  let newAddress = this.address.replace(unitNoRegex, "");
  if (newAddress.search(countryRegex) === -1) {
    newAddress = newAddress + ", Singapore";
  }
  // TO DO (Pass in country in user settings)
  opencage
    .geocode({ q: newAddress })
    .then(data => {
      if (data.status.code == 200) {
        if (
          data.results.length > 0 &&
          data.results[0].annotations.timezone.name === "Asia/Singapore"
        ) {
          const place = data.results[0];
          this.location.coordinates = [place.geometry.lng, place.geometry.lat];
        }
      } else if (data.status.code == 402) {
        throw new Error("Hit free trial limit");
      } else {
        throw new Error(data.status.message);
      }
      next();
    })
    .catch(error => {
      console.log("error", error.message);
      next(error);
    });
});

placeSchema.post("save", function(error, res, next) {
  if (error.name === "MongoError" && error.code === 11000) {
    next(new Error("Place already exists. Did you want to edit the place?"));
  } else {
    next();
  }
});

const Place = mongoose.model("Place", placeSchema);

module.exports = Place;
