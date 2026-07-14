# Nacth Top-up Store

Production-oriented starter for an automated game/PPOB top-up store using Express.js, React, MySQL, Digiflazz, and TriPay.

## Quick Start

```powershell
npm run install:all
Copy-Item backend\.env.example backend\.env
npm test
npm run dev:backend
npm run dev:frontend
```

Backend default: `http://localhost:4000`

Frontend default: `http://localhost:5173`

For production frontend deploys, set `frontend/.env` from `frontend/.env.example` and keep `VITE_DEMO_MODE=false`.

## Database

Apply `database/schema.sql` to MySQL, then configure `backend/.env`.

## Security Notes

- TriPay callbacks are verified with HMAC-SHA256 before any state change.
- Digiflazz order execution is guarded by an idempotency/order lock so repeated callbacks cannot create duplicate vendor orders.
- Passwords must be stored with bcrypt hashes through the backend, never plaintext.
