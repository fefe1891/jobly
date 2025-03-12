"use strict";

const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");
const db = require("../db.js");
const User = require("./user.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJobIds,
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

/************************************** authenticate */

/**
 * Test suite for the 'authenticate' function in the User model.
 * These tests verify the process of user authentication in the system.
 * They include scenarios for successful authentication, non-existing user, and wrong password.
 */
describe("authenticate", function () {

  /**
 * Test case: Authentication works with correct username and password.
 * This test verifies that a user can authenticate successfully if the correct username and password are provided.
 */
  test("works", async function () {
    const user = await User.authenticate("u1", "password1");
    expect(user).toEqual({
      username: "u1",
      firstName: "U1F",
      lastName: "U1L",
      email: "u1@email.com",
      isAdmin: false,
    });
  });

  /**
 * Test case: Non-existing users can't authenticate.
 * Checks that a non-existing user (or one with incorrect username) can't authenticate.
 * The test expects the system to throw an 'UnauthorizedError'.
 */
  test("unauth if no such user", async function () {
    try {
      await User.authenticate("nope", "password");
      fail();
    } catch (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    }
  });

  /**
 * Test case: Incorrect password should fail to authenticate.
 * This test verifies that providing the wrong password for a user should fail to authenticate.
 * The test expects 'UnauthorizedError' to be thrown.
 */
  test("unauth if wrong password", async function () {
    try {
      await User.authenticate("c1", "wrong");
      fail();
    } catch (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    }
  });
});

/************************************** register */

/**
 * Test suite for the 'register' function in the User model.
 * These tests validate the user registration process, covering successful registration, admin registration and duplicate user data scenarios.
 */
describe("register", function () {
  const newUser = {
    username: "new",
    firstName: "Test",
    lastName: "Tester",
    email: "test@test.com",
    isAdmin: false,
  };

  /**
 * Test case: A new user can register successfully.
 * This test verifies that a new user can successfully register and the correct information is properly stored in the database.
 */
  test("works", async function () {
    let user = await User.register({
      ...newUser,
      password: "password",
    });
    expect(user).toEqual(newUser);
    const found = await db.query("SELECT * FROM users WHERE username = 'new'");
    expect(found.rows.length).toEqual(1);
    expect(found.rows[0].is_admin).toEqual(false);
    expect(found.rows[0].password.startsWith("$2b$")).toEqual(true);
  });

  /**
 * Test case: A user can register as admin.
 * This test verifies that a new user can successfully register as an admin, and the user's admin status is properly stored in the database.
 */
  test("works: adds admin", async function () {
    let user = await User.register({
      ...newUser,
      password: "password",
      isAdmin: true,
    });
    expect(user).toEqual({ ...newUser, isAdmin: true });
    const found = await db.query("SELECT * FROM users WHERE username = 'new'");
    expect(found.rows.length).toEqual(1);
    expect(found.rows[0].is_admin).toEqual(true);
    expect(found.rows[0].password.startsWith("$2b$")).toEqual(true);
  });

  /**
 * Test case: Duplicate user data results in a bad request.
 * This checks if the registration attempts with duplicate data, 
 * The function expected to throw a BadRequestError.
 */
  test("bad request with dup data", async function () {
    try {
      await User.register({
        ...newUser,
        password: "password",
      });
      await User.register({
        ...newUser,
        password: "password",
      });
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

/**
 * Test suite for the 'findAll' function in the User model.
 * These tests are designed to validate the process of retrieving all users.
 */
describe("findAll", function () {

  /**
 * Test case: Retrieval of all users works.
 * This test confirms that the 'findAll' function can successfully retrieve and return all users in the system.
 */
  test("works", async function () {
    const users = await User.findAll();
    expect(users).toEqual([
      {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "u1@email.com",
        isAdmin: false,
      },
      {
        username: "u2",
        firstName: "U2F",
        lastName: "U2L",
        email: "u2@email.com",
        isAdmin: false,
      },
    ]);
  });
});

/************************************** get */

/**
 * Test suite for the 'get' function in the User model.
 * These tests verify the process of retrieving a user's data.
 * They cover two scenarios: getting a user that exists and trying to get a user that doesn't exist.
 */
describe("get", function () {
  test("works", async function () {
    let user = await User.get("u1");
    expect(user).toEqual({
      username: "u1",
      firstName: "U1F",
      lastName: "U1L",
      email: "u1@email.com",
      isAdmin: false,
      applications: [testJobIds[0]],
    });
  });

  /**
 * Test case: Retrieval works for existing users.
 * This test verifies that the function works correctly when the user exists.
 * The user information, which includes the username, first name, last name, email and admin status, among other things, is retrieved successfully.
 */
  test("not found if no such user", async function () {
    try {
      await User.get("not-today");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

/**
 * Test suite for the 'update' function in the User model.
 * These tests validate the user data update process.
 * They cover scenarios for successful data update, updating password, not found user, and bad request with no data.
 */
describe("update", function () {
  const updateData = {
    firstName: "NewF",
    lastName: "NewF",
    email: "new@email.com",
    isAdmin: true,
  };

  /**
 * Test case: User data update works for existing users.
 * This test verifies that user data can be successfully updated with the correct information provided.
 */
  test("works", async function () {
    let job = await User.update("u1", updateData);
    expect(job).toEqual({
      username: "u1",
      ...updateData,
    });
  });

  /**
 * Test case: Password update works for existing users.
 * This test checks a scenario where a user tries to update their password. 
 * New password hashing and storage are also verified.
 */
  test("works: set password", async function () {
    let job = await User.update("u1", {
      password: "new",
    });
    expect(job).toEqual({
      username: "u1",
      firstName: "U1F",
      lastName: "U1L",
      email: "u1@email.com",
      isAdmin: false,
    });
    const found = await db.query("SELECT * FROM users WHERE username = 'u1'");
    expect(found.rows.length).toEqual(1);
    expect(found.rows[0].password.startsWith("$2b$")).toEqual(true);
  });

  /**
 * Test case: If no such user, return 'NotFound' error.
 * This test verifies that an error will be thrown if it tries to update a user that doesn't exist.
 */
  test("not found if no such user", async function () {
    try {
      await User.update("nope", {
        firstName: "test",
      });
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  /**
 * Test case: A bad request if no data is provided for the update.
 * This test checks if the function throws a BadRequestError when no data is provided for update.
 */
  test("bad request if no data", async function () {
    expect.assertions(1);
    try {
      await User.update("c1", {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

/**
 * Test suite for the 'remove' function in the User model.
 * These tests validate the user removal process.
 * Two scenarios are tested: removal of an existing user and trying to remove a user that doesn't exist.
 */
describe("remove", function () {
  test("works", async function () {
    await User.remove("u1");
    const res = await db.query(
      "SELECT * FROM users WHERE username='u1'");
    expect(res.rows.length).toEqual(0);
  });

  /**
 * Test case: User removal works for existing users.
 * This test verifies that the function effectively removes a user if it exists.
 */
  test("not found if no such user", async function () {
    try {
      await User.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/**
 * Test suite for the 'applyToJob' function in the User model.
 * These tests validate the process where a user applies to a job.
 * They cover scenarios: successful job application, non-existent job application, and non-existent user application.
 */
describe("applyToJob", function () {
  /**
 * Test case: A user can successfully apply to a job.
 * This test checks if a successful job application has been recorded in the system.
 */
  test("works", async function () {
    await User.applyToJob("u1", testJobIds[1]);

    const res = await db.query(
      "SELECT * FROM applications WHERE job_id=$1", [testJobIds[1]]);
    expect(res.rows).toEqual([{
      job_id: testJobIds[1],
      username: "u1",
    }]);
  });

/**
 * Test case: Returns 'NotFound' error if no such job to apply to.
 * This test inspects whether 'NotFoundError' is returned when trying to apply a user for a non-existent job. 
 */
  test("not found if no such job", async function () {
    try {
      await User.applyToJob("u1", 0, "applied");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  /**
 * Test case: Returns 'NotFound' error if no such user to apply.
 * This test checks whether 'NotFoundError' is returned when trying to apply a non-existent user to a job.
 */
  test("not found if no such user", async function () {
    try {
      await User.applyToJob("nope", testJobIds[0], "applied");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
