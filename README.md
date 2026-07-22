# HOK Interior Designs

Production-ready full-stack platform for premium interior design services and e-commerce.

## Stack

- Frontend: React, Vite, Tailwind CSS, React Router, Axios, Framer Motion
- Backend: Node.js, Express, MongoDB, JWT auth
- Integrations: Cloudinary uploads, SendGrid email

## Local Setup

### Frontend

1. Install dependencies:
	- `npm install`
2. Create env file from `.env.example`.
3. Run dev server:
	- `npm run dev`

### Backend

1. Install dependencies:
	- `cd server && npm install`
2. Create env file from `server/.env.example` and set `DATABASE_URL`.
3. Start backend API:
	- `cd server && npm run dev`

## Seed Data

- Run seed command:
  - `cd server && npm run seed`
- Default admin credentials:
  - Email: `admin@hokinterior.com`
  - Password: `admin123!`
- You can override with:
  - `SEED_ADMIN_EMAIL`
  - `SEED_ADMIN_PASSWORD`

## Documentation

- Architecture: `ARCHITECTURE.md`
- API routes: `API_ROUTES.md`
- Deployment: `DEPLOYMENT.md`
- QA/testing: `TESTING_REPORT.md`
