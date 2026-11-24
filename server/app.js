import express from "express";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import contactRoutes from "./routes/contacts.js";
import cors from "cors";
import multer from "multer";
import csvRoutes from "./routes/csv.js";
import photoRoutes from "./routes/photos.js";

export const app = express();

app.disable("x-powered-by");
// CLIENT_URL can hold several origins separated by commas.
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = (process.env.CLIENT_URL || "")
        .split(",")
        .map((url) => url.trim().replace(/\/$/, ""))
        .filter(Boolean);
      callback(null, !origin || allowed.includes(origin));
    },
    exposedHeaders: ["Content-Disposition"],
  }),
);

app.use(express.json({ limit: "20kb" }));

app.use((req, res, next) => {
  const origin = req.get("origin");
  const configuredOrigins = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const allowedOrigins = new Set([
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "https://shivanshchandel-012.github.io",
    ...configuredOrigins,
  ]);

  if (!origin || allowedOrigins.has(origin)) {
    if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(origin && !allowedOrigins.has(origin) ? 403 : 204);
  }
  return next();
});

app.get("/api/health", (_req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: connected ? "ok" : "unavailable",
    database: connected ? "connected" : "disconnected",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/contacts", csvRoutes);
app.use("/api/contacts", photoRoutes);
app.use("/api/contacts", contactRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

app.use((error, _req, res, next) => {
  if (res.headersSent) return next(error);

  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, message: "Request body must be valid JSON." });
  }

  if (error.type === "entity.too.large") {
    return res.status(413).json({ success: false, message: "Request body is too large." });
  }

  if (error instanceof multer.MulterError) {
    const tooLarge = error.code === "LIMIT_FILE_SIZE";
    return res.status(tooLarge ? 413 : 400).json({
      success: false,
      message: tooLarge
        ? "The uploaded file is too large."
        : error.code === "LIMIT_UNEXPECTED_FILE"
          ? `Unexpected file field "${error.field}".`
          : "The file upload is invalid.",
    });
  }

  if (/^Multipart:|Unexpected end of form/.test(error.message || "")) {
    return res.status(400).json({ success: false, message: "The file upload is invalid." });
  }

  if (error.code === 11000) {
    const message = error.keyPattern?.owner
      ? "An active contact with this email already exists."
      : "An account with this email already exists.";
    return res.status(409).json({ success: false, message });
  }

  if (error.name === "ValidationError") {
    const firstError = Object.values(error.errors)[0];
    return res.status(400).json({
      success: false,
      message: firstError?.message || "The submitted data is invalid.",
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({ success: false, message: "A request value is invalid." });
  }

  const status = Number.isInteger(error.status) ? error.status : 500;
  if (status >= 500) console.error("API error:", error);
  return res.status(status).json({
    success: false,
    message: status >= 500 ? "An unexpected server error occurred." : error.message,
  });
});
