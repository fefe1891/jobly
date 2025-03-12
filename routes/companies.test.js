"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
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

/************************************** POST /companies */

/**
 * Test suite for endpoint: POST /companies
 * These tests verify that creating new companies works as expected.
 * They check both success scenario (new company creation) and failure scenarios (missing data, invalid data).
 */
describe("POST /companies", function () {
  const newCompany = {
    handle: "new",
    name: "New",
    logoUrl: "http://new.img",
    description: "DescNew",
    numEmployees: 10,
  };

  /**
 * Test case: Check users can create companies.
 * This test asserts that a user can successfully create a new company.
 */
  test("ok for users", async function () {
    const resp = await request(app)
      .post("/companies")
      .send(newCompany)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      company: newCompany,
    });
  });

  /**
 * Test case: Missing data doesn't break the system and returns an error.
 * Tests using the API with insufficient data to create a company.
 * The system should respond with a '400 Bad Request' status code.
 */
  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/companies")
      .send({
        handle: "new",
        numEmployees: 10,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  /**
 * Test case: Invalid data returns an error.
 * Tests the system behavior when an attempt is made to create a company with invalid data.
 * Expects the system to return '400 Bad Request'.
 */
  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/companies")
      .send({
        ...newCompany,
        logoUrl: "not-a-url",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /companies */
// Define a test suite for GET /companies endpoint
describe("GET /companies", function () {
  // Test case: An anonymous user can retrieve a list of all companies
  test("ok for anon", async function () {
    // Call API and store response
    const resp = await request(app).get("/companies");

    // Check response body to see if it contains expected result
    expect(resp.body).toEqual({
      // Expected result: an array of all company objects
      companies:
        [
          {
            handle: "c1",
            name: "C1",
            description: "Desc1",
            numEmployees: 1,
            logoUrl: "http://c1.img",
          },
          {
            handle: "c2",
            name: "C2",
            description: "Desc2",
            numEmployees: 2,
            logoUrl: "http://c2.img",
          },
          {
            handle: "c3",
            name: "C3",
            description: "Desc3",
            numEmployees: 3,
            logoUrl: "http://c3.img",
          },
        ],
    });
  });

  // Test case: Filter the companies by name
  test("works: filtering by name", async function () {
    // Call API with query parameters and store response
    const resp = await request(app).get("/companies").query({ name: "C3" });

    // Check response body to see if it contains expected result
    expect(resp.body).toEqual({
      // Expected result: an array only containing the company with name "C3"
      companies: [
        {
          handle: "c3",
          name: "C3",
          description: "Desc3",
          numEmployees: 3,
          logoUrl: "http://c3.img",
        },
      ],
    });
  });

  // Test case: Handle invalid query parameters
  test("bad request with invalid query string parameter", async function () {
    // Call API with invalid query parameters and store response
    const resp = await request(app).get("/companies").query({ name: "C3", invalidParam: "invalid" });

    // Check status code to see if it is 400 - bad request
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /companies/:handle */

/**
 * Test suite for endpoint: GET /companies/:handle
 * These tests verify the retrieval of information about a specific company by its handle.
 * They include tests for both successful data retrieval and when the company doesn't exist.
 */
describe("GET /companies/:handle", function () {

  /**
 * Test case: Unauthenticated users can view company data
 * This test asserts that anonymous users can successfully retrieve company data.
 */
  test("works for anon", async function () {
    const resp = await request(app).get(`/companies/c1`);
    expect(resp.body).toEqual({
      company: {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
    });
  });

  /**
 * Test case: Unauthenticated users can view data of companies without jobs
 * This test checks the case when a company doesn't have any jobs associated with it.
 * The response should still be successful and return company data without any job data.
 */
  test("works for anon: company w/o jobs", async function () {
    const resp = await request(app).get(`/companies/c2`);
    expect(resp.body).toEqual({
      company: {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
    });
  });

  /**
 * Test case: Handles non-existent company correctly
 * Tests the case where a company with the provided handle doesn't exist.
 * The response for this request should be a '404 Not Found' status code.
 */
  test("not found for no such company", async function () {
    const resp = await request(app).get(`/companies/nope`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /companies/:handle */

/**
 * Test suite for endpoint: PATCH /companies/:handle
 * These tests verify the update of company information identified by its handle.
 * It includes tests for success, unauthenticated access, non-existing company, invalid operations, and invalid data scenarios.
 */
describe("PATCH /companies/:handle", function () {

  /**
 * Test case: A user can update company information.
 * This test verifies that an authenticated user can make updates to existing company data.
 */
  test("works for users", async function () {
    const resp = await request(app)
      .patch(`/companies/c1`)
      .send({
        name: "C1-new",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      company: {
        handle: "c1",
        name: "C1-new",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
    });
  });

  /**
 * Test case: An unauthenticated user cannot update company data.
 * This test checks that a request made without authentication cannot make changes.
 * The endpoint should return '401 Unauthorized' for such case.
 */
  test("unauth for anon", async function () {
    const resp = await request(app)
      .patch(`/companies/c1`)
      .send({
        name: "C1-new",
      });
    expect(resp.statusCode).toEqual(401);
  });

  /**
 * Test case: An error is returned for a non-existent company.
 * This test simulates a case where an attempt is made to update a non-existent company.
 * The response should be '404 Not Found'.
 */
  test("not found on no such company", async function () {
    const resp = await request(app)
      .patch(`/companies/nope`)
      .send({
        name: "new nope",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  /**
 * Test case: Invalid operation - changing the handle 
 * This test simulates a case where an attempt is made to change a company's handle.
 * Doing so is not allowed, so the response should be '400 Bad Request'.
 */
  test("bad request on handle change attempt", async function () {
    const resp = await request(app)
      .patch(`/companies/c1`)
      .send({
        handle: "c1-new",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  /**
 * Test case: Invalid operation - providing invalid data 
 * This test simulates a case where an attempt is made with invalid data.
 * The response should be '400 Bad Request'.
 */
  test("bad request on invalid data", async function () {
    const resp = await request(app)
      .patch(`/companies/c1`)
      .send({
        logoUrl: "not-a-url",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /companies/:handle */

/**
 * Test suite for endpoint: DELETE /companies/:handle
 * These tests confirm the deletion of a company identified by its handle.
 * They include successful deletion, unauthenticated access, and non-existent company scenarios.
 */
describe("DELETE /companies/:handle", function () {

  /**
 * Test case: User can remove a company.
 * This test checks that an authenticated user can successfully delete a company.
 */
  test("works for users", async function () {
    const resp = await request(app)
      .delete(`/companies/c1`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: "c1" });
  });

  /**
 * Test case: Unauthenticated user cannot remove a company.
 * Checks that a request made without any authentication fails to delete a company.
 * The response should be '401 Unauthorized'.
 */
  test("unauth for anon", async function () {
    const resp = await request(app)
      .delete(`/companies/c1`);
    expect(resp.statusCode).toEqual(401);
  });

  /**
 * Test case: Returns 'not found' for non-existent company.
 * Tests when an attempt is made to delete a non-existent company by a regular authenticated user.
 * Expect the response to be '404 Not Found'.
 */
  test("not found for no such company", async function () {
    const resp = await request(app)
      .delete(`/companies/nope`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  /**
 * Test case: Returns 'not found' for non-existent company.
 * Same as the previous test but this time the attempt is made by an authenticated admin user.
 * Expect the response to be '404 Not Found'.
 */
  test("not found for no such company", async function () {
    const resp = await request(app)
        .delete(`/companies/nope`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
