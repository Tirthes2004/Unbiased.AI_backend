import crypto from "crypto";
import path from "path";
import multer from "multer";

const uploadsDirectory = path.resolve("uploads");

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "text/csv",
]);

const allowedExtensionsByMimeType = {
  "application/pdf": ".pdf",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "text/csv": ".csv",
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDirectory);
  },
  filename: (_req, file, cb) => {
    const safeExtension =
      allowedExtensionsByMimeType[file.mimetype] ||
      path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${crypto.randomUUID()}${safeExtension}`;

    cb(null, uniqueName);
  },
});

const fileFilter = (_req, file, cb) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    return cb(
      new multer.MulterError(
        "LIMIT_UNEXPECTED_FILE",
        "Only PDF, PNG, JPG, JPEG, and CSV files are allowed"
      )
    );
  }

  cb(null, true);
};

export const uploadSingleFile = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024,
    files: 1,
  },
}).single("file");
