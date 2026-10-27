# ContactX - Full-Stack Contact Manager & CRM

ContactX is a modern CRM and contact management web application featuring a React frontend, Node.js + Express backend, and atomic JSON file database.

---

## 👥 Team & Branches

- **Shivansh Chandel** (`shivanshchandel-012`): Landing Page & Base Registration (`main`)
- **Samarth Sharma** (`samarthsharma1411`): Login UI & Form Validation (`feature/login-u1`)
- **Sambhav Sehgal** (`sambhav.sehgal.007`): JSON-Backed CRM Dashboard (`Dashboard-Integration`)
- **Siddhant** (Current Branch: `feature/auth-backend`):
  - Merged all team branches (`main`, `feature/login-u1`, `Dashboard-Integration`)
  - Node.js + Express backend with JSON file storage database
  - Complete Login / Signup backend API with validation & JWT authentication
  - Frontend integration for Register, Login, and Dashboard session management

---

## 🚀 Getting Started

### 1. Install Dependencies

Install root (frontend) and server dependencies:

```bash
# Frontend dependencies
npm install

# Backend dependencies
cd server
npm install
cd ..
```

### 2. Run the Application

You can run both frontend and backend concurrently with a single command:

```bash
npm run dev:all
```

Or run them individually in separate terminals:

```bash
# Terminal 1 - Frontend (http://localhost:5173)
npm run dev

# Terminal 2 - Backend (http://localhost:5000)
npm run server:dev
```

---

## 🔐 Default Demo Account

A seeded demo account is pre-configured in `server/src/db/data/users.json`:

- **Email**: `alex@contactx.com`
- **Password**: `Password123!`

You can also create a new account directly from `/register` and log in immediately.

---

## 📡 Backend API Endpoints

Base URL: `http://localhost:5000/api` (or `/api` via Vite proxy on port 5173)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/health` | Health check & database status | No |
| `POST` | `/auth/register` | Register new user with hashed password & JWT | No |
| `POST` | `/auth/login` | Verify credentials & issue JWT | No |
| `GET` | `/auth/me` | Fetch authenticated user profile | Yes (Bearer Token) |

---

## 🗄️ JSON Database

- Data directory: `server/src/db/data/`
- User records: `server/src/db/data/users.json`
- Includes atomic write protection (`.tmp` write + rename) to guarantee file integrity.
