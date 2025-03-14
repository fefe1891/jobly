"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");


/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      res.locals.user = jwt.verify(token, SECRET_KEY);
    }
    return next();
  } catch (err) {
    return next();
  }
}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
  try {
    if (!res.locals.user) throw new UnauthorizedError();
    return next();
  } catch (err) {
    return next(err);
  }
}

/**
 * Middleware to check if user is admin.
 * If not an admin, raises Unauthorized.
 */
function ensureAdmin(req, res, next) {
  try {
    const user = res.locals.user;
    if (user && user.isAdmin) {
      return next();
    }
    throw new UnauthorizedError();
  } catch (err) {
    return next(err);
  }
}

/**
 * Middleware to ensure user is either an admin or the same user allowed to access the route.
 * If not the same user or an admin, raises Unauthorized.
 */
function ensureCorrectUserOrAdmin(req, res, next) {
  try {
    const user = res.locals.user;
    if (user && (user.isAdmin || user.username === req.params.username)) {
      return next();
    }
    throw new UnauthorizedError();
  } catch (err) {
    return next(err);
  }
}


module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
  ensureCorrectUserOrAdmin,
};
