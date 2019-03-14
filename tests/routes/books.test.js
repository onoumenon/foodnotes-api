const request = require("supertest");
const app = require("../../app");

const { books } = require("../../data/db.json");

const route = (params = "") => {
  const path = "/api/v1/books";
  return `${path}/${params}`;
};

describe("Books", () => {
  describe("Search for books", () => {
    test("returns all books", () => {
      return request(app)
        .get(route())
        .expect("content-type", /json/)
        .expect(200)
        .expect(books);
    });

    test("returns a book matching the title query", () => {
      return request(app)
        .get(route())
        .query({ title: "1984" })
        .expect("content-type", /json/)
        .expect(200)
        .expect([{ id: 2, title: "1984", author: "George Orwell" }]);
    });
  });

  describe("Creates a new book", () => {
    test("successfully", () => {
      return request(app)
        .post(route())
        .send({ title: "Animal Farm", author: "George Orwell" })
        .expect(201);
    });
  });

  describe("Edits an existing book", () => {
    test("successfully", () => {
      const id = "1";
      return request(app)
        .put(route(id))
        .send({ id: 1, title: "Animal Farm", author: "George Orwell" })
        .expect(202);
    });
  });

  describe("Deletes an existing book", () => {
    test("successfully", () => {
      const id = "1";
      return request(app)
        .delete(route(id))
        .expect(202);
    });
  });
});
