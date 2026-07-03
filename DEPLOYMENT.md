# HOK Interior Designs Deployment Guide

## 1. Local Development

### Frontend
- Install dependencies: `npm install`
- Copy env file: create `.env` from `.env.example`
- Start app: `npm run dev`

### Backend
- Install dependencies: `cd server && npm install`
- Copy env file: create `server/.env` from `server/.env.example`
- Start API: `cd server && npm run dev`

### Seed Initial Data
- Ensure `server/.env` contains a valid `MONGO_URI`.
- Optional seed admin overrides:
  - `SEED_ADMIN_EMAIL=admin@hokinterior.com`
  - `SEED_ADMIN_PASSWORD=Admin123!`
- Run seeder: `cd server && npm run seed`
- Seeder is idempotent and safe to run multiple times.

## 2. Netlify (Frontend)
- Build command: `npm run build`
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
  - `MONGO_URI=...`
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
- Build command: `npm install`
- Start command: `npm run start`
- Required environment variables:
  - `NODE_ENV=production`
  - `PORT=5000`
  - `CLIENT_URL=https://<your-netlify-domain>`
  - `MONGO_URI=...`
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
- Enable MongoDB IP allowlist for Render outbound IPs or allow secure access.
- Configure domain-level CORS in `CLIENT_URL`.
- Rotate JWT secrets and API keys before launch.
- Set Cloudinary upload presets and moderation if required.
- Set SendGrid verified sender identity for `EMAIL_FROM`.
- Monitor API logs and configure uptime monitoring.
- After first deploy, run the seed once to bootstrap admin credentials and core homepage data.
