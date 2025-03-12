"use strict";

const request = require("supertest");

const app = require("../app");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    testJobIds,
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

describe("POST /jobs", () => {
    // Helper function to send a POST request to create a job
    const postJob = async (token, jobData) => {
        return await request(app)
            .post(`/jobs`)
            .send(jobData)
            .set("authorization", `Bearer ${token}`); // Set the authorization header
    };

    // Test case for successful job creation by an admin
    test("ok for admin", async () => {
        const resp = await postJob(adminToken, {
            companyHandle: "c1",
            title: "J-new",
            salary: 10,
            equity: "0.2",
        });
        expect(resp.statusCode).toEqual(201); // Expect a 201 Created response
        expect(resp.body).toEqual({
            job: {
                id: expect.any(Number), // Expect an ID to be returned
                title: "J-new",
                salary: 10,
                equity: "0.2",
                companyHandle: "c1",
            },
        });
    });

    // Test case for unauthorized job creation by a regular user
    test("unauth for users", async () => {
        const resp = await postJob(u1Token, {
            companyHandle: "c1",
            title: "J-new",
            salary: 10,
            equity: "0.2",
        });
        expect(resp.statusCode).toEqual(401); // Expect a 401 Unauthorized response
    });

    // Test case for job creation with missing required data
    test("bad request with missing data", async () => {
        const resp = await postJob(adminToken, { companyHandle: "c1" });
        expect(resp.statusCode).toEqual(400); // Expect a 400 Bad Request response
    });

    // Test case for job creation with missing required data
    test("bad request with missing data", async () => {
        const resp = await postJob(adminToken, { companyHandle: "c1" });
        expect(resp.statusCode).toEqual(400); // Expect a 400 Bad Request response
    });

    // Test case for job creation with invalid data
    test("bad request with invalid data", async () => {
        const resp = await postJob(adminToken, {
            companyHandle: "c1",
            title: "J-new",
            salary: "not-a-number", // Invalid salary
            equity: "0.2",
        });
        expect(resp.statusCode).toEqual(400); // Expect a 400 Bad Request response
    });
});

/**
 * Test suite for endpoint: GET /jobs
 * These tests verify that retrieving all jobs in the system works as expected. 
 * It includes checks for different search filters.
 */
describe("GET /jobs", function () {

    /**
 * Test case: Check unauthenticated users can view jobs.
 * This test asserts that the endpoint is publicly visible and does not need any authentication.
 */
    test("ok for anon", async function () {
        const resp = await request(app).get(`/jobs`);
        expect(resp.body).toEqual({
            jobs: [
                {
                    id: expect.any(Number),
                    title: "J1",
                    salary: 1,
                    equity: "0.1",
                    companyHandle: "c1",
                    companyName: "C1",
                },
                {
                    id: expect.any(Number),
                    title: "J2",
                    salary: 2,
                    equity: "0.2",
                    companyHandle: "c1",
                    companyName: "C1",
                },
                {
                    id: expect.any(Number),
                    title: "J3",
                    salary: 3,
                    equity: null,
                    companyHandle: "c1",
                    companyName: "C1",
                },
            ],
        },
        );
    });

    /**
 * Test case: Check job filtering based on equity.
 * Asserts that the job query system works when a hasEquity filter is provided and returns only those jobs that have non-zero equity.
 */
    test("works: filtering", async function () {
        const resp = await request(app)
            .get(`/jobs`)
            .query({ hasEquity: true });
        expect(resp.body).toEqual({
            jobs: [
                {
                    id: expect.any(Number),
                    title: "J1",
                    salary: 1,
                    equity: "0.1",
                    companyHandle: "c1",
                    companyName: "C1",
                },
                {
                    id: expect.any(Number),
                    title: "J2",
                    salary: 2,
                    equity: "0.2",
                    companyHandle: "c1",
                    companyName: "C1",
                },
            ],
        },
        );
    });

    /**
 * Test case: Checks job filtering works with two filters: minSalary and title.
 * Tests whether the application correctly filters out jobs that have a salary below the minSalary value and include title provided.
 */
    test("works: filtering on 2 filters", async function () {
        const resp = await request(app)
            .get(`/jobs`)
            .query({ minSalary: 2, title: "3" });
        expect(resp.body).toEqual({
            jobs: [
                {
                    id: expect.any(Number),
                    title: "J3",
                    salary: 3,
                    equity: null,
                    companyHandle: "c1",
                    companyName: "C1",
                },
            ],
        },
        );
    });

    /**
 * Test case: Checks that system responds correctly for an invalid filter.
 * Tests system behavior when a non-existing filter parameter is given.
 * Expects the system to return '400 Bad Request'.
 */
    test("bad request on invalid filter key", async function () {
        const resp = await request(app)
            .get(`/jobs`)
            .query({ minSalary: 2, nope: "nope" });
        expect(resp.statusCode).toEqual(400);
    });
});

