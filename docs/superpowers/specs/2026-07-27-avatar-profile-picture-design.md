# Avatar (Profile Picture) Feature Design

**Date:** 2026-07-27
**Status:** Approved

## Overview

Implement profile picture (avatar) upload and optimized delivery across the Sigma application. The feature replaces the current non-functional placeholder ("Fitur upload belum tersedia") with a complete upload-to-display pipeline using Cloudflare R2 for storage and Cloudflare Image Resizing for on-the-fly optimization.

## Architecture

```
User selects file
  ↓
browser-image-compression (max 512px, WebP, quality 0.8, useWebWorker)
  ↓
POST /api/uploads/sign { category: "avatar" }
  → presigned PUT URL for R2 key: avatars/{userId}/{uuid}.webp
  ↓
PUT blob → R2 public bucket
  ↓
Server action: updateAvatar(userId, key)
  → delete old avatar object if exists
  → update user.image = {R2_PUBLIC_URL}/avatars/{userId}/{uuid}.webp
  ↓
Display: getOptimizedSrc(url, width) → /cdn-cgi/image/w={w},q=75,f=auto/{src}
```

## Storage Layer

### R2 Bucket
- Bucket is made public (via custom domain or r2.dev URL)
- Objects under `avatars/` path are publicly accessible
- Cache-Control: `public, max-age=31536000, immutable`

### Key Builder
- `buildAvatarKey(userId, ext)` → `avatars/{userId}/{uuid}.{ext}`
- UUID ensures cache-busting on each upload

### File Categories
Add to `services/storage.ts`:
- `avatar: 2 * 1024 * 1024` (2MB max)
- Allowed types restricted to images only: jpeg, png, webp, gif

## Client-Side Compression

Library: `browser-image-compression`

Options:
- `maxSizeMB: 0.5`
- `maxWidthOrHeight: 512`
- `useWebWorker: true`
- `fileType: "image/webp"` (convert to WebP)
- `initialQuality: 0.8`

This ensures:
- Small upload payload (<500KB)
- Consistent format (WebP) for Cloudflare delivery
- Non-blocking compression via web worker

## Upload API

Modify `POST /api/uploads/sign` to accept optional `category: "avatar"`:
- For avatars, use `ALLOWED_UPLOAD_MIME_TYPES` filtered to images only
- Return presigned URL for `avatars/{userId}/{uuid}.webp`

No new finalize endpoint needed — the server action verifies the upload.

## Server Action

`updateAvatar(userId, key)` — server action:
1. Verify session matches userId
2. Call `getObjectMetadata(key)` to confirm file exists and validate size/content-type
3. If user has an existing avatar (parse `user.image` to extract R2 key), delete old object
4. Update `user.image` in DB to new public URL
5. Return new URL

## Image Optimization

### Custom Next.js Loader
File: `lib/image-loader.ts`

```ts
export default function cfImageLoader({ src, width, quality }) {
  if (process.env.NODE_ENV === "development") return src
  const params = [`width=${width}`, `quality=${quality || 75}`, "format=auto"]
  const normalizedSrc = src.replace(/^https?:\/\//, "")
  return `/cdn-cgi/image/${params.join(",")}/${normalizedSrc}`
}
```

### Utility Function
```ts
export function getOptimizedSrc(src: string, width: number, quality?: number) {
  if (!src || process.env.NODE_ENV === "development") return src
  const params = [`width=${width}`, `quality=${quality || 75}`, "format=auto"]
  const normalizedSrc = src.replace(/^https?:\/\//, "")
  return `/cdn-cgi/image/${params.join(",")}/${normalizedSrc}`
}
```

### next.config.ts
```ts
images: {
  loader: "custom",
  loaderFile: "./lib/image-loader.ts",
  deviceSizes: [64, 128, 256, 384, 512],
  imageSizes: [32, 48, 64],
  remotePatterns: [
    { protocol: "https", hostname: "**.r2.dev", pathname: "/sigma-storage/**" },
    // or custom domain if used
  ],
}
```

## Display Layer

### Avatar Component
Base UI Avatar's `<img>` tag receives `getOptimizedSrc(url, displaySize * 2)` for retina support.

### Sizes by context
- Sidebar nav: 32px display → request `width=64`
- Profile page: 80px display → request `width=160`
- List views (assessments): 40px display → request `width=80`

### NavUser Update
In role layouts, pass `getOptimizedSrc(user.image, 64)` as the avatar prop.

## Profile Pages (Intern + Supervisor)

Replace the current file input handler:

1. On file select, validate type (image only) and size (<2MB)
2. Show local preview via `URL.createObjectURL(originalFile)` for instant feedback
3. On "Save" button click (or auto-trigger):
   a. Compress with `browser-image-compression`
   b. Call presigned upload API
   c. PUT compressed blob to R2
   d. Call `updateAvatar` server action
   e. Update preview with optimized URL
4. Show loading state during upload
5. Handle errors (retry with toast)

## Error Handling

- Client: use existing `useStorageToast` pattern for upload progress/errors
- Server action: return `{ success: false, error: string }` for validation failures
- Image compression failure: fall back to uploading original file (validate size still passes)

## Cache Invalidation

Each upload generates a new UUID in the key path, so the URL changes. This naturally busts all caches (browser, CDN, Cloudflare IR). No manual invalidation needed.

## Migration

No data migration needed — existing `user.image` values are URLs that will continue working. Old non-R2 URLs will display as-is (no Cloudflare IR optimization applied, which is acceptable).

## Sub-Issues

1. Storage: Add avatar key builder, file category, and update upload API
2. Dependencies: Add browser-image-compression
3. Config: Update next.config.ts with custom loader and remote patterns
4. Lib: Create image-loader.ts with cfImageLoader and getOptimizedSrc
5. Server Action: Create updateAvatar action
6. Profile Pages: Wire up compression + upload + save flow (intern + supervisor)
7. NavUser: Pass optimized avatar URL in role layouts
8. Avatar Component: Use getOptimizedSrc for all avatar renders
