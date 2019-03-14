const request = require("supertest");
const app = require("../../app");

const route = "/";

describe("My first route", () => {
  test("returns status code 200 OK", () => {
    return request(app)
      .get(route)
      .expect(200);
  });
});
