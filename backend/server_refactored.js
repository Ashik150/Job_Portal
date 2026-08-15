import app from "./app.js";
import cloudinary from "cloudinary";
import logger from "./utils/logger.js";
import { config as loadEnv } from "./config/config.js";

// Cloudinary configuration (uses centralized config module)
cloudinary.v2.config({
  cloud_name: loadEnv.CLOUDINARY_CLOUD_NAME,
  api_key: loadEnv.CLOUDINARY_API_KEY,
  api_secret: loadEnv.CLOUDINARY_API_SECRET,
});

app.listen(loadEnv.PORT, () => {
  logger.info(`Server running at port ${loadEnv.PORT}`, {
    port: loadEnv.PORT,
    environment: loadEnv.NODE_ENV,
  });
});
