const express = require("express");
const cors = require("cors");
const app = express();

const mongoose = require("mongoose");
const db = "mongodb://localhost/test";
mongoose.connect(db, { useNewUrlParser: true }, (err, res) => {
  if (err) {
    console.error("Cannot connect to db", err);
  } else {
    console.log("Connected!");
  }
});

// middleware
// app.use(cors());
app.use(express.json());

// routes
app.use("/", require("./routes/index"));
app.use("/api/v1/books", require("./routes/books"));

module.exports = app;
