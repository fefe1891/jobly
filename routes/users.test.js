"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app");
const User = require("../models/user");


/**
 * Initialize and clean up the database and data for testing before and after 
 * all test cases. 
 * This is typically used to prepare the system for testing.
 * For instance, to connect a database, create table and populate known set of data so that 
 * data is available to be used in test cases.
 * It uses Jest lifecycle methods which run the corresponding functions 
 * before/after each test function (beforeAll, beforeEach, afterEach, afterAll).
 */
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJobIds,
  u1Token,
  u2Token,
  adminToken,
} = require("./_testCommon");

//connect and populate database
beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
//clean up any leftover states and disconnect the database
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /users */

describe("POST /users", function () {

  // Test case1: Admin can create non-admin user
  test("works for admins: create non-admin", async function () {
    const resp = await request(app)
      .post("/users")
      .send({
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        password: "password-new",
        email: "new@email.com",
        isAdmin: false,
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        email: "new@email.com",
        isAdmin: false,
      }, token: expect.any(String),
    });
  });

  // Test case2: Admin can create another admin user
  test("works for admins: create admin", async function () {
    const resp = await request(app)
      .post("/users")
      .send({
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        password: "password-new",
        email: "new@email.com",
        isAdmin: true,
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        email: "new@email.com",
        isAdmin: true,
      }, token: expect.any(String),
    });
  });

  // Test case3: Regular user unauthorized to create new user
  test("unauth for users", async function () {
    const resp = await request(app)
      .post("/users")
      .send({
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        password: "password-new",
        email: "new@email.com",
        isAdmin: true,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  // Test case4: Unauthorized if not logged in
  test("unauth for anon", async function () {
    const resp = await request(app)
      .post("/users")
      .send({
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        password: "password-new",
        email: "new@email.com",
        isAdmin: true,
      });
    expect(resp.statusCode).toEqual(401);
  });

  // Test case5: Bad request if data is missing
  test("bad request if missing data", async function () {
    const resp = await request(app)
      .post("/users")
      .send({
        username: "u-new",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  // Test case6: Bad request if invalid data is entered
  test("bad request if invalid data", async function () {
    const resp = await request(app)
      .post("/users")
      .send({
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        password: "password-new",
        email: "not-an-email",
        isAdmin: true,
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /users */

describe("GET /users", function () {

  /**
 * Test case: Admins can fetch information about all users
 * This test creates a GET request to "/users" endpoint, asserting that an administrator can fetch data about all users.
 * It expects a successful (200) response containing user-related details for all users, irrespective of their admin status.
 * As such, in our test data, all descriptors of 'isAdmin' for the returned users are false, indicating these are all regular users.
 * However, the test primarily verifies that an administrator has privileges to view information of any and all users.
 */
  test("works for admins", async function () {
    const resp = await request(app)
      .get("/users")
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      users: [
        {
          username: "u1",
          firstName: "U1F",
          lastName: "U1L",
          email: "user1@user.com",
          isAdmin: false,
        },
        {
          username: "u2",
          firstName: "U2F",
          lastName: "U2L",
          email: "user2@user.com",
          isAdmin: false,
        },
        {
          username: "u3",
          firstName: "U3F",
          lastName: "U3L",
          email: "user3@user.com",
          isAdmin: false,
        },
      ],
    });
  });

  /**
 * Test case: Non-admin users unauthorized to fetch all user data
 * This test creates a GET request to "/users" endpoint with a non-admin container.
 * The test asserts that regular (non-admin) users are not authorized to access data of all users.
 * A '401 Unauthorized' response is expected, indicating insufficient permissions.
 */
  test("unauth for non-admin users", async function () {
    const resp = await request(app)
      .get("/users")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  /**
 * Test case: Unauthenticated users (anonymous) unauthorized to fetch all user data
 * This test creates a GET request to "/users" endpoint without any authentication (anonymous request).
 * The assertion is that unauthenticated users can't access user data, securing user data from unauthorized access.
 * The endpoint is expected to respond with a '401 Unauthorized' status code.
 */
  test("unauth for anon", async function () {
    const resp = await request(app)
      .get("/users");
    expect(resp.statusCode).toEqual(401);
  });

  /**
 * Test case: Proper handling of errors within the next() function
 * This test first drops the 'users' table from the database, which will essentially remove all users.
 * Next, it attempts to fetch all users as an admin. Given there are no users to fetch (because the table has just been dropped),
 * this scenario is essentially set up as an error simulation to ensure error handling middleware works correctly.
 * The error-handling middleware in your server should catch this error and send an HTTP 500 (Internal Server Error) response. This is the expected outcome.
 * Remember, this test is not part of regular testing scenarios, but simulates an error condition to verify if error handler is properly set.
 */
  test("fails: test next() handler", async function () {
    await db.query("DROP TABLE users CASCADE");
    const resp = await request(app)
      .get("/users")
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /users/:username */

/**
 * Test suite for endpoint: GET /users/:username
 * This set of tests is designed to verify the functionality and authorization rules of the endpoint.
 * A successful request should return details of a specific user identified by 'username'. 
 * Different roles and authorization scenarios are tested.
 */
describe("GET /users/:username", function () {
  /**
 * Test case: Admin can fetch details for any user.
 * Asserts that an admin can view the data of other users, including regular users.
 */
  test("works for admin", async function () {
    const resp = await request(app)
      .get(`/users/u1`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
        applications: [testJobIds[0]],
      },
    });
  });

  /**
 * Test case: A user can fetch their own details.
 * Tests the case where users fetch their own information using their own tokens.
 * Users should have access to their own details and the result should be their data.
 */
  test("works for same user", async function () {
    const resp = await request(app)
      .get(`/users/u1`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
        applications: [testJobIds[0]],
      },
    });
  });

  /**
 * Test case: Users cannot fetch details of other users.
 * Checks the assertion that one user cannot fetch the data of another user for privacy reasons.
 * The endpoint should return '401 Unauthorized' in this case.
 */
  test("unauth for other users", async function () {
    const resp = await request(app)
      .get(`/users/u1`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  /**
 * Test case: Unauthenticated users (anonymous, no tokens) cannot fetch user details.
 * Asserts the privacy rule that an anonymous request cannot fetch user data.
 * The endpoint should return a '401 Unauthorized' status code.
 */
  test("unauth for anon", async function () {
    const resp = await request(app)
      .get(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });

  /**
 * Test case: Handles user not found correctly.
 * Tests the case where the username specified does not exist in the database.
 * The result should return a '404 Not Found' status code.
 */
  test("not found if user not found", async function () {
    const resp = await request(app)
      .get(`/users/nope`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /users/:username */

/**
 * Test suite for endpoint: PATCH /users/:username
 * These tests verify that updates to user data work correctly.
 * Different roles and authorization scenarios are tested as well as bad data and nonexistent users,
 * including positive scenarios (successful update) and negative scenarios (unauthorized access, invalid data etc.).
 */
describe("PATCH /users/:username", () => {

  /**
 * Test case: Admin can update user details.
 * Asserts that an admin can update the details of other users, including regular users.
 */
  test("works for admins", async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        firstName: "New",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "New",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
  });

  /**
 * Test case: A user can update their own details.
 * Tests where users update their own information using their own tokens.
 * Users should be able to modify their own details.
 */
  test("works for same user", async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        firstName: "New",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "New",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
  });

  /**
 * Test case: Users cannot update details of other users.
 * Checks the rule that one user cannot modify the data of another user for privacy reasons.
 * The endpoint should return '401 Unauthorized' in this case.
 */
  test("unauth if not same user", async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        firstName: "New",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  /**
 * Test case: Unauthenticated users (anonymous, no tokens) cannot update user details.
 * Asserts that an anonymous request cannot modify user data.
 * The endpoint should return a '401 Unauthorized' status code.
 */
  test("unauth for anon", async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        firstName: "New",
      });
    expect(resp.statusCode).toEqual(401);
  });

  /**
 * Test case: Handles no such user correctly.
 * Tests the case where the username specified does not exist in the database.
 * The result should be a '404 Not Found' status code.
 */
  test("not found if no such user", async function () {
    const resp = await request(app)
      .patch(`/users/nope`)
      .send({
        firstName: "Nope",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  /**
 * Test case: Invalid data doesn't break the system.
 * Tests system behavior when invalid update data (non-string firstName) is sent.
 * Expects the system to return '400 Bad Request'.
 */
  test("bad request if invalid data", async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        firstName: 42,
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  /**
 * Test case: Successfully updates password.
 * Checks whether password updates (a sensitive operation) are handled correctly.
 * After the password update, the user should be able to authenticate with the new password.
 */
  test("works: can set new password", async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        password: "new-password",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
    const isSuccessful = await User.authenticate("u1", "new-password");
    expect(isSuccessful).toBeTruthy();
  });
});

/************************************** DELETE /users/:username */

/**
 * Test suite for endpoint: DELETE /users/:username
 * These tests verify that the deletion of user data functions as expected.
 * Different roles and authorization scenarios are tested, including positive scenarios (successful deletion) and negative scenarios (unauthorized access, nonexistent user).
 */
describe("DELETE /users/:username", function () {

  /**
 * Test case: Admin can delete user.
 * Asserts that an admin can delete other users, including regular users.
 * The endpoint should return a successful deletion confirmation.
 */
  test("works for admin", async function () {
    const resp = await request(app)
      .delete(`/users/u1`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: "u1" });
  });

  /**
 * Test case: A user can delete themselves.
 * Tests the case where users delete themselves using their own tokens.
 * The result should be a successful deletion confirmation.
 */
  test("works for same user", async function () {
    const resp = await request(app)
      .delete(`/users/u1`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: "u1" });
  });

  /**
 * Test case: Users cannot delete other users.
 * Checks the security rule that one user cannot delete another user.
 * The endpoint should return '401 Unauthorized' in this case.
 */
  test("unauth if not same user", async function () {
    const resp = await request(app)
      .delete(`/users/u1`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  /**
 * Test case: Unauthenticated users (anonymous, no tokens) cannot delete users.
 * Asserts that an anonymous request cannot delete user.
 * The endpoint should return '401 Unauthorized' status code.
 */
  test("unauth for anon", async function () {
    const resp = await request(app)
      .delete(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });

  /**
 * Test case: Handles no such user correctly.
 * Tests the case where the username specified does not exist in the database.
 * The result should be a '404 Not Found' status code.
 */
  test("not found if user missing", async function () {
    const resp = await request(app)
      .delete(`/users/nope`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** POST /users/:username/jobs/:id */

/**
 * Test suite for endpoint: POST /users/:username/jobs/:id
 * These tests verify the functionality of the user job application endpoint.
 * Different roles and authorization scenarios are tested, including success and failure scenarios.
 */
describe("POST /users/:username/jobs/:id", function () {

  /**
 * Test case: Admin can apply for jobs on behalf of the user.
 * Asserts that an admin can apply for a job on behalf of another user.
 */
  test("works for admin", async function () {
    const resp = await request(app)
      .post(`/users/u1/jobs/${testJobIds[1]}`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ applied: testJobIds[1] });
  });

  /**
 * Test case: A user can apply for a job for themselves.
 * Tests the case where a user applies for a job using their own token.
 */
  test("works for same user", async function () {
    const resp = await request(app)
      .post(`/users/u1/jobs/${testJobIds[1]}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ applied: testJobIds[1] });
  });

  /**
 * Test case: A user cannot apply for a job on behalf of others.
 * Checks that users cannot apply for a job on behalf of another user, asserting good authorization rules.
 * The endpoint should return '401 Unauthorized' for such case.
 */
  test("unauth for others", async function () {
    const resp = await request(app)
      .post(`/users/u1/jobs/${testJobIds[1]}`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  /**
 * Test case: Unauthenticated users cannot apply for a job.
 * Asserts that an anonymous request cannot apply for a job.
 * The endpoint should return '401 Unauthorized' in this case.
 */
  test("unauth for anon", async function () {
    const resp = await request(app)
      .post(`/users/u1/jobs/${testJobIds[1]}`);
    expect(resp.statusCode).toEqual(401);
  });

  /**
 * Test case: Handles no such user correctly.
 * Tests the case where the username specified does not exist in the database.
 * The result should return a '404 Not Found' status code.
 */
  test("not found for no such username", async function () {
    const resp = await request(app)
      .post(`/users/nope/jobs/${testJobIds[1]}`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  /**
 * Test case: Handles no such job correctly.
 * Tests the case where the job id specified does not exist in the database.
 * The result should return a '404 Not Found' status code.
 */
  test("not found for no such job", async function () {
    const resp = await request(app)
      .post(`/users/u1/jobs/0`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  /**
 * Test case: Invalid job id input doesn't break the system.
 * Tests system behavior when an invalid job id is provided.
 * Expects the system to return '404 Not Found'.
 */
  test("bad request invalid job id", async function () {
    const resp = await request(app)
      .post(`/users/u1/jobs/0`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
