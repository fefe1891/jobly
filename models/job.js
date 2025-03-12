"use strict";

const db = require("../db");
const { NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");


/** Operations related to jobs. */

class Job {

    /** Create a Job (passed as data), store in the database, and return new job data.
    *
    * data should include { title, salary, equity, company_handle }
    *
    * Returns { id, title, salary, equity, company_handle }
    *
    * */
    static async create(data) {
        // Uses pg library to insert new job into the database.
        const result = await db.query(
            `INSERT INTO jobs (
        title,
        salary,
        equity,
        company_handle)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
            [
                data.title,
                data.salary,
                data.equity,
                data.companyHandle,
            ]);

        let job = result.rows[0];

        return job;
    }

    /** 
    * Find all jobs (with optional filters on the provided searchFilters).
    *
    * searchFilters (all optional):
    * - minSalary
    * - hasEquity (true returns only jobs with equity > 0, other values ignored)
    * - title (will find case-insensitive, partial matches)
    *
    * Returns [{ id, title, salary, equity, companyHandle, companyName }, ...] 
    * 
    * */
    static async findAll({ minSalary, hasEquity, title } = {}) {
        /* Prepare the SQL queries to be used based on the filters passed in */
        let query = `SELECT j.id,
                            j.title,
                            j.salary,
                            j.equity,
                            j.company_handle AS "companyHandle",
                            c.name AS "companyName" FROM jobs j
                            LEFT JOIN companies AS c ON c.handle = j.company_handle`;
        let whereExpressions = [];
        let queryValues = [];

        // For each possible search term, add to whereExpressions and
        // queryValues so we can generate the right SQL

        if (minSalary !== undefined) {
            queryValues.push(minSalary);
            whereExpressions.push(`salary >= $${queryValues.length}`);
        }

        if (hasEquity === true) {
            whereExpressions.push(`equity > 0`);
        }

        if (title !== undefined) {
            queryValues.push(`%${title}%`);
            whereExpressions.push(`title ILIKE $${queryValues.length}`);
        }

        if (whereExpressions.length > 0) {
            query += " WHERE " + whereExpressions.join(" AND ");
        }

        // Finalize query and return results
        query += " ORDER BY title";
        const jobsRes = await db.query(query, queryValues);
        return jobsRes.rows;
    }

    /** 
    * Given a job id, return data about the job.
    *
    * Returns { id, title, salary, equity, companyHandle, company }
    *   where company is { name, description, numEmployees, logo_url }
    *
    * Throws NotFoundError if not found.
    * 
    * */
    static async get(id) {
        /* Check if the provided job id exists in the database */
        const jobRes = await db.query(
            `SELECT id,
            title,
            salary,
            equity,
            company_handle AS "companyHandle"
            FROM jobs WHERE id = $1`, [id]);

        const job = jobRes.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        const companiesRes = await db.query(
            `SELECT handle,
            name,
            description,
            num_employees AS "numEmployees",
            logo_url AS "logoUrl"
            FROM companies
            WHERE handle = $1`, [job.companyHandle]);

        delete job.companyHandle;
        job.company = companiesRes.rows[0];

        return job;
    }

    /** 
    * Update job data with provided `data`.
    *
    * Returns updated job data.
    * Returns { id, title, salary, equity, companyHandle }
    *
    * Throws NotFoundError if not found.
    * 
    * */
    static async update(id, data) {
        /* Update the job with the given id using the data provided */
        const { setCols, values } = sqlForPartialUpdate(data, {});
        const idVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE jobs
                            SET ${setCols}
                            WHERE id = ${idVarIdx}
                            RETURNING id,
                            title,
                            salary,
                            equity,
                            company_handle AS "companyHandle"`;

        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        return job;
    }

    /** 
    * Delete given job from database; returns undefined.
    *
    * Throws NotFoundError if not found.
    * 
    * */
    static async remove(id) {
        console.log(`Deleting job with ID: ${id}`);
        /* Remove the job with the provided id */
        const result = await db.query(
            `DELETE FROM jobs WHERE id = $1 RETURNING id`, [id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);
    }
}

module.exports = Job;