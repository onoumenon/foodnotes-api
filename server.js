const app = require("./app");

const port = process.env.PORT || 5555;

app.listen(port, () => {
  if (process.env.NODE_ENV === "production") {
    console.log(`Server is running on Heroku with port number ${port}`);
  } else {
    console.log(`Server is running on http://localhost:${port}`);
  }
});
