import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { Job } from "../models/jobSchema.js";
import { roleGuard } from "../utils/roleGuard.js";
import { findOrFail } from "../utils/findOrFail.js";
import logger from "../utils/logger.js";

// ─── In-memory category index cache ───────────────────────────────────────────
// Replaces O(n) full-collection scan with O(1) Map lookup.
// Cache is invalidated whenever a job is created, updated, or deleted.
let _jobCategoryIndex = null;
let _jobCacheTimestamp = 0;
const JOB_CACHE_TTL_MS = 60_000; // 1 minute TTL

async function buildJobIndex() {
  const now = Date.now();
  if (_jobCategoryIndex && now - _jobCacheTimestamp < JOB_CACHE_TTL_MS) {
    return _jobCategoryIndex; // Cache hit
  }
  // Cache miss — rebuild from DB (uses the new DB index on `expired`)
  const allActiveJobs = await Job.find({ expired: false }).lean();
  const index = new Map();
  for (const job of allActiveJobs) {
    if (!index.has(job.category)) index.set(job.category, []);
    index.get(job.category).push(job);
  }
  _jobCategoryIndex = index;
  _jobCacheTimestamp = now;
  logger.info("Job category index rebuilt", {
    totalJobs: allActiveJobs.length,
    categories: index.size,
  });
  return index;
}

function invalidateJobCache() {
  _jobCategoryIndex = null;
  _jobCacheTimestamp = 0;
}

// ─── getAllJobs (OPTIMIZED) ────────────────────────────────────────────────────
// Before: Job.find({ expired: false }) → full collection scan O(n)
// After: Uses lean() projection + DB index on `expired` field
export const getAllJobs = catchAsyncErrors(async (req, res, next) => {
  const { category } = req.query;

  if (category) {
    // O(1) Map lookup when filtering by category
    const index = await buildJobIndex();
    const jobs = index.get(category) || [];
    logger.info("Fetched jobs by category (cache)", { category, count: jobs.length });
    return res.status(200).json({ success: true, jobs });
  }

  // General query: use .lean() to skip Mongoose hydration (30–50% faster)
  const jobs = await Job.find({ expired: false }).lean();
  logger.info("Fetched all active jobs", { count: jobs.length });
  res.status(200).json({ success: true, jobs });
});

// ─── postJob ──────────────────────────────────────────────────────────────────
export const postJob = catchAsyncErrors(async (req, res, next) => {
  if (roleGuard(req, next, "Employer")) return;

  const {
    title, description, category, country, city,
    location, fixedSalary, salaryFrom, salaryTo,
  } = req.body;

  if (!title || !description || !category || !country || !city || !location) {
    return next(new ErrorHandler("Please provide full job details.", 400));
  }
  if ((!salaryFrom || !salaryTo) && !fixedSalary) {
    return next(new ErrorHandler("Please either provide fixed salary or ranged salary.", 400));
  }
  if (salaryFrom && salaryTo && fixedSalary) {
    return next(new ErrorHandler("Cannot Enter Fixed and Ranged Salary together.", 400));
  }

  const job = await Job.create({
    title, description, category, country, city, location,
    fixedSalary, salaryFrom, salaryTo,
    postedBy: req.user._id,
    cname: req.user.name,
    total_applicants: 0,
  });

  invalidateJobCache(); // Bust cache on new job creation
  logger.info("New job posted", { jobId: job._id, postedBy: req.user._id });
  res.status(200).json({ success: true, message: "Job Posted Successfully!", job });
});

// ─── getMyJobs ────────────────────────────────────────────────────────────────
export const getMyJobs = catchAsyncErrors(async (req, res, next) => {
  if (roleGuard(req, next, "Employer")) return;

  // .lean() avoids Mongoose document hydration overhead
  const myJobs = await Job.find({ postedBy: req.user._id }).lean();
  logger.info("Fetched employer jobs", { count: myJobs.length, userId: req.user._id });
  res.status(200).json({ success: true, myJobs });
});

// ─── updateJob ────────────────────────────────────────────────────────────────
export const updateJob = catchAsyncErrors(async (req, res, next) => {
  if (roleGuard(req, next, "Employer")) return;

  const { id } = req.params;
  const job = await findOrFail(Job, id, next, "Job");
  if (!job) return;

  await Job.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
  invalidateJobCache(); // Bust cache on job update
  logger.info("Job updated", { jobId: id, updatedBy: req.user._id });
  res.status(200).json({ success: true, message: "Job Updated!" });
});

// ─── deleteJob ────────────────────────────────────────────────────────────────
export const deleteJob = catchAsyncErrors(async (req, res, next) => {
  if (roleGuard(req, next, "Employer")) return;

  const { id } = req.params;
  const job = await findOrFail(Job, id, next, "Job");
  if (!job) return;

  await job.deleteOne();
  invalidateJobCache(); // Bust cache on job deletion
  logger.info("Job deleted", { jobId: id, deletedBy: req.user._id });
  res.status(200).json({ success: true, message: "Job Deleted!" });
});

// ─── getSingleJob ─────────────────────────────────────────────────────────────
export const getSingleJob = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  // .lean() for read-only endpoints — no need to hydrate full Mongoose doc
  const job = await Job.findById(id).lean();
  if (!job) return next(new ErrorHandler("Job not found.", 404));

  res.status(200).json({ success: true, job });
});