describe("GET /jobs/:id", () => {
    // Helper function to send a GET request for a specific job by ID
    const getJobById = async (id) => {
        return await request(app).get(`/jobs/${id}`); // Send GET request for a specific job
    };

    // Test case for retrieving a specific job as an anonymous user
    test("works for anon", async () => {
        const resp = await getJobById(testJobIds[0]);
        expect(resp.body).toEqual({
            job: {
                id: testJobIds[0],
                title: "J1",
                salary: 1,
                equity: "0.1",
                company: {
                    handle: "c1",
                    name: "C1",
                    description: "Desc1",
                    numEmployees: 1,
                    logoUrl: "http://c1.img",
                },
            },
        });
    });

    // Test case for retrieving a non-existent job
    test("not found for no such job", async () => {
        const resp = await getJobById(0); // Attempt to get a job with a non-existent ID
        expect(resp.statusCode).toEqual(404); // Expect a 404 Not Found response
    });
});

describe("PATCH /jobs/:id", () => {
    // Helper function to send a PATCH request to update a job
    const patchJob = async (id, token, updateData) => {
        return await request(app)
            .patch(`/jobs/${id}`)
            .send(updateData)
            .set("authorization", `Bearer ${token}`); // Set the authorization header
    };

    // Test case for successful job update by an admin
    test("works for admin", async () => {
        const resp = await patchJob(testJobIds[0], adminToken, {
            title: "J-New",
        });
        expect(resp.body).toEqual({
            job: {
                id: expect.any(Number), // Expect an ID to be returned
                title: "J-New",
                salary: 1,
                equity: "0.1",
                companyHandle: "c1",
            },
        });
    });

    // Test case for successful job update by an admin
    test("works for admin", async () => {
        const resp = await patchJob(testJobIds[0], adminToken, {
            title: "J-New",
        });
        expect(resp.body).toEqual({
            job: {
                id: expect.any(Number), // Expect an ID to be returned
                title: "J-New",
                salary: 1,
                equity: "0.1",
                companyHandle: "c1",
            },
        });
    });

    // Test case for unauthorized job update by a regular user
    test("unauth for others", async () => {
        const resp = await patchJob(testJobIds[0], u1Token, {
            title: "J-New",
        });
        expect(resp.statusCode).toEqual(401); // Expect a 401 Unauthorized response
    });

    // Test case for updating a non-existent job
    test("not found on no such job", async () => {
        const resp = await patchJob(0, adminToken, {
            handle: "new",
        });
        expect(resp.statusCode).toEqual(400); // Expect a 400 Bad Request response
    });

    // Test case for attempting to change a job's handle
    test("bad request on handle change attempt", async () => {
        const resp = await patchJob(testJobIds[0], adminToken, {
            handle: "new",
        });
        expect(resp.statusCode).toEqual(400); // Expect a 400 Bad Request response
    });

    // Test case for updating a job with invalid data
    test("bad request with invalid data", async () => {
        const resp = await patchJob(testJobIds[0], adminToken, {
            salary: "not-a-number", // Invalid salary
        });
        expect(resp.statusCode).toEqual(400); // Expect a 400 Bad Request response
    });
});

/**
 * Test suite for endpoint: DELETE /jobs/:id
 * These tests verify that the deletion of jobs works as expected.
 * Different roles and authorization scenarios are tested, including job deletion by an administrator and the nonexistent job scenario.
 */
describe("DELETE /jobs/:id", function () {
    /**
 * Test case: Admin can delete a job.
 * Asserts that an admin can successfully delete a job.
 */
    test("works for admin", async function () {
        const jobIdToOperateOn = testJobIds[testJobIds.length - 1];
        const resp = await request(app)
            .delete(`/jobs/${jobIdToOperateOn}`)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({ deleted: jobIdToOperateOn });
    });

    /**
 * Test case: Other users cannot delete a job.
 * Checks that non-admin users cannot delete jobs.
 * The endpoint should return '401 Unauthorized' for such case.
 */
    test("unauth for others", async function () {
        const jobIdToOperateOn = testJobIds[testJobIds.length - 1];
        const resp = await request(app)
            .delete(`/jobs/${jobIdToOperateOn}`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    /**
 * Test case: Unauthenticated users cannot delete a job.
 * Asserts that an anonymous request cannot delete a job.
 * The endpoint should return '401 Unauthorized' status code.
 */
    test("unauth for anon", async function () {
        const jobIdToOperateOn = testJobIds[testJobIds.length - 1];
        const resp = await request(app)
            .delete(`/jobs/${jobIdToOperateOn}`)
        expect(resp.statusCode).toEqual(401);
    });

    /**
 * Test case: Error returned when no such job exists.
 * Tests what happens when the job id specified does not exist in the database.
 * The result should be a '404 Not Found' status code.
 */
    test("not found for no such job", async function () {
        const resp = await request(app)
            .delete(`/jobs/0`)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404);
    });
});