import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { app } from "./app.js";
import { connectDatabase } from "./config/database.js";

dotenv.config({ path: fileURLToPath(new URL("./.env", import.meta.url)) });

const port = Number(process.env.PORT) || 5001;
const jwtSecret = process.env.JWT_SECRET;
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("MONGODB_URI is required. Configure it in server/.env.");
}

if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must contain at least 32 characters.");
}

try {
  await connectDatabase(mongoUri);
  app.listen(port, () => {
    console.log(`ContactX API listening on http://localhost:${port}`);
  });
} catch (error) {
  console.error("Backend startup failed:", error.message);
  process.exitCode = 1;
}
