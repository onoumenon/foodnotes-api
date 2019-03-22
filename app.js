const express = require("express");
const app = express();

const becors = (req, res, next) => {
  res.set("Access-Control-Allow-Origin", "http://127.0.0.1:8080");
  res.set("Access-Control-Allow-Methods", "DELETE");
  next();
};

// middleware
app.use(express.json());
app.use(becors);

// routes
app.use("/", require("./routes/index"));
app.use("/api/v1/books", require("./routes/books"));

module.exports = app;
