# ContactX Frontend

## Setup

```bash
npm install
npm run dev
```

## Backend integration

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000
```

Without `VITE_API_URL`, the application runs in demo mode using local dashboard data.

The frontend expects:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/contacts`
- `POST /api/contacts`
- `PATCH /api/contacts/:id`
- `DELETE /api/contacts/:id`

Authenticated requests use `Authorization: Bearer <token>`.
