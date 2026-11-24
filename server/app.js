import express from "express";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import contactRoutes from "./routes/contacts.js";

export const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "20kb" }));

app.get("/api/health", (_req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: connected ? "ok" : "unavailable",
    database: connected ? "connected" : "disconnected",
  });
});

app.use("/api/auth", authRoutes);
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
