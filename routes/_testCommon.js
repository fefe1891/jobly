"use strict";

const db = require("../db.js");
const User = require("../models/user");
const Company = require("../models/company");
const Job = require("../models/job");
const { createToken } = require("../helpers/tokens");

const testJobIds = [];

async function commonBeforeAll() {

  // Cleaning up the test environment before tests begin
  // Deleting all users and companies from the database before the testing phas
  await db.query("DELETE FROM users");
  await db.query("DELETE FROM companies");

  // Setting up the test environment by creating some companies
  await Company.create(
    {
      handle: "c1",
      name: "C1",
      numEmployees: 1,
      description: "Desc1",
      logoUrl: "http://c1.img",
    });
  await Company.create(
    {
      handle: "c2",
      name: "C2",
      numEmployees: 2,
      description: "Desc2",
      logoUrl: "http://c2.img",
    });
  await Company.create(
    {
      handle: "c3",
      name: "C3",
      numEmployees: 3,
      description: "Desc3",
      logoUrl: "http://c3.img",
    });

  /* 
   The 'testJobIds' array will store the identifiers of the jobs that are created 
   as part of this test setup.

   These 'jobId's can be used throughout this test file to reference these particular
   jobs when forming HTTP requests to the routes that need job identifiers.

   Each index in the array corresponds to a particular job that's created.
 */

  // Create and store the ID of the job 'J1' belongs to company 'c1' in 'testJobIds[0]'
  testJobIds[0] = (await Job.create(
    { title: "J1", salary: 1, equity: "0.1", companyHandle: "c1" })).id;
  // Create and store the ID of the job 'J2' belongs to company 'c1' in 'testJobIds[1]'
  testJobIds[1] = (await Job.create(
    { title: "J2", salary: 2, equity: "0.2", companyHandle: "c1" })).id;
  // Create and store the ID of the job 'J3' belongs to company 'c1' in 'testJobIds[2]'
  testJobIds[2] = (await Job.create(
    { title: "J3", salary: 3, /* equity null */ companyHandle: "c1" })).id;


  // Register three users for testing purpose.
  // Each user is given a username, name, email, password, and admin status
  await User.register({
    username: "u1",
    firstName: "U1F",
    lastName: "U1L",
    email: "user1@user.com",
    password: "password1",
    isAdmin: false,
  });
  await User.register({
    username: "u2",
    firstName: "U2F",
    lastName: "U2L",
    email: "user2@user.com",
    password: "password2",
    isAdmin: false,
  });
  await User.register({
    username: "u3",
    firstName: "U3F",
    lastName: "U3L",
    email: "user3@user.com",
    password: "password3",
    isAdmin: false,
  });

  // Make user 'u1' apply to the job with id 'testJobIds[0]'
  await User.applyToJob("u1", testJobIds[0]);
}

// Before each test, start a new transaction.
async function commonBeforeEach() {
  await db.query("BEGIN");
}

// After each test, rollback any changes that were made in the test
async function commonAfterEach() {
  await db.query("ROLLBACK");
}

// After all tests have finished, close the database connection
async function commonAfterAll() {
  await db.end();
}


// Tokens for `u1` and `u2` (non-admin) and `admin` user are generated
// These tokens will be used to authenticate and authorize these users in test cases.
const u1Token = createToken({ username: "u1", isAdmin: false });
const u2Token = createToken({ username: "u2", isAdmin: false });
// The 'adminToken' is an administrative user token
const adminToken = createToken({ username: "admin", isAdmin: true });


module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJobIds,
  u1Token,
  u2Token,
  adminToken,
};
