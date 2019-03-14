const express = require("express");
const app = express();

// middleware

// routes
app.use("/", require("./routes/index"));
app.use("/api/v1/books", require("./routes/books"));

module.exports = app;
