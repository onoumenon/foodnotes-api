const request = require("supertest");
const mongoose = require("mongoose");

const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../../app");
const Book = require("../../models/book");

jest.mock("jsonwebtoken");
const jwt = require("jsonwebtoken");

jest.mock("../../models/user");
const User = require("../../models/user");

const route = (params = "") => {
  const path = "/api/v1/books";
  return `${path}/${params}`;
};

describe("Books", () => {
  let mongod;
  let db;

  beforeAll(async () => {
    jest.setTimeout(120000);
    mongod = new MongoMemoryServer();
    const uri = await mongod.getConnectionString();

    mongoose.set("useNewUrlParser", true);
    mongoose.set("useFindAndModify", false);
    mongoose.set("useCreateIndex", true);

    await mongoose.connect(uri, {
      autoReconnect: true,
      reconnectTries: Number.MAX_VALUE,
      reconnectInterval: 1000
    });
    db = mongoose.connection;
  });

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

  afterAll(async () => {
    mongoose.disconnect();
    await mongod.stop();
  });

  describe("[GET] Search for books", () => {
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
          books.forEach((book, index) => {
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
            expect(book.title).toBe(expectedBooks[index].title);
            expect(book.author).toBe(expectedBooks[index].author);
          });
        });
    });
  });

  describe("[POST] Creates a new book", () => {
    afterEach(() => {
      jwt.verify.mockReset();
    });

    test("denies access when no token is given", () => {
      return request(app)
        .post(route())
        .send({ title: "The Handmaid's Tale", author: "Margaret Atwood" })
        .catch(err => {
          expect(err.status).toBe(403);
        });
    });

    test("denies access when invalid token is given", () => {
      jwt.verify.mockRejectedValueOnce();

      return request(app)
        .post(route())
        .set("Authorization", "Bearer some-invalid-token")
        .send({ title: "The Handmaid's Tale", author: "Margaret Atwood" })
        .catch(res => {
          expect(res.status).toBe(403);
        });
    });

    test("creates a new book record in the database", async () => {
      jwt.verify.mockResolvedValueOnce({ id: 123 });

      const res = await request(app)
        .post(route())
        .set("Authorization", "Bearer my-awesome-token")
        .send({ title: "The Handmaid's Tale", author: "Margaret Atwood" })
        .expect(201);

      expect(res.body.title).toBe("The Handmaid's Tale");
      expect(res.body.author).toBe("Margaret Atwood");

      const book = await Book.findOne({ title: "The Handmaid's Tale" });
      expect(book.title).toBe("The Handmaid's Tale");
      expect(book.author).toBe("Margaret Atwood");
    });
  });

  describe("[PUT] Edits an existing book", () => {
    test("edits a book's title and author", async () => {
      const { _id } = await Book.findOne({ title: "1984" });

      const res = await request(app)
        .put(route(_id))
        .send({
          title: "The Perennial Philosophy",
          author: "Aldous Huxley"
        })
        .expect(202);

      expect(res.body).toEqual(
        expect.objectContaining({
          title: "The Perennial Philosophy",
          author: "Aldous Huxley"
        })
      );
    });

    test("returns 400 Bad Request as there is no such book", () => {
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
    test("removes a book from the database", async () => {
      const { _id } = await Book.findOne({ title: "1984" });

      await request(app)
        .delete(route(_id))
        .expect(202);

      const book = await Book.findById(_id);
      expect(book).toBe(null);
    });

    test("returns 404 Not Found as there is no such book", done => {
      const _id = "5c8fb5c41529bf25dcba41a7";
      request(app)
        .delete(route(_id))
        .expect(404, done);
    });
  });
});
