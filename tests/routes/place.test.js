const request = require("supertest");
const mongoose = require("mongoose");

const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../../app");

jest.mock("jsonwebtoken");
const jwt = require("jsonwebtoken");

jest.mock("../../models/place");
const Place = require("../../models/place");

const route = (params = "") => {
  const path = "/api/v1/place";
  return `${path}/${params}`;
};

describe("Place", () => {
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
    await Place.insertMany([
      {
        _id: 4,
        name: "Tang Kay Kee Fish Head Bee Hoon",
        address: "531A Upper Cross Street Singapore"
      },
      {
        _id: 5,
        name: "Ri Ri Hong Ma La Xiang Guo",
        address:
          "32 New Market Road, #01-042/052, People’s Park Food Centre, Singapore"
      },
      {
        _id: 6,
        name: "Tong Heng",
        address: "285 South Bridge Road, Singapore"
      }
    ]);
  });

  afterEach(async () => {
    await db.dropCollection("places");
  });

  afterAll(async () => {
    mongoose.disconnect();
    await mongod.stop();
  });

  describe("[GET] Search for places", () => {
    test("returns all places", () => {
      const expectedPlaces = [
        {
          _id: 4,
          name: "Tang Kay Kee Fish Head Bee Hoon",
          address: "531A Upper Cross Street Singapore"
        },
        {
          _id: "1553409670-248",
          name: "Nogawa",
          notes: "Japanese, Sushi",
          address:
            "100 Orchard Road, #03-25 Lobby Level, Concord Hotel  Singapore 238840 , Singapore"
        },
        {
          _id: 6,
          name: "Tong Heng",
          address: "285 South Bridge Road, Singapore"
        }
      ];

      return request(app)
        .get(route())
        .expect("content-type", /json/)
        .expect(200)
        .then(res => {
          const places = res.body;
          places.forEach((place, index) => {
            expect(place.name).toBe(expectedPlaces[index].name);
          });
        });
    });

    test("returns places matching notes query", () => {
      return request(app)
        .get(route())
        .query({ notes: "Sushi" })
        .expect("content-type", /json/)
        .expect(200)
        .then(res => {
          const place = res.body[0];
          expect(place.name).toEqual("Nogawa");
        });
    });
  });

  describe("[POST] Creates a new place", () => {
    afterEach(() => {
      jwt.verify.mockReset();
    });

    test("denies access when no token is given", () => {
      return request(app)
        .post(route())
        .send({ name: "Nogawa" })
        .catch(err => {
          expect(err.status).toBe(403);
        });
    });

    test("denies access when invalid token is given", () => {
      jwt.verify.mockRejectedValueOnce();

      return request(app)
        .post(route())
        .set("Authorization", "Bearer some-invalid-token")
        .send({ name: "Nogawa" })
        .catch(res => {
          expect(res.status).toBe(403);
        });
    });

    test("creates a new place record", async () => {
      jwt.verify.mockResolvedValueOnce({ id: 123 });

      const res = await request(app)
        .post(route())
        .set("Authorization", "Bearer my-awesome-token")
        .send({
          name: "Hoo Kee Rice Dumplings",
          address: "Amoy Street Food Centre #01-18, Singapore"
        })
        .expect(201);

      expect(res.body.name).toBe("Hoo Kee Rice Dumplings");

      const place = await Place.findOne({ name: "Hoo Kee Rice Dumplings" });
      expect(place.name).toBe("Hoo Kee Rice Dumplings");
    });
  });

  describe("[PUT] Edits an existing place", () => {
    test("edits a place's notes", async () => {
      const { _id } = await Place.findOne({ name: "Nogawa" });

      const res = await request(app)
        .put(route(_id))
        .send({
          name: "Nogawa",
          notes: "Weird Stuff"
        })
        .expect(202);

      expect(res.body).toEqual(
        expect.objectContaining({
          name: "Nogawa",
          notes: "Weird Stuff"
        })
      );
    });

    test("returns 400 Bad Request as there is no such place", () => {
      const id = "100";
      return request(app)
        .put(route(id))
        .send({
          id: 100,
          name: "Nogawa",
          notes: "Weird Stuff"
        })
        .catch(res => {
          expect(res.status).toBe(400);
        });
    });
  });

  describe("[DELETE] Removes an existing place", () => {
    test("removes a place from the database", async () => {
      const { _id } = await Place.findOne({ name: "Nogawa" });

      await request(app)
        .delete(route(_id))
        .expect(202);

      const book = await Book.findById(_id);
      expect(book).toBe(null);
    });

    test("returns 404 Not Found as there is no such place", done => {
      const _id = "1553409670-248";
      request(app)
        .delete(route(_id))
        .expect(404, done);
    });
  });
});
