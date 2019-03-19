const request = require("supertest");
const app = require("../../app");

const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const Book = require("../../models/book");

const { books } = require("../../data/db.json");

const route = (params = "") => {
  const path = "/api/v1/books";
  return `${path}/${params}`;
};

describe("Books", () => {
  let mongoServer;
  let db;

  beforeAll(async () => {
    jest.setTimeout(120000);
    mongoServer = new MongoMemoryServer();
    const mongoUri = await mongoServer.getConnectionString();
    await mongoose.connect(mongoUri);
    db = mongoose.connection;
  });

  afterAll(async () => {
    mongoose.disconnect();
    await mongoServer.stop();
  });

  describe("[GET] Search for books", () => {
    beforeEach(async () => {
      await Book.insertMany([
        { title: "Animal Farm", author: "George Orwell" },
        { title: "1984", author: "George Orwell" },
        { title: "Homage to Catalonia", author: "George Orwell" }
      ]);
    });

    afterEach(async () => {
      await db.dropCollection("books");
    });

    test("returns all books", () => {
      const expectedBooks = [
        { title: "Animal Farm", author: "George Orwell" },
        { title: "1984", author: "George Orwell" },
        { title: "Homage to Catalonia", author: "George Orwell" }
      ];

      return request(app)
        .get(route())
        .expect("content-type", /json/)
        .expect(200)
        .then(res => {
          const books = res.body;

          expect(books.length).toBe(3);

          books.forEach((book, index) => {
            expect(book).toEqual(expect.objectContaining(expectedBooks[index]));

            expect(book.title).toBe(expectedBooks[index].title);
            expect(book.author).toBe(expectedBooks[index].author);
          });
        });
    });

    test("returns books matching the title query", () => {
      return request(app)
        .get(route())
        .query({ title: "1984" })
        .expect("content-type", /json/)
        .expect(200)
        .then(res => {
          const book = res.body[0];
          expect(book.title).toEqual("1984");
        });
    });

    test("returns books matching the author query", () => {
      const expectedBooks = [
        { title: "Animal Farm", author: "George Orwell" },
        { title: "1984", author: "George Orwell" },
        { title: "Homage to Catalonia", author: "George Orwell" },
        { title: "The Road to Wigan Pier", author: "George Orwell" }
      ];

      return request(app)
        .get(route())
        .query({ author: "George Orwell" })
        .expect("content-type", /json/)
        .expect(200)
        .then(res => {
          const books = res.body;
          books.forEach((book, index) => {
            expect(book).toEqual(expect.objectContaining(expectedBooks[index]));
          });
        });
    });
  });

  describe("[POST] Creates a new book", () => {
    test("deny access when no token is given", () => {
      return request(app)
        .post(route())
        .send({ title: "The Handmaid's Tale", author: "Margaret Atwood" })
        .catch(err => {
          expect(err.status).toBe(403);
        });
    });

    test("deny access when incorrect token is given", () => {
      return request(app)
        .post(route())
        .set("Authorization", "Bearer some-invalid-token")
        .send({ title: "The Handmaid's Tale", author: "Margaret Atwood" })
        .catch(res => {
          expect(res.status).toBe(403);
        });
    });

    test("grant access when correct token is given", () => {
      return request(app)
        .post(route())
        .set("Authorization", "Bearer my-awesome-token")
        .send({ title: "The Handmaid's Tale", author: "Margaret Atwood" })
        .expect(201)
        .then(res => {
          expect(res.body).toEqual(
            expect.objectContaining({
              title: "The Handmaid's Tale",
              author: "Margaret Atwood"
            })
          );
        });
    });
  });

  describe("[PUT] Edits an existing book", () => {
    test("successfully edits a book", () => {
      const id = "5";
      return request(app)
        .put(route(id))
        .send({
          id: 5,
          title: "The Perennial Philosophy",
          author: "Aldous Huxley"
        })
        .expect(202)
        .expect({
          id: 5,
          title: "The Perennial Philosophy",
          author: "Aldous Huxley"
        });
    });

    test("fails as there is no such book", () => {
      const id = "100";
      return request(app)
        .put(route(id))
        .send({
          id: 100,
          title: "The Perennial Philosophy",
          author: "Aldous Huxley"
        })
        .catch(res => {
          expect(res.status).toBe(400);
        });
    });
  });

  describe("[DELETE] Removes an existing book", () => {
    test("successfully removes a book", () => {
      const id = "1";
      return request(app)
        .delete(route(id))
        .expect(202);
    });

    test("fails as there is no such book", done => {
      const id = "100";
      request(app)
        .delete(route(id))
        .expect(400, done);
    });

    test("fails as there is no such book", () => {
      const id = "100";
      return request(app)
        .delete(route(id))
        .ok(res => res.status === 400)
        .then(res => {
          expect(res.status).toBe(400);
        });
    });

    test("fails as there is no such book", async () => {
      const id = "100";
      await request(app)
        .delete(route(id))
        .ok(res => res.status === 400)
        .then(res => {
          expect(res.status).toBe(400);
        });
    });

    test("fails as there is no such book", () => {
      const id = "100";
      return request(app)
        .delete(route(id))
        .ok(res => res.status === 400)
        .then(res => {
          expect(res.status).toBe(400);
        });
    });
  });
});
