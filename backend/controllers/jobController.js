import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { Job } from "../models/jobSchema.js";
import { roleGuard } from "../utils/roleGuard.js";
import { findOrFail } from "../utils/findOrFail.js";
import logger from "../utils/logger.js";

export const getAllJobs = catchAsyncErrors(async (req, res, next) => {
  const jobs = await Job.find({ expired: false });
  logger.info("Fetched all active jobs", { count: jobs.length });
  res.status(200).json({ success: true, jobs });
});

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

  logger.info("New job posted", { jobId: job._id, postedBy: req.user._id });
  res.status(200).json({ success: true, message: "Job Posted Successfully!", job });
});

export const getMyJobs = catchAsyncErrors(async (req, res, next) => {
  if (roleGuard(req, next, "Employer")) return;

  const myJobs = await Job.find({ postedBy: req.user._id });
  logger.info("Fetched employer jobs", { count: myJobs.length, userId: req.user._id });
  res.status(200).json({ success: true, myJobs });
});

export const updateJob = catchAsyncErrors(async (req, res, next) => {
  if (roleGuard(req, next, "Employer")) return;

  const { id } = req.params;
  const job = await findOrFail(Job, id, next, "Job");
  if (!job) return;

  await Job.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
  logger.info("Job updated", { jobId: id, updatedBy: req.user._id });
  res.status(200).json({ success: true, message: "Job Updated!" });
});

export const deleteJob = catchAsyncErrors(async (req, res, next) => {
  if (roleGuard(req, next, "Employer")) return;

  const { id } = req.params;
  const job = await findOrFail(Job, id, next, "Job");
  if (!job) return;

  await job.deleteOne();
  logger.info("Job deleted", { jobId: id, deletedBy: req.user._id });
  res.status(200).json({ success: true, message: "Job Deleted!" });
});

export const getSingleJob = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const job = await findOrFail(Job, id, next, "Job");
  if (!job) return;

  res.status(200).json({ success: true, job });
});
