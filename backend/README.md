# HOK Interiors Backend

A clean, production-ready Express backend for the HOK Interiors frontend.

## Tech Stack

- Node.js + Express
- PostgreSQL via Prisma ORM
- Supabase Storage (for file uploads)
- JWT authentication (access + refresh tokens)
- Multer (file uploads)
- Bcrypt (password hashing)

## Setup

1. Install dependencies:
   ```bash
   cd backend && npm install
   ```

2. Configure environment variables in `backend/.env` (see `.env.example`).

3. Run database migrations:
   ```bash
   npm run db:deploy
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

## Default Admin

- Email: `admin@hokinteriors.com`
- Password: `Admin123!`

## API Endpoints

### Auth
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PATCH /api/auth/me`

### Content (Public)
- `GET /api/content/homepage`
- `GET /api/content/portfolio`
- `GET /api/content/portfolio/:id`
- `GET /api/content/virtual-design`
- `GET /api/content/virtual-design/:id`
- `GET /api/content/services`
- `GET /api/content/services/:id`
- `GET /api/content/about`
- `GET /api/content/hero-media`
- `GET /api/content/hero-media/:id`
- `POST /api/content/consultations`

### Products
- `GET /api/products`
- `GET /api/products/:id`
- `GET /api/products/admin/all`
- `POST /api/products`
- `PATCH /api/products/:id`
- `DELETE /api/products/:id`

### Admin
- `GET /api/admin/overview`
- `GET /api/admin/settings`
- `PUT /api/admin/settings`
- `GET /api/admin/testimonials`
- `POST /api/admin/testimonials`
- `PATCH /api/admin/testimonials/:id`
- `DELETE /api/admin/testimonials/:id`
- `GET /api/admin/consultations`
- `PATCH /api/admin/consultations/:id/status`
- `DELETE /api/admin/consultations/:id`
- `GET /api/admin/consultations/export`

### Uploads
- `POST /api/media/upload`
- `POST /api/media/delete`

### Orders (Public)
- `POST /api/orders`
- `GET /api/orders/me`

### Messages (Public)
- `POST /api/messages`
- `GET /api/messages` (admin)
- `POST /api/messages/reply` (admin)

## License

Private - HOK Interiors
