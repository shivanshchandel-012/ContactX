import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Get current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Server configuration
const PORT = 5000;
const JWT_SECRET = "contactx_simple_secret_key_2026";
const DATA_DIR = path.join(__dirname, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

// Helper: Ensure the data directory and users.json file exist
function ensureDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(USERS_FILE)) {
    // Seed default admin account: alex@contactx.com / Password123!
    const defaultUsers = [
      {
        id: "1",
        name: "Alex Morgan",
        email: "alex@contactx.com",
        password: bcrypt.hashSync("Password123!", 10),
        createdAt: new Date().toISOString(),
      },
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2), "utf-8");
  }
}

// Helper: Read users from JSON file
function readUsers() {
  ensureDatabase();
  try {
    const data = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(data || "[]");
  } catch (error) {
    console.error("Error reading users.json:", error);
    return [];
  }
}

// Helper: Save users to JSON file
function saveUsers(users) {
  ensureDatabase();
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error writing users.json:", error);
    return false;
  }
}

// Helper: Send JSON response with CORS headers
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(JSON.stringify(data));
}

// Helper: Read and parse JSON request body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
    req.on("error", (err) => reject(err));
  });
}

// Create pure Node.js HTTP server (without Express)
const server = http.createServer(async (req, res) => {
  // 1. Handle browser preflight CORS requests
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    res.end();
    return;
  }

  // Parse requested URL pathname
  const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = parsedUrl.pathname;

  // 2. Health check route
  if (req.method === "GET" && pathname === "/api/health") {
    sendJSON(res, 200, {
      status: "ok",
      message: "Node.js Server running without Express!",
      database: "JSON File Database (users.json)",
    });
    return;
  }

  // 3. Register route: POST /api/auth/register
  if (req.method === "POST" && pathname === "/api/auth/register") {
    try {
      const body = await parseBody(req);
      const { name, email, password } = body;

      if (!name || !email || !password) {
        sendJSON(res, 400, {
          success: false,
          message: "Please provide your name, email, and password.",
        });
        return;
      }

      if (name.trim().length < 2) {
        sendJSON(res, 400, {
          success: false,
          message: "Name must be at least 2 characters long.",
        });
        return;
      }

      if (password.length < 8) {
        sendJSON(res, 400, {
          success: false,
          message: "Password must be at least 8 characters long.",
        });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const users = readUsers();

      // Check if email already registered
      const emailExists = users.some((u) => u.email.toLowerCase() === normalizedEmail);
      if (emailExists) {
        sendJSON(res, 409, {
          success: false,
          message: "An account with this email address already exists.",
        });
        return;
      }

      // Hash password using bcrypt
      const hashedPassword = bcrypt.hashSync(password, 10);

      const newUser = {
        id: Date.now().toString(),
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      saveUsers(users);

      const safeUser = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      };

      const token = jwt.sign(safeUser, JWT_SECRET, { expiresIn: "7d" });

      sendJSON(res, 201, {
        success: true,
        message: "Account created successfully!",
        token,
        user: safeUser,
      });
      return;
    } catch (err) {
      console.error("Register error:", err);
      sendJSON(res, 500, {
        success: false,
        message: "Server error during registration.",
      });
      return;
    }
  }

  // 4. Login route: POST /api/auth/login
  if (req.method === "POST" && pathname === "/api/auth/login") {
    try {
      const body = await parseBody(req);
      const { email, password } = body;

      if (!email || !password) {
        sendJSON(res, 400, {
          success: false,
          message: "Please enter both email and password.",
        });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const users = readUsers();

      // Find user by email
      const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);
      if (!user) {
        sendJSON(res, 401, {
          success: false,
          message: "Invalid email or password.",
        });
        return;
      }

      // Verify password with bcrypt
      const isPasswordCorrect = bcrypt.compareSync(password, user.password);
      if (!isPasswordCorrect) {
        sendJSON(res, 401, {
          success: false,
          message: "Invalid email or password.",
        });
        return;
      }

      const safeUser = {
        id: user.id,
        name: user.name,
        email: user.email,
      };

      const token = jwt.sign(safeUser, JWT_SECRET, { expiresIn: "7d" });

      sendJSON(res, 200, {
        success: true,
        message: "Logged in successfully!",
        token,
        user: safeUser,
      });
      return;
    } catch (err) {
      console.error("Login error:", err);
      sendJSON(res, 500, {
        success: false,
        message: "Server error during login.",
      });
      return;
    }
  }

  // 5. Get current user profile: GET /api/auth/me
  if (req.method === "GET" && pathname === "/api/auth/me") {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      sendJSON(res, 401, {
        success: false,
        message: "Please log in first.",
      });
      return;
    }

    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const users = readUsers();
      const user = users.find((u) => u.id === decoded.id);

      if (!user) {
        sendJSON(res, 401, {
          success: false,
          message: "User not found.",
        });
        return;
      }

      sendJSON(res, 200, {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
      return;
    } catch {
      sendJSON(res, 401, {
        success: false,
        message: "Session expired. Please log in again.",
      });
      return;
    }
  }

  // 6. Fallback for unhandled routes (404)
  sendJSON(res, 404, {
    success: false,
    message: `Route not found: ${req.method} ${pathname}`,
  });
});

// Start the server
ensureDatabase();
server.listen(PORT, () => {
  console.log(`Node.js HTTP Server running on http://localhost:${PORT}`);
  console.log(`JSON Database active at ${USERS_FILE}`);
});
