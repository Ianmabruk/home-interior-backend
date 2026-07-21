# UPLOAD REPORT — HOK Interior Designs Backend

**Date:** 2026-07-22
**Scope:** Upload pipeline audit, build, and verify

---

## ARCHITECTURE

```
Controller
  └─> mediaService.upload({ buffer, mimeType, folder, type })
        ├─ if type === 'video' → uploadService.uploadVideo()
        └─ else → uploadService.uploadImage()
              └─ Cloudinary upload_stream (streamifier)
                    └─ Returns { secure_url, public_id }
  └─> URL saved to database (text/JSON columns only)
```

## FILES

| File | Purpose |
|------|---------|
| `src/services/uploadService.js` | Core upload logic (Cloudinary stream, retry, validation) |
| `src/services/media.service.js` | Thin wrapper that routes `image` / `video` to the correct function |
| `src/config/cloudinary.js` | Cloudinary SDK config + `verifyCloudinaryConfig()` |

## UPLOAD ENTRY POINTS

Every controller uses the same service:

| Controller | Upload Call |
|-----------|-------------|
| `heroController` | `mediaService.upload({ buffer, mimeType, folder: 'hok/homepage/hero', type: 'image' })` |
| `portfolioController` | `mediaService.upload({ buffer, mimeType, folder: 'hok/portfolio', type: 'image' })` |
| `productController` | `mediaService.upload({ buffer, mimeType, folder: 'hok/products', type: 'image' })` |
| `virtualDesignController` | `mediaService.upload({ buffer, mimeType, folder: 'hok/virtual-design', type: isVideo ? 'video' : 'image' })` |
| `serviceController` | `mediaService.upload({ buffer, mimeType, folder: 'hok/services', type: 'image' })` |
| `contentController` (about) | `mediaService.upload({ buffer, mimeType, folder: 'hok/about', type: 'image' })` |
| `testimonialController` | `mediaService.upload({ buffer, mimeType, folder: 'hok/testimonials', type: 'image' })` |

## DELETION ENTRY POINT

All deletes go through:
| Service Call | Used By |
|-------------|---------|
| `mediaService.delete(publicId, resourceType)` | Every controller that handles updates/deletes |

## MULTER INSTANCES

| Route File | Multer Config | Purpose |
|-----------|--------------|---------|
| `server/src/routes/productRoutes.js` | `multer({ storage: multer.memoryStorage() })` | Product images (max 8) |
| `server/src/routes/contentRoutes.js` | `multer({ storage: multer.memoryStorage(), limits: { fileSize: 50MB } })` | Hero, portfolio, virtual-design, services, about, test-upload, media/upload |

**Note:** Two separate multer instances exist. They are functionally independent because they handle different route trees. Consolidation is possible but not required for reliability.

## VALIDATION

- Max image size: 10MB
- Max video size: 50MB
- Supported images: JPEG, PNG, WebP, GIF, AVIF
- Supported videos: MP4, MOV, AVI, WebM
- Validation performed in `validateFileUpload` middleware before reaching controllers

## RETRY LOGIC

- 2 attempts on Cloudinary upload failure
- Exponential backoff: 500ms × attempt_number
- Error classification for friendly messages (auth, timeout, format, quota, size)

## STORAGE GUARANTEES

1. **PostgreSQL stores URLs only** — no binary file data in database columns
2. **Cloudinary stores the actual files** — PostgreSQL holds `secure_url` strings
3. **On update:** existing Cloudinary assets are deleted before new upload (where `cloudinaryId` / `photoPublicId` is tracked)
4. **On delete:** Cloudinary assets are deleted before the database row is removed

## BUG FIX: HERO DOUBLE UPLOAD

**Before:** `heroController.create` and `heroController.update` uploaded the same file twice:
1. `mediaService.upload()` → `imageUrl` + `cloudinaryId`
2. `mediaFiles` loop → `mediaUrls[]`

This wasted API quota and created duplicate assets in Cloudinary.

**After:** Single upload. Both `imageUrl` and `mediaUrls[0]` reference the same URL.
