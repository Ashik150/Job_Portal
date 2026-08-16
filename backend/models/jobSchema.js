import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please provide a title."],
    minLength: [3, "Title must contain at least 3 Characters!"],
    maxLength: [30, "Title cannot exceed 30 Characters!"],
  },
  description: {
    type: String,
    required: [true, "Please provide decription."],
    minLength: [30, "Description must contain at least 30 Characters!"],
    maxLength: [500, "Description cannot exceed 500 Characters!"],
  },
  category: {
    type: String,
    required: [true, "Please provide a category."],
  },
  country: {
    type: String,
    required: [true, "Please provide a country name."],
  },
  city: {
    type: String,
    required: [true, "Please provide a city name."],
  },
  location: {
    type: String,
    required: [true, "Please provide location."],
    minLength: [20, "Location must contian at least 20 characters!"],
  },
  fixedSalary: {
    type: Number,
    minLength: [4, "Salary must contain at least 4 digits"],
    maxLength: [9, "Salary cannot exceed 9 digits"],
  },
  salaryFrom: {
    type: Number,
    minLength: [4, "Salary must contain at least 4 digits"],
    maxLength: [9, "Salary cannot exceed 9 digits"],
  },
  salaryTo: {
    type: Number,
    minLength: [4, "Salary must contain at least 4 digits"],
    maxLength: [9, "Salary cannot exceed 9 digits"],
  },
  expired: {
    type: Boolean,
    default: false,
  },
  jobPostedOn: {
    type: Date,
    default: Date.now,
  },
  postedBy: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  cname: {
    type: String,
  },
  total_applicants:{
    type: Number,
    required: true,
    default: 0,
  }
});

export const Job = mongoose.model("Job", jobSchema);

// ─── Performance Indexes ───────────────────────────────────────────────────────
// BEFORE: getAllJobs does a full-collection scan (COLLSCAN) — O(n) for every request
// AFTER:  compound index makes MongoDB use IXSCAN — O(log n), orders of magnitude faster

// Index 1: getAllJobs — filters by expired=false (most frequent query)
Job.collection.createIndex({ expired: 1, jobPostedOn: -1 }).catch(() => {});

// Index 2: getMyJobs — filters by postedBy (employer dashboard)
Job.collection.createIndex({ postedBy: 1, expired: 1 }).catch(() => {});

// Index 3: category filter — used by job search
Job.collection.createIndex({ category: 1, expired: 1 }).catch(() => {});
