// Simple Node.js backend without Express, using built-in http and fs modules
const http = require('http');
const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, 'data', 'users.json');

// Helper to read users from JSON file
function readUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

// Helper to write users array back to file
function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

// Utility to parse JSON body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(e);
      }
    });
  });
}

// Simple token generation (not secure, for demo only)
function generateToken() {
  return Math.random().toString(36).substr(2);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/api/auth/register' && req.method === 'POST') {
    try {
      const { name, email, password } = await parseJsonBody(req);
      const users = readUsers();
      if (users.find(u => u.email === email)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ message: 'User already exists' }));
      }
      const newUser = { id: Date.now(), name, email, password };
      users.push(newUser);
      writeUsers(users);
      const token = generateToken();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ token, user: { id: newUser.id, name, email } }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Invalid request body' }));
    }
    return;
  }

  if (url.pathname === '/api/auth/login' && req.method === 'POST') {
    try {
      const { email, password } = await parseJsonBody(req);
      const users = readUsers();
      const user = users.find(u => u.email === email && u.password === password);
      if (!user) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ message: 'Invalid credentials' }));
      }
      const token = generateToken();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ token, user: { id: user.id, name: user.name, email: user.email } }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Invalid request body' }));
    }
    return;
  }

  if (url.pathname === '/api/auth/me' && req.method === 'GET') {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ message: 'Missing token' }));
    }
    // In this simple demo we do not validate token content, just echo back first user
    const users = readUsers();
    if (users.length === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ message: 'No user found' }));
    }
    const user = users[0];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ user: { id: user.id, name: user.name, email: user.email } }));
    return;
  }

  // Fallback for unknown routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Not found' }));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Backend server listening on http://localhost:${PORT}`);
});
