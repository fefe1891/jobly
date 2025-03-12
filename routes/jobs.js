"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");

const express = require("express");
const { BadRequestError } = require("../expressError");
const { ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");
const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobSearchSchema = require("../schemas/jobSearch.json");

const router = express.Router({ mergeParams: true });

router.post("/", ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const job = await Job.create(req.body);
        return res.status(201).json({ job });
    } catch (err) {
        return next(err);
    }
});

router.get("/", async function (req, res, next) {
    const q = req.query;
    // arrive as strings from querystring, but we want as int/bool
    if (q.minSalary !== undefined) q.minSalary = +q.minSalary;
    q.hasEquity = q.hasEquity === "true";

    try {
        const validator = jsonschema.validate(q, jobSearchSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const jobs = await Job.findAll(q);
        return res.json({ jobs });
    } catch (err) {
        return next(err);
    }
});

router.get("/:id", async function (req, res, next) {
    try {
        const job = await Job.get(req.params.id);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

router.patch("/:id", ensureAdmin, async function (req, res, next) {
    try {
        // Validate the request body against the job update schema
        const { body } = req;
        const validator = jsonschema.validate(body, jobUpdateSchema);

        if (!validator.valid) {
            const errors = validator.errors.map(e => e.stack);
            throw new BadRequestError(errors);
        }

        // Update the job using the job ID from the request parameters
        const jobId = req.params.id;
        const updatedJob = await Job.update(jobId, body);

        return res.json({ job: updatedJob });
    } catch (err) {
        return next(err);
    }
});

router.delete("/:id", ensureAdmin, async function (req, res, next) {
    try {
        console.log(`DELETE Request for Job with ID: ${req.params.id}`);
        await Job.remove(req.params.id);
        return res.json({ deleted: +req.params.id });
    } catch (err) {
        console.log('Server Error:', err);
        return next(err);
    }
});

module.exports = router;