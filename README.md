# ContactX

ContactX is a contact manager with a React/Vite frontend and an Express API backed by MongoDB through Mongoose. User accounts use bcrypt password hashes and JWT authentication; contacts are scoped to their owner and support soft deletion and restore.

## Requirements

- Node.js 20.19+ (or 22.12+)
- A MongoDB Atlas connection string (or another MongoDB deployment)

## Local setup

```powershell
npm install
npm --prefix server install
Copy-Item server\.env.example server\.env
```

Edit `server\.env` and set:

- `MONGODB_URI`: your MongoDB connection string
- `JWT_SECRET`: a private random value of at least 32 characters
- `PORT`: optional; defaults to `5001`
- `JWT_EXPIRES_IN`: optional; defaults to `7d`

Keep `server\.env` private and do not commit it. The API intentionally refuses to start without a MongoDB URI and a sufficiently long JWT secret.

Start the frontend and backend together:

```powershell
npm run dev:all
```

The frontend is served by Vite (default port `5174`) and proxies `/api` requests to the API on port `5001`. You can also run `npm run dev` and `npm run server:dev` in separate terminals.

## API

All paths below are prefixed by `/api`. Protected routes require `Authorization: Bearer <JWT>`.

| Method | Path | Purpose | Auth |
|---|---|---|---|
| `GET` | `/health` | Reports API and MongoDB readiness | No |
| `POST` | `/auth/register` | Validate and register a user, returning a JWT | No |
| `POST` | `/auth/login` | Verify credentials and return a JWT | No |
| `GET` | `/auth/me` | Return the authenticated user's profile | Yes |
| `GET` | `/contacts` | List the user's active contacts | Yes |
| `GET` | `/contacts/trash` | List the user's soft-deleted contacts | Yes |
| `POST` | `/contacts` | Create a contact | Yes |
| `GET` | `/contacts/:id` | Get one active contact | Yes |
| `PATCH` | `/contacts/:id` | Update a contact | Yes |
| `DELETE` | `/contacts/:id` | Soft-delete a contact | Yes |
| `PATCH` | `/contacts/:id/restore` | Restore a deleted contact | Yes |

User emails are normalized and unique. Active contact emails are unique per user; a deleted contact's email can be reused, but restoring it returns `409` if another active contact now uses that email. Contact queries are always scoped to the authenticated user.

## Validation

```powershell
npm run build
npm test --prefix server
```

Existing JSON files are legacy data and are not used by the MongoDB API. No automatic import is performed.
