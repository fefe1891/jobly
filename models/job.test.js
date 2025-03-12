"use strict";

const { NotFoundError, BadRequestError } = require("../expressError");
const db = require("../db.js");
const Job = require("./job.js");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    testJobIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

/**
 * Test suite for the 'create' function in the Job model.
 * These tests verify the process of creating a job.
 */
describe("create", function () {
    let newJob = {
        companyHandle: "c1",
        title: "Test",
        salary: 100,
        equity: "0.1",
    };

    /**
 * Test case: Job creation works.
 * This test checks that a job can be successfully created with valid data.
 * The job information - which includes the company handle, title, salary, and equity - 
 * should match the provided data except for job ID, which can be any number.
 */
    test("works", async function () {
        let job = await Job.create(newJob);
        expect(job).toEqual({
            ...newJob,
            id: expect.any(Number),
        });
    });
});

/************************************** findAll */

/**
 * Test suite for the 'findAll' function in the Job model. 
 * These tests validate retrieving all jobs with various filters like minimum salary, equity, and job title.
 */
describe("findAll", function () {
    /**
 * Test case: Retrieving all jobs without any filter.
 * This test validates that the function returns all jobs in the system when called without any filters.
 */
    test("works: no filter", async function () {
        let jobs = await Job.findAll();
        expect(jobs).toEqual([
            {
                id: testJobIds[0],
                title: "Job1",
                salary: 100,
                equity: "0.1",
                companyHandle: "c1",
                companyName: "C1",
            },
            {
                id: testJobIds[1],
                title: "Job2",
                salary: 200,
                equity: "0.2",
                companyHandle: "c1",
                companyName: "C1",
            },
            {
                id: testJobIds[2],
                title: "Job3",
                salary: 300,
                equity: "0",
                companyHandle: "c1",
                companyName: "C1",
            },
            {
                id: testJobIds[3],
                title: "Job4",
                salary: null,
                equity: null,
                companyHandle: "c1",
                companyName: "C1",
            },
        ]);
    });

    /**
 * Test case: Retrieving all jobs with a minimum salary filter.
 * This test checks that the function returns only jobs with a salary greater than or equal to the specified minimum.
 */
    test("works: by min salary", async function () {
        let jobs = await Job.findAll({ minSalary: 250 });
        expect(jobs).toEqual([
            {
                id: testJobIds[2],
                title: "Job3",
                salary: 300,
                equity: "0",
                companyHandle: "c1",
                companyName: "C1",
            },
        ]);
    });

    /**
 * Test case: Retrieving all jobs with an equity filter.
 * This test checks that the function returns only jobs where equity is offered.
 */
    test("works: by equity", async function () {
        let jobs = await Job.findAll({ hasEquity: true });
        expect(jobs).toEqual([
            {
                id: testJobIds[0],
                title: "Job1",
                salary: 100,
                equity: "0.1",
                companyHandle: "c1",
                companyName: "C1",
            },
            {
                id: testJobIds[1],
                title: "Job2",
                salary: 200,
                equity: "0.2",
                companyHandle: "c1",
                companyName: "C1",
            },
        ]);
    });

    /**
 * Test case: Retrieving jobs with both minimum salary and equity filters.
 * This test verifies that the function returns jobs that both offer equity and have a salary greater than or equal to the specified minimum.
 */
    test("works: by min salary & equity", async function () {
        let jobs = await Job.findAll({ minSalary: 150, hasEquity: true });
        expect(jobs).toEqual([
            {
                id: testJobIds[1],
                title: "Job2",
                salary: 200,
                equity: "0.2",
                companyHandle: "c1",
                companyName: "C1",
            },
        ]);
    });

    /**
 * Test case: Retrieving jobs by name.
 * This test validates that the function returns jobs with a title that match the specified search.
 */
    test("works: by name", async function () {
        let jobs = await Job.findAll({ title: "ob1" });
        expect(jobs).toEqual([
            {
                id: testJobIds[0],
                title: "Job1",
                salary: 100,
                equity: "0.1",
                companyHandle: "c1",
                companyName: "C1",
            },
        ]);
    });
});

/************************************** get */

/**
 * Test suite for the 'get' function in the Job model.
 * These tests ensure that the function can correctly retrieve job information based on a provided job id.
 */
describe("get", function () {
    /**
 * Test case: Fetching details of a job works.
 * The test checks whether a job's details can be successfully retrieved given a valid job id.
 */
    test("works", async function () {
        let job = await Job.get(testJobIds[0]);
        expect(job).toEqual({
            id: testJobIds[0],
            title: "Job1",
            salary: 100,
            equity: "0.1",
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
 * Test case: Returns 'NotFound' error if no such job.
 * This test checks if a NotFoundError is thrown when trying to get a job with an non-existent id.
 */
    test("not found if no such job", async function () {
        try {
            await Job.get(0);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

/************************************** update */

/**
 * Test suite for the 'update' function in the Job model. 
 * These tests validate updating a job's attributes like title, salary, and equity.
 */
describe("update", function () {
    let updateData = {
        title: "New",
        salary: 500,
        equity: "0.5",
    };
    /**
 * Test case: Updating a job's details works.
 * This test verifies that the function correctly updates a job's details given a valid job id and updates data.
 */
    test("works", async function () {
        let job = await Job.update(testJobIds[0], updateData);
        expect(job).toEqual({
            id: testJobIds[0],
            companyHandle: "c1",
            ...updateData,
        });
    });

    /**
 * Test case: Returns 'NotFound' error if no such job.
 * This test checks if a NotFoundError is returned when trying to update a job with a non-existent id.
 */
    test("not found if no such job", async function () {
        try {
            await Job.update(0, {
                title: "test",
            });
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });

    /**
 * Test case: returns 'BadRequestError' if no update data given.
 * This test verifies that the function throws a BadRequestError if called with a valid job id but without any data to update.
 */
    test("bad request with no data", async function () {
        try {
            await Job.update(testJobIds[0], {});
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** remove */

/**
 * Test suite for the 'remove' function in the Job model.
 * These tests verify that the function successfully removes a job given a valid job id, 
 * and throws a NotFoundError when trying to remove a job with a non-existent id.
 */
describe("remove", function () {
    /**
 * Test case: Job removal works.
 * This test confirms that a job can be removed effectively via the 'remove' function,
 * given a valid job id. A query is conducted to ensure that the job record no longer exists in the database.
 */
    test("works", async function () {
        await Job.remove(testJobIds[0]);
        const res = await db.query(
            "SELECT id FROM jobs WHERE id=$1", [testJobIds[0]]);
        expect(res.rows.length).toEqual(0);
    });

    /**
 * Test case: Returns 'NotFound' error if no such job.
 * This test examines whether a NotFoundError is thrown when trying to remove a job which does not exist.
 */
    test("not found if no such job", async function () {
        try {
            await Job.remove(0);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});
