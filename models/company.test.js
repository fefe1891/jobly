"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Company = require("./company.js");
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

/************************************** create */

/**
 * Test suite for the 'create' function in the Company model. 
 * Tests validate if a new company record can be created and if an error is thrown when attempting 
 * to duplicate a company.
 */
describe("create", function () {
  const newCompany = {
    handle: "new",
    name: "New",
    description: "New Description",
    numEmployees: 1,
    logoUrl: "http://new.img",
  };

  /**
 * Test case: Company creation works.
 * This test validates that a new company record can be successfully created in the database, 
 * given valid company data. Subsequent to company creation, a database query is conducted to affirm 
 * the company's existence and its matching details.
 */
  test("works", async function () {
    let company = await Company.create(newCompany);
    expect(company).toEqual(newCompany);

    const result = await db.query(
      `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'new'`);
    expect(result.rows).toEqual([
      {
        handle: "new",
        name: "New",
        description: "New Description",
        num_employees: 1,
        logo_url: "http://new.img",
      },
    ]);
  });

  /**
 * Test case: Duplication of a company leads to a 'BadRequest' error.
 * This verification checks if a BadRequestError is returned when trying to create a company 
 * with duplicate company data.
 */
  test("bad request with dupe", async function () {
    try {
      await Company.create(newCompany);
      await Company.create(newCompany);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

/**
 * Test suite for the 'findAll' function in the Company model.
 * This test verifies that the function can retrieve all companies from the database without any filters. 
 */
describe("findAll", function () {
  /**
 * Test case: Fetching all companies without any filter.
 * This test checks if the function successfully retrieves all companies in the system when called with no filters.
 */
  test("works: no filter", async function () {
    let companies = await Company.findAll();
    expect(companies).toEqual([
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
    ]);
  });
});

/************************************** get */

/**
 * Test suite for the 'get' function in the Company model.
 * This test suite validates that the function can retrieve a company's details from the database and that it throws
 * a NotFoundError when the company does not exist.
 */
describe("get", function () {
  /**
  * Test case: Fetching a company's details works.
  * This test checks if the 'get' function of the Company model can successfully fetch a company's details given a valid company handle.
  */
  test("works", async function () {
    let company = await Company.get("c1");
    expect(company).toEqual({
      handle: "c1",
      name: "C1",
      description: "Desc1",
      numEmployees: 1,
      logoUrl: "http://c1.img",
    });
  });

  /**
  * Test case: Returns 'NotFound' error if the company doesn't exist.
  * This test checks if a NotFoundError is thrown when trying to get a company's details using a non-existent company handle.
  */
  test("not found if no such company", async function () {
    try {
      await Company.get("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

/**
  * Test suite for the 'update' function in the Company model.
  * These tests validate updating a company's attributes like name, description, numEmployees, and logoUrl. 
  */
describe("update", function () {
  const updateData = {
    name: "New",
    description: "New Description",
    numEmployees: 10,
    logoUrl: "http://new.img",
  };

  /**
  * Test case: Updating a company's details works.
  * This test checks whether the function correctly updates a company's details given a valid company handle and updates data.
  */
  test("works", async function () {
    let company = await Company.update("c1", updateData);
    expect(company).toEqual({
      handle: "c1",
      ...updateData,
    });

    const result = await db.query(
      `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'c1'`);
    expect(result.rows).toEqual([{
      handle: "c1",
      name: "New",
      description: "New Description",
      num_employees: 10,
      logo_url: "http://new.img",
    }]);
  });

  /**
  * Test case: Updating a company's details works, including setting fields to null.
  * This tests if the function correctly handles null values in the update data.
  */
  test("works: null fields", async function () {
    const updateDataSetNulls = {
      name: "New",
      description: "New Description",
      numEmployees: null,
      logoUrl: null,
    };

    let company = await Company.update("c1", updateDataSetNulls);
    expect(company).toEqual({
      handle: "c1",
      ...updateDataSetNulls,
    });

    const result = await db.query(
      `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'c1'`);
    expect(result.rows).toEqual([{
      handle: "c1",
      name: "New",
      description: "New Description",
      num_employees: null,
      logo_url: null,
    }]);
  });

  /**
  * Test case: Returns 'NotFound' error if no such company.
  * This test verifies if a NotFoundError is returned when trying to update a non-existent company.
  */
  test("not found if no such company", async function () {
    try {
      await Company.update("nope", updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  /**
  * Test case: Returns 'BadRequestError' if no update data given.
  * This test verifies whether the function throws a BadRequestError if no data is provided for the update.
  */
  test("bad request with no data", async function () {
    try {
      await Company.update("c1", {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

/**
 * Test suite for the 'remove' function in the Company model.
 * These tests verify that the function successfully removes a company given a valid company handle, and throws a NotFoundError when trying to remove a company with a non-existent handle.
 */
describe("remove", function () {
  /**
 * Test case: Company removal works.
 * This test confirms that a company can be effectively deleted via the 'remove' function given a valid company handle. A query is performed to ensure the absence of the company record in the database.
 */
  test("works", async function () {
    await Company.remove("c1");
    const res = await db.query(
      "SELECT handle FROM companies WHERE handle='c1'");
    expect(res.rows.length).toEqual(0);
  });

  /**
 * Test case: Returns 'NotFound' error if no such company.
 * This test validates whether a NotFoundError is thrown when trying to remove a company that doesn't exist in the database.
 */
  test("not found if no such company", async function () {
    try {
      await Company.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
