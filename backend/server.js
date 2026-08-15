import app from "./app.js";
import cloudinary from "cloudinary";
import logger from "./utils/logger.js";
import config from "./config/config.js";

// Cloudinary configuration via centralized config module
cloudinary.v2.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
});

app.listen(config.PORT, () => {
  logger.info(`Server running at port ${config.PORT}`, {
    port: config.PORT,
    environment: config.NODE_ENV,
  });
});
