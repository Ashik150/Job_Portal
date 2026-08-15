import mongoose from "mongoose";
import logger from "../utils/logger.js";
import config from "../config/config.js";

const connectDatabase = async () => {
  try {
    const con = await mongoose.connect(config.MONGO_URI);
    logger.info(`MongoDB connected`, {
      host: con.connection.host,
      database: con.connection.name,
    });
  } catch (err) {
    logger.error("MongoDB connection failed", {
      error: err.message,
      stack: err.stack,
    });
    process.exit(1);
  }
};

export default connectDatabase;