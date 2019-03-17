const app = require("./app");
const mongoose = require("mongoose");

const MONGODB_URI = "mongodb://localhost/my-first-db";
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });
const db = mongoose.connection;

db.on("error", err => {
  console.error("Unable to connect to the database", err);
});

const server = app.listen(process.env.PORT || 5555, () => {
  let { address, port } = server.address();

  if (address === "::") {
    address = "http://localhost";
  }

  console.log(`Server is running on ${address}:${port}`);
});
