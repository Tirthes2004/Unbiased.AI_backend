import multer from "multer";
import { env } from "../config/env.js";
import { deleteFileIfExists } from "../utils/fileCleanup.js";

const getMulterMessage = (error) => {
  if (error.code === "LIMIT_FILE_SIZE") {
    return "File is too large. Maximum allowed size is 10MB.";
  }

  if (error.code === "LIMIT_UNEXPECTED_FILE") {
    return error.field || "Only PDF, PNG, JPG, JPEG, and CSV files are allowed.";
  }

  return "File upload failed.";
};

export const errorHandler = async (error, req, res, _next) => {
  if (req.file?.path) {
    await deleteFileIfExists(req.file.path);
  }

  const statusCode = error.statusCode || (error instanceof multer.MulterError ? 400 : 500);
  const message =
    error instanceof multer.MulterError
      ? getMulterMessage(error)
      : error.message || "Something went wrong";

  if (!env.isProduction) {
    console.error(error);
  }

  if (res.headersSent) {
    return;
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};
