# ContactX — Project Documentation

## Overview

ContactX is a React contact manager backed by a Node.js/Express API. MongoDB stores account and contact records through Mongoose. The Vite development server proxies API calls to the backend.

```text
React + Vite ── /api ──> Express ── Mongoose ──> MongoDB Atlas
```

## Components

- `src/pages/`: landing, registration, login, and dashboard screens.
- `src/services/authService.js`: registration, login, JWT session storage, and current-user lookup.
- `src/services/contactService.js`: authenticated contact API calls.
- `server/server.js`: environment validation, MongoDB connection, and API startup.
- `server/app.js`: Express middleware, health route, API mounting, and JSON error handling.
- `server/models/User.js`: normalized unique email, profile, and hidden password hash.
- `server/models/Contact.js`: owner-scoped contact details and soft-delete timestamp.
- `server/routes/auth.js`: registration, login, and current-user routes.
- `server/routes/contacts.js`: contact listing, creation, update, delete, trash listing, and restore.
- `backend/server.js`: compatibility entry point that starts the same API.

## Setup and configuration

Install the frontend and backend dependencies, copy `server/.env.example` to `server/.env`, and set a valid `MONGODB_URI` and private `JWT_SECRET` (at least 32 characters). Optional settings are `PORT` (default `5001`) and `JWT_EXPIRES_IN` (default `7d`). Do not commit the local environment file.

Run the whole app using `npm run dev:all`, or run `npm run dev` and `npm run server:dev` separately. The API reports readiness at `GET /api/health`; it returns `503` until MongoDB is connected.

## Authentication

Registration validates name, email, and password, lowercases the email, hashes the password with bcrypt, and returns a JWT and safe user profile. The database's unique email index and duplicate-key handling prevent duplicate accounts, including concurrent registrations. Login compares the password hash and uses a generic invalid-credentials response. Protected routes validate a signed, expiring JWT and use its subject as the account ID.

Passwords are excluded from normal User queries and API responses. The JWT secret is read only from the environment.

## Contact model and behavior

Each contact belongs to one user. Supported fields are name, email, phone, company, role, tags, follow-up date, favorite status, last-contact label, and color. The API validates request types and model constraints, normalizes contact email, and prevents duplicate active contact emails per owner.

Deleting a contact sets `deletedAt` instead of removing the record. Normal list and detail requests hide deleted records. `GET /api/contacts/trash` returns the authenticated user's deleted contacts. `PATCH /api/contacts/:id/restore` clears `deletedAt`; it returns `409` if the email was reused by another active contact. All reads and mutations are owner-scoped.

## API reference

All endpoints are prefixed by `/api`. Protected endpoints require `Authorization: Bearer <JWT>`.

| Method | Path | Auth | Result |
|---|---|---|---|
| `GET` | `/health` | No | API and MongoDB readiness |
| `POST` | `/auth/register` | No | Create an account and issue a token |
| `POST` | `/auth/login` | No | Verify credentials and issue a token |
| `GET` | `/auth/me` | Yes | Current user's safe profile |
| `GET` | `/contacts` | Yes | Active contacts |
| `GET` | `/contacts/trash` | Yes | Soft-deleted contacts |
| `POST` | `/contacts` | Yes | Create a contact |
| `GET` | `/contacts/:id` | Yes | Read an active contact |
| `PATCH` | `/contacts/:id` | Yes | Update an active contact |
| `DELETE` | `/contacts/:id` | Yes | Soft-delete a contact |
| `PATCH` | `/contacts/:id/restore` | Yes | Restore a deleted contact |

Validation errors return `400`, duplicate records return `409`, missing or invalid authentication returns `401`, and inaccessible contacts return `404`.

## Testing

Run `npm run build` to validate the frontend and `npm test --prefix server` to run the backend API and Mongoose schema tests. The backend tests do not require a live MongoDB instance; a configured Atlas connection is required to run the full app and exercise database operations.

Legacy JSON user files remain in the repository but are no longer read by the API. Existing JSON data is not automatically migrated.
