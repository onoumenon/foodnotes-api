const request = require("supertest");
const mongoose = require("mongoose");

const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../../app");
const Place = require("../../models/place");

jest.mock("jsonwebtoken");
const jwt = require("jsonwebtoken");

jest.mock("../../models/user");
const User = require("../../models/user");

const route = (params = "") => {
  const path = "/api/v1/places";
  return `${path}${params}`;
};

describe("Place", () => {
  let mongod;
  let db;

  beforeAll(async () => {
    jest.setTimeout(120000);
    mongod = new MongoMemoryServer();
    const uri = await mongod.getConnectionString();
    await mongoose.connect(uri, {
      autoReconnect: true,
      reconnectTries: Number.MAX_VALUE,
      reconnectInterval: 1000,
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false
    });
    db = mongoose.connection;
  });

  beforeEach(async () => {
    await Place.insertMany([
      {
        name: "Tang Kay Kee Fish Head Bee Hoon",
        address: "531A Upper Cross Street Singapore"
      },
      {
        name: "Nogawa",
        notes: "Japanese, Sushi",
        address:
          "100 Orchard Road, #03-25 Lobby Level, Concord Hotel  Singapore 238840 , Singapore"
      },
      {
        name: "Tong Heng",
        address: "285 South Bridge Road, Singapore"
      }
    ]);
  });

  afterEach(async () => {
    jwt.verify.mockReset();
    User.findOne.mockReset();
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
          name: "Tang Kay Kee Fish Head Bee Hoon",
          address: "531A Upper Cross Street Singapore"
        },
        {
          name: "Nogawa",
          notes: "Japanese, Sushi",
          address:
            "100 Orchard Road, #03-25 Lobby Level, Concord Hotel  Singapore 238840 , Singapore"
        },
        {
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
    test("denies access when no token is given", () => {
      return request(app)
        .post(route())
        .send({ name: "Huggs", address: "10 Cross St" })
        .catch(res => {
          expect(res.status).toBe(403);
        });
    });

    test("denies access when invalid token is given", () => {
      jwt.verify.mockRejectedValueOnce();

      return request(app)
        .post(route())
        .set("Authorization", "Bearer some-invalid-token")
        .send({ name: "Huggs", address: "10 Cross St" })
        .catch(res => {
          expect(res.status).toBe(403);
        });
    });

    test("creates a new place record", async () => {
      jwt.verify.mockResolvedValueOnce({ id: 100 });
      User.findOne.mockResolvedValueOnce({ id: "123" });
      await request(app)
        .post(route())
        .set("Authorization", "Bearer my-awesome-token")
        .send({ name: "Huggs", address: "10 Cross St" })
        .expect(201);

      const place = await Place.findOne({ name: "Huggs" });
      expect(place.name).toBe("Huggs");
    });
  });

  describe("[PUT] Edits an existing place", () => {
    xtest("edits a place's notes", async () => {
      jwt.verify.mockResolvedValueOnce({ id: 100 });
      User.findOne.mockResolvedValueOnce({ id: "123" });
      const { _id } = await Place.findOne({ name: "Tong Heng" });

      const res = await request(app)
        .put(route(`/${_id}`))
        .set("Authorization", "Bearer my-awesome-token")
        .send({
          name: "Tong Heng",
          address: "12 Cross St",
          notes: "Weird Stuff"
        })
        .expect(202);

      expect(res.body).toEqual("Success");
    });

    test("returns 404 as there is no such place", () => {
      jwt.verify.mockResolvedValueOnce({ id: 100 });
      User.findOne.mockResolvedValueOnce({ id: "123" });
      const id = "100";
      return request(app)
        .put(route(`/${id}`))
        .set("Authorization", "Bearer my-awesome-token")
        .send({
          id: 100,
          name: "Nogawa",
          notes: "Weird Stuff"
        })
        .catch(res => {
          expect(res.status).toBe(404);
        });
    });
  });

  describe("[DELETE] Removes an existing place", () => {
    test("removes a place from the database", async () => {
      jwt.verify.mockResolvedValueOnce({ id: 100 });
      User.findOne.mockResolvedValueOnce({ id: "123" });
      const { _id } = await Place.findOne({ name: "Nogawa" });

      await request(app)
        .delete(route(`/${_id}`))
        .set("Authorization", "Bearer my-awesome-token")
        .expect(202);

      const place = await Place.findOne({ name: "Nogawa" });
      expect(place).toBe(null);
    });

    test("returns 404 Not Found as there is no such place", done => {
      jwt.verify.mockResolvedValueOnce({ id: 100 });
      User.findOne.mockResolvedValueOnce({ id: "123" });
      const _id = "123";
      request(app)
        .delete(route(_id))
        .set("Authorization", "Bearer my-awesome-token")
        .expect(404, done);
    });
  });
});
