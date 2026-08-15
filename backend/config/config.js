/**
 * Centralized Environment Configuration Module
 * Replaces direct `process.env.*` access scattered across the codebase.
 * Validates all required environment variables at startup.
 */

import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: "./config/config.env" });

const requiredVars = [
  "PORT",
  "MONGO_URI",
  "JWT_SECRET_KEY",
  "JWT_EXPIRE",
  "COOKIE_EXPIRE",
  "FRONTEND_URL",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

// Validate all required env vars are present at startup
for (const varName of requiredVars) {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
}

export const config = {
  PORT: parseInt(process.env.PORT, 10) || 4000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
  JWT_EXPIRE: process.env.JWT_EXPIRE,
  COOKIE_EXPIRE: parseInt(process.env.COOKIE_EXPIRE, 10),
  FRONTEND_URL: process.env.FRONTEND_URL,
  NODE_ENV: process.env.NODE_ENV || "development",
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};

export default config;
