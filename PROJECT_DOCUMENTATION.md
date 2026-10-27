# ContactX — Complete Beginner-Friendly Project Documentation

> **A Simple, Easy-to-Understand Guide to the ContactX Project**  
> *Written for beginner developers, college presentations, viva examinations, and code reviews.*

---

## 1. Project Overview & Tech Stack

ContactX is a full-stack contact manager and mini CRM web application built using basic, standard web technologies without heavy frameworks on the backend:

```
[ Frontend: React.js ] ─── HTTP Requests ───> [ Backend: Node.js (http module) ] ─── File I/O ───> [ Database: users.json ]
```

### Technologies Used

| Technology | Role | Why it is used |
|---|---|---|
| **React.js** | Frontend | Builds interactive, reusable user interface components (pages for landing, login, register, and dashboard). |
| **Vite** | Frontend Tool | Runs the local frontend development server and bundles the React code. |
| **Tailwind CSS** | Styling | Quick and clean utility classes for styling buttons, inputs, layouts, and cards. |
| **React Router** | Navigation | Allows switching between pages (`/`, `/login`, `/register`, `/dashboard`) without reloading the browser. |
| **Node.js (`http` module)** | Backend | Pure Node.js server using the built-in `http` module (**No Express**). Handles incoming requests and sends JSON responses. |
| **JSON Database (`users.json`)** | Database | Simple, file-based JSON storage to save and read user records without needing MongoDB or SQL setup. |
| **bcryptjs** | Security | Hashes user passwords so they are stored securely instead of plain text. |
| **jsonwebtoken (JWT)** | Authentication | Creates and verifies login session tokens for secure user identification. |

---

## 2. Project File Structure

```
ContactManager/
│
├── server/                          # Backend Node.js Server (Pure Node.js, No Express)
│   ├── data/
│   │   └── users.json               # JSON database file storing registered user accounts
│   ├── package.json                 # Backend dependencies (bcryptjs, jsonwebtoken)
│   └── server.js                    # Pure Node.js HTTP server handling login & registration
│
├── src/                             # Frontend React Application
│   ├── data/
│   │   └── demo-contacts.json       # Realistic starter contacts list
│   ├── pages/
│   │   ├── LandingPage.jsx          # Home page explaining ContactX features
│   │   ├── Login.jsx                # Login form with email/password authentication
│   │   ├── Register.jsx             # New account creation form with validation
│   │   └── Dashboard.jsx            # Main CRM dashboard with personalized greeting & contacts
│   ├── services/
│   │   └── authService.js           # Helper functions to talk to backend & manage localStorage
│   ├── App.jsx                      # App root defining routes
│   ├── index.css                    # Global Tailwind styling
│   └── main.jsx                     # Entry point for React
│
├── package.json                     # Root project configuration and run scripts
├── vite.config.js                   # Vite dev server configuration with proxy to port 5000
└── PROJECT_DOCUMENTATION.md         # This documentation file
```

---

## 3. Backend Code Explained (`server/server.js`)

The backend is built in [server/server.js](file:///c:/Users/Siddhant/Desktop/ContactManager/server/server.js) using pure Node.js without any web framework.

### Helper Functions

#### 1. `ensureDatabase()`
- **What it does**: Checks if `server/data/users.json` exists. If not, it creates the folder and seeds a default demo account:
  - **Email**: `alex@contactx.com`
  - **Password**: `Password123!`
- **Why it is used**: Prevents errors if the JSON file has not been created yet.

#### 2. `readUsers()`
- **What it does**: Reads the `users.json` file using `fs.readFileSync()` and converts the JSON text into a JavaScript array using `JSON.parse()`.
- **Returns**: Array of user objects.

#### 3. `saveUsers(users)`
- **What it does**: Takes the updated list of users, converts it to formatted JSON text using `JSON.stringify(users, null, 2)`, and writes it to disk with `fs.writeFileSync()`.

#### 4. `sendJSON(res, statusCode, data)`
- **What it does**: Sends a JSON response back to the browser with standard CORS headers (`Access-Control-Allow-Origin: *`) so the React app can talk to the backend.

#### 5. `parseBody(req)`
- **What it does**: Reads the incoming HTTP request stream in chunks (`req.on('data')`) and parses the complete body text as JSON when finished (`req.on('end')`).

---

### Backend API Endpoints

#### `GET /api/health`
- **Purpose**: Quick check to verify that the Node.js server is online.
- **Response**: `{ status: "ok", message: "Node.js Server running without Express!" }`.

#### `POST /api/auth/register`
- **Purpose**: Registers a new user.
- **Input**: `{ name, email, password }`.
- **How it works**:
  1. Checks that name, email, and password are provided and password is at least 8 characters.
  2. Reads `users.json` to make sure the email does not already exist.
  3. Hashes the password using `bcrypt.hashSync(password, 10)`.
  4. Saves `{ id, name, email, password: hashedPassword, createdAt }` into `users.json`.
  5. Generates a signed JWT token and returns `{ success: true, token, user }`.

#### `POST /api/auth/login`
- **Purpose**: Authenticates an existing user.
- **Input**: `{ email, password }`.
- **How it works**:
  1. Searches `users.json` for the given email.
  2. Compares the submitted password with the stored hash using `bcrypt.compareSync(password, user.password)`.
  3. If matched, generates a JWT token and returns `{ success: true, token, user }`.
  4. If invalid, returns a `401 Unauthorized` error message.

#### `GET /api/auth/me`
- **Purpose**: Fetches the profile of the logged-in user.
- **Input**: `Authorization: Bearer <token>` header.
- **How it works**: Verifies the JWT using `jwt.verify(token, JWT_SECRET)` and returns user details.

---

## 4. Frontend Code Explained (`src/`)

### 1. Auth Service (`src/services/authService.js`)
A simple JavaScript helper class that centralizes communication with the backend:
- `login({ email, password })`: Sends credentials to the backend and saves the returned token and user info into browser `localStorage`.
- `register({ name, email, password })`: Sends new user data to the backend.
- `getUser()`: Reads the currently logged-in user from `localStorage`.
- `logout()`: Clears `localStorage` and logs the user out.

### 2. Login Page (`src/pages/Login.jsx`)
- Collects email and password.
- If redirected from the registration page, it automatically fills the registered email but leaves the password blank to prevent browser password managers from auto-filling admin passwords.
- Sends data via `authService.login()`.
- On success, redirects to `/dashboard`.

### 3. Register Page (`src/pages/Register.jsx`)
- Collects name, email, password, and confirm password.
- Validates passwords match and minimum length.
- Calls `authService.register()`.
- On success, redirects to `/login` with a success notification.

### 4. Dashboard Page (`src/pages/Dashboard.jsx`)
- **Personalized Greeting**: Uses `getGreeting()` to display `"Good morning, [First Name]"` or `"Good afternoon, [First Name]"` based on the system time and the logged-in user.
- **Header Profile**: Displays the user's name and initials (e.g., `SS` for Samarth Sharma).
- **Contacts**: Displays contacts and saves new contacts in browser `localStorage` so they stay even after refreshing.
- **Sign Out**: Clears session and redirects to `/login`.

---

## 5. How to Run the Project

1. **Install Frontend Dependencies**:
   ```bash
   npm install
   ```

2. **Install Backend Dependencies**:
   ```bash
   cd server
   npm install
   cd ..
   ```

3. **Start the Application**:
   Run both frontend and backend together:
   ```bash
   npm run dev:all
   ```
   Or in separate terminals:
   - Frontend: `npm run dev` (runs on `http://localhost:5173`)
   - Backend: `npm run server:dev` (runs on `http://localhost:5000`)
