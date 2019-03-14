const app = require("./app");

let port, message;

if (process.env.NODE_ENV === "production") {
  port = process.env.PORT;
  message = "Server is running in production";
} else {
  port = 8080;
  message = `Server is running on http://localhost:${port}`;
}

app.listen(port, () => console.log(message));
