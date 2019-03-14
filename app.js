const express = require("express");
const app = express();

// middleware
app.use(express.json());

// routes
app.use("/", require("./routes/index"));
app.use("/api/v1/books", require("./routes/books"));

module.exports = app;
