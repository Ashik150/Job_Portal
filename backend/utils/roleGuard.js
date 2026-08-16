/**
 * roleGuard.js — Reusable Role Authorization Utility
 * 
 * Eliminates duplicated role-check blocks across all controllers.
 * Replaces 8 identical if(role === "X") { return next(new ErrorHandler(...)) } blocks.
 * 
 * Before (duplicated in every controller function):
 *   if (role === "Job Seeker") {
 *     return next(new ErrorHandler("Job Seeker not allowed to access this resource.", 400));
 *   }
 * 
 * After (single reusable call):
 *   roleGuard(req, next, "Employer");  // only Employers allowed
 */

import ErrorHandler from "../middlewares/error.js";

/**
 * roleGuard - Blocks access if user does not have the required role
 * @param {object} req - Express request object (must have req.user.role)
 * @param {Function} next - Express next() function
 * @param {"Employer"|"Job Seeker"} allowedRole - The role that IS allowed to proceed
 * @returns {boolean} true if access is blocked (caller should return), false if OK
 */
export const roleGuard = (req, next, allowedRole) => {
  const { role } = req.user;
  if (role !== allowedRole) {
    next(
      new ErrorHandler(
        `${role} not allowed to access this resource.`,
        400
      )
    );
    return true; // blocked
  }
  return false; // allowed
};
