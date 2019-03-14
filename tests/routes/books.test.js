const request = require("supertest");
const app = require("../../app");
const { books } = require("../../data/db.json");

const route = "/api/v1/books";

describe("Books", () => {
  test("returns a list of all books", () => {
    return request(app)
      .get(route)
      .expect(200)
      .expect(books);
  });
});
