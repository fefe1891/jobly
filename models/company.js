"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
      `SELECT handle
           FROM companies
           WHERE handle = $1`,
      [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
      [
        handle,
        name,
        description,
        numEmployees,
        logoUrl,
      ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  /**
 * Finds all companies that fit the provided filters.
 * @param {object} [filters={}] - Optional filters for the search. The object can have 'name', 'minEmployees' and 'maxEmployees' attributes.
 * @returns {Promise<Array>} - Returns a Promise that resolves to an array of company objects.
 * @throws {BadRequestError} - Thrown when minEmployees is greater than maxEmployees.
 * @async
 */
  static async findAll(filters = {}) {
    /**
    * Preparing base SQL query string to fetch companies. 
    * Aliasing num_employees and logo_url to camel case.
    */
    let baseQuery = `SELECT handle,
                    name,
                    description,
                    num_employees AS "numEmployees",
                    logo_url AS "logoUrl"
                    FROM companies`;

    // Initializing parameters and filtering conditions.
    let params = [];
    let filterConditions = [];

    // Destructure filters object to get individual filter parameters.
    const { name, minEmployees, maxEmployees } = filters;

    // Filter by minimum number of employees.
    if (minEmployees !== undefined) {
      if (maxEmployees !== undefined && minEmployees > maxEmployees) {
        throw new BadRequestError("minEmployees cannot be greater than maxEmployees");
      }
      params.push(minEmployees);
      filterConditions.push(`num_employees >= $${params.length}`);
    }

    // Filter by maximum number of employees.
    if (maxEmployees !== undefined) {
      params.push(maxEmployees);
      filterConditions.push(`num_employees <= $${params.length}`);
    }

    // Filter by name.
    if (name) {
      params.push(`%${name}%`);
      filterConditions.push(`name ILIKE $${params.length}`);
    }

    let finalQuery = baseQuery;

    if (filterConditions.length > 0) {
      // Concatenate all filter conditions to the final SQL query string.
      finalQuery += " WHERE " + filterConditions.join(" AND ");
    }

    // Sort results by company name.
    finalQuery += " ORDER BY name";

    // Execute the final query and return the results.
    const results = await db.query(finalQuery, params);
    return results.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
      [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
      `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
      [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
