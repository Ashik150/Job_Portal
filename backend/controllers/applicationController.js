import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { Application } from "../models/applicationSchema.js";
import cloudinary from "cloudinary";
import { Job } from "../models/jobSchema.js";
import { roleGuard } from "../utils/roleGuard.js";
import { findOrFail } from "../utils/findOrFail.js";
import logger from "../utils/logger.js";

const ALLOWED_RESUME_FORMATS = ["image/png", "image/jpeg", "image/webp"];

export const postApplication = catchAsyncErrors(async (req, res, next) => {
  if (roleGuard(req, next, "Job Seeker")) return;

  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorHandler("Resume File Required!", 400));
  }

  const { resume } = req.files;
  if (!ALLOWED_RESUME_FORMATS.includes(resume.mimetype)) {
    return next(new ErrorHandler("Invalid file type. Please upload a PNG file.", 400));
  }

  const cloudinaryResponse = await cloudinary.uploader.upload(resume.tempFilePath);
  if (!cloudinaryResponse || cloudinaryResponse.error) {
    logger.error("Cloudinary upload failed", {
      error: cloudinaryResponse?.error || "Unknown Cloudinary error",
    });
    return next(new ErrorHandler("Failed to upload Resume to Cloudinary", 500));
  }

  const { name, email, coverLetter, phone, address, jobId } = req.body;
  if (!jobId) return next(new ErrorHandler("Job not found!", 404));

  const jobDetails = await findOrFail(Job, jobId, next, "Job");
  if (!jobDetails) return;

  if (!name || !email || !coverLetter || !phone || !address || !resume) {
    return next(new ErrorHandler("Please fill all fields.", 400));
  }

  const application = await Application.create({
    name, email, coverLetter, phone, address,
    applicantID: { user: req.user._id, role: "Job Seeker" },
    employerID: { user: jobDetails.postedBy, role: "Employer" },
    resume: {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    },
  });

  jobDetails.total_applicants += 1;
  await jobDetails.save();

  logger.info("Application submitted", {
    applicantId: req.user._id,
    jobId,
    applicationId: application._id,
  });

  res.status(200).json({ success: true, message: "Application Submitted!", application });
});

export const employerGetAllApplications = catchAsyncErrors(async (req, res, next) => {
  if (roleGuard(req, next, "Employer")) return;

  const applications = await Application.find({ "employerID.user": req.user._id });
  res.status(200).json({ success: true, applications });
});

export const jobseekerGetAllApplications = catchAsyncErrors(async (req, res, next) => {
  if (roleGuard(req, next, "Job Seeker")) return;

  const applications = await Application.find({ "applicantID.user": req.user._id });
  res.status(200).json({ success: true, applications });
});

export const jobseekerDeleteApplication = catchAsyncErrors(async (req, res, next) => {
  if (roleGuard(req, next, "Job Seeker")) return;

  const { id } = req.params;
  const application = await findOrFail(Application, id, next, "Application");
  if (!application) return;

  await application.deleteOne();
  logger.info("Application deleted", { applicationId: id, userId: req.user._id });
  res.status(200).json({ success: true, message: "Application Deleted!" });
});
