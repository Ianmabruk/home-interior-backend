# HOK Interior Designs Deployment Guide

## 1. Local Development

### Frontend
- Install dependencies: `yarn` (this repo is standardized on Yarn — root and `server/` both commit `yarn.lock`. Do not reintroduce `package-lock.json`.)
- Copy env file: create `.env` from `.env.example`
- Start app: `npm run dev`

### Backend
- Install dependencies: `cd server && npm install`
- Copy env file: create `server/.env` from `server/.env.example`
- Start API: `cd server && npm run dev`

### Seed Initial Data
- Ensure `server/.env` contains a valid `DATABASE_URL`.
- Optional seed admin overrides:
  - `SEED_ADMIN_EMAIL=admin@hokinterior.com`
  - `SEED_ADMIN_PASSWORD=admin123!`
- Run seeder: `cd server && npm run seed`
- Seeder is idempotent and safe to run multiple times.

> Note: the database is **PostgreSQL (Neon)** accessed through **Prisma**. There is no MongoDB in this project.

## 2. cPanel (Frontend — current hosting)

The React + Vite SPA is built statically and served from cPanel.

- Build command (run locally or in cPanel's Node/JS build step): `npm run build`
- Publish directory: `dist`
- **Required build env var** (must be set *before* `npm run build`, Vite inlines it at build time):
  - `VITE_API_URL=https://<your-render-backend>/api`
  - If `VITE_API_URL` is left empty the app calls a relative `/api` path, which does **not** exist on cPanel and breaks every request. This is the most common "blank site / no data" failure.
- SPA fallback: configure cPanel rewrite so all unknown paths serve `dist/index.html` (e.g. a `.htaccess` with `RewriteRule ^ index.html [L]`).

## 3. Netlify (Frontend — alternative)
- Build command: `yarn build`
- Publish directory: `dist`
- Environment variable:
  - `VITE_API_URL=https://<your-render-backend>/api`
- Add SPA redirect rule if needed:
  - `_redirects` file with `/* /index.html 200`

## 3. Docker (Backend)

- Build:
  - `docker build -t hok-interior-backend .`
- Run:
  - `docker run -p 5000:5000 --env-file server/.env hok-interior-backend`

- Required environment variables (via `server/.env` or `--env-file`):
  - `NODE_ENV=production`
  - `PORT=5000`
  - `DATABASE_URL=...`
  - `JWT_ACCESS_SECRET=...`
  - `JWT_REFRESH_SECRET=...`
  - `CLOUDINARY_CLOUD_NAME=...`
  - `CLOUDINARY_API_KEY=...`
  - `CLOUDINARY_API_SECRET=...`
  - `SENDGRID_API_KEY=...`
  - `EMAIL_FROM=info@hokinterior.com`
  - `CLIENT_URL=https://<your-frontend-domain>`

## 4. Render (Backend)
- Root directory: `server`
- Build command: `yarn install && npx prisma generate`
- Start command: `npm run start` — the `start` script runs `npx prisma generate && node src/index.js` at boot. **Migrations are never executed automatically at runtime.** If the database schema needs to be updated, run migrations manually during a planned deploy window.
- **If you ever see P3009 or PrismaClientValidationError after a deploy:** do not clear the build cache and hope `migrate deploy` fixes it. Instead, verify the Prisma schema matches the database using `server/MIGRATION_RECOVERY.md`.
- Required environment variables:
  - `NODE_ENV=production`
  - `PORT=5000`
  - `CLIENT_URL=https://<your-netlify-domain>`
  - `DATABASE_URL=...`
  - `JWT_ACCESS_SECRET=...`
  - `JWT_REFRESH_SECRET=...`
  - `ACCESS_TOKEN_TTL=15m`
  - `REFRESH_TOKEN_TTL=30d`
  - `CLOUDINARY_CLOUD_NAME=...`
  - `CLOUDINARY_API_KEY=...`
  - `CLOUDINARY_API_SECRET=...`
  - `SENDGRID_API_KEY=...`
  - `EMAIL_FROM=info@hokinterior.com`

## 5. Production Hardening Checklist
- Configure Neon database access and SSL.
- Configure domain-level CORS in `CLIENT_URL`.
- Rotate JWT secrets and API keys before launch.
- Set Cloudinary upload presets and moderation if required.
- Set SendGrid verified sender identity for `EMAIL_FROM`.
- Monitor API logs and configure uptime monitoring.
- After first deploy, run the seed once to bootstrap admin credentials and core homepage data.
