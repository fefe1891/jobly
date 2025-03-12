"use strict";

const request = require("supertest");

const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(async () => {
  await commonBeforeAll();
}, 20000);

beforeEach(async () => {
  await commonBeforeEach();
}, 20000);

afterEach(async () => {
  await commonAfterEach();
}, 20000);

afterAll(async () => {
  await commonAfterAll();
}, 20000);

/************************************** POST /auth/token */

/**
 * Test suite for endpoint: POST /auth/token
 * These tests verify the process of authentication and token generation.
 * It includes the scenarios of successful login, non-existing user, wrong password, missing data, and invalid data.
 */
describe("POST /auth/token", function () {
  /**
 * Test case: Authentication works for valid user.
 * This test verifies that an authenticated request made by an existing user is successful and a token is generated.
 */
  test("works", async function () {
    const resp = await request(app)
        .post("/auth/token")
        .send({
          username: "u1",
          password: "password1",
        });
    expect(resp.body).toEqual({
      "token": expect.any(String),
    });
  });

  /**
 * Test case: Non-existent users cannot authenticate.
 * This test checks that an unauthenticated request made by a non-existent user fails.
 * The response should be '401 Unauthorized'.
 */
  test("unauth with non-existent user", async function () {
    const resp = await request(app)
        .post("/auth/token")
        .send({
          username: "no-such-user",
          password: "password1",
        });
    expect(resp.statusCode).toEqual(401);
  });

  /**
 * Test case: A wrong password should result in failed authentication.
 * This test verifies that an unauthenticated request made with a wrong password fails.
 * The response should be '401 Unauthorized'.
 */
  test("unauth with wrong password", async function () {
    const resp = await request(app)
        .post("/auth/token")
        .send({
          username: "u1",
          password: "nope",
        });
    expect(resp.statusCode).toEqual(401);
  });

  /**
 * Test case: Missing data results in a bad request.
 * This test simulates a case where an attempt is made to authenticate with missing data.
 * The response should be '400 Bad Request'.
 */
  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/auth/token")
        .send({
          username: "u1",
        });
    expect(resp.statusCode).toEqual(400);
  });

  /**
 * Test case: Invalid data results in a bad request.
 * This test checks the case where invalid data is used for authentication.
 * The response should be '400 Bad Request'.
 */
  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/auth/token")
        .send({
          username: 42,
          password: "above-is-a-number",
        });
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** POST /auth/register */

/**
 * Test suite for endpoint: POST /auth/register
 * These tests validate the user registration process.
 * They cover scenarios of successful registration, registration with missing fields, and registration with invalid data.
 */
describe("POST /auth/register", function () {

  /**
 * Test case: Registration works for anonymous users.
 * This test verifies if an anonymous user can successfully register by providing valid credentials.
 */
  test("works for anon", async function () {
    const resp = await request(app)
        .post("/auth/register")
        .send({
          username: "new",
          firstName: "first",
          lastName: "last",
          password: "password",
          email: "new@email.com",
        });
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      "token": expect.any(String),
    });
  });

  /**
 * Test case: Missing fields results in a bad request.
 * This test checks a scenario where a user tries to register with incomplete credentials.
 * The response should be '400 Bad Request'.
 */
  test("bad request with missing fields", async function () {
    const resp = await request(app)
        .post("/auth/register")
        .send({
          username: "new",
        });
    expect(resp.statusCode).toEqual(400);
  });

  /**
 * Test case: Invalid data results in a bad request.
 * This test checks a scenario where a user tries to register with invalid data.
 * The response should be '400 Bad Request'.
 */
  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/auth/register")
        .send({
          username: "new",
          firstName: "first",
          lastName: "last",
          password: "password",
          email: "not-an-email",
        });
    expect(resp.statusCode).toEqual(400);
  });
});
