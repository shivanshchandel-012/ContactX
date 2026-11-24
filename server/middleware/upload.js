import multer from "multer";
import { httpError } from "./asyncHandler.js";

// Files are kept in memory only. Nothing is written to the server's disk,
// which matters on Render because its disk is wiped on every redeploy.
const storage = multer.memoryStorage();

const CSV_MIME_TYPES = new Set([
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel", // what Windows browsers often send for .csv
  "text/plain",
  "application/octet-stream",
]);
const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export const csvUpload = multer({
  storage,
  limits: { fileSize: 1024 * 1024, files: 1 }, // 1 MB
  fileFilter: (_req, file, callback) => {
    const isCsv = /\.csv$/i.test(file.originalname) && CSV_MIME_TYPES.has(file.mimetype);
    if (isCsv) return callback(null, true);
    return callback(httpError(400, "Only .csv files are allowed."));
  },
}).single("file");

export const photoUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 }, // 2 MB
  fileFilter: (_req, file, callback) => {
    if (IMAGE_MIME_TYPES.has(file.mimetype)) return callback(null, true);
    return callback(httpError(400, "Only JPG, PNG or WebP images are allowed."));
  },
}).single("photo");