/**
 * findOrFail.js — Reusable Resource-Not-Found Utility
 *
 * Eliminates duplicated findById + 404 ErrorHandler pattern used in 6 places.
 *
 * Before (repeated in jobController and applicationController):
 *   const job = await Job.findById(id);
 *   if (!job) { return next(new ErrorHandler("OOPS! Job not found.", 404)); }
 *
 * After:
 *   const job = await findOrFail(Job, id, next, "Job");
 *   if (!job) return;
 */

import ErrorHandler from "../middlewares/error.js";

/**
 * findOrFail - Finds a Mongoose document by ID or sends a 404 error
 * @param {import("mongoose").Model} Model - Mongoose model to query
 * @param {string} id - Document ID to look up
 * @param {Function} next - Express next() function
 * @param {string} resourceName - Human-readable name used in error message
 * @returns {object|null} The document if found, null if not (and calls next with 404)
 */
export const findOrFail = async (Model, id, next, resourceName = "Resource") => {
  try {
    const doc = await Model.findById(id);
    if (!doc) {
      next(new ErrorHandler(`${resourceName} not found.`, 404));
      return null;
    }
    return doc;
  } catch {
    next(new ErrorHandler(`Invalid ID for ${resourceName}.`, 400));
    return null;
  }
};
