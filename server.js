const app = require("./app");
const port = 5555;

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
});
