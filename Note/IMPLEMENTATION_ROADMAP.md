# Implementation Roadmap

Kerjakan berurutan supaya pondasi data dan UI tidak perlu dibongkar berulang kali.

## Phase 1 — Foundation

- Scaffold React + Vite JavaScript.
- Install dependencies yang ditetapkan di `AI.md`.
- Setup Tailwind Vite plugin, global CSS tokens, font, Lucide.
- Setup React Router.
- Buat app shell dengan navigation Notes → Settings → About.
- Pastikan responsive layout dan tiga route dasar sudah berfungsi.

**Exit check:** tiga halaman bisa dibuka; navigation item tepat urutannya; mobile/desktop layout tidak overflow.

## Phase 2 — Visual system and settings

- Implement theme provider dengan Ocean/Slate/Indigo.
- Implement `navPosition` bottom/left/right.
- Persist preferences ke localStorage.
- Implement About dari constant student profile.
- Implement component states, focus, hover, pressed, disabled, toast, confirm dialog.

**Exit check:** theme/navigation tetap sama setelah reload; About berisi data praktikan secara persis.

## Phase 3 — Supabase backend

- Setup env validation.
- Implement Supabase Auth anonymous session.
- Implement Axios REST client dengan access-token interceptor.
- Buat note service (list/create/upsert/update/delete).
- Jalankan `SUPABASE_SCHEMA.sql` dan verifikasi RLS.
- Implement error normalization dan loading state.

**Exit check:** CRUD bekerja di Supabase untuk sesi anonymous dan data user lain tidak bisa dibaca.

## Phase 4 — Notes UX

- Implement Notes page, note card, grid/list responsif.
- Implement search title/content/tags.
- Implement create/read/update/delete.
- Implement tags, pin, archive.
- Implement image picker, preview, upload, private signed URL.
- Implement `@dnd-kit` reorder dan persist sort_order.

**Exit check:** seluruh fitur Notes berfungsi dan tetap berfungsi setelah refresh.

## Phase 5 — Offline-first

- Setup Dexie/IndexedDB schema.
- Cache server notes dan gambar yang diperlukan.
- Simpan offline draft/blob gambar.
- Implement mutation queue dan idempotent sync.
- Sync on startup, online event, tab focus, and manual Sync now.
- Tambahkan indikator Saved locally / Pending sync / Synced / Sync error.

**Exit check:** create/update/delete ketika offline bertahan setelah reload dan tersinkron ketika internet pulih tanpa duplikasi.

## Phase 6 — PWA

- Configure Vite PWA plugin.
- Add app manifest, icons, theme/background colors.
- Configure Workbox precache dan navigation fallback.
- Implement install prompt dan manual install help.
- Implement offline indicator dan update available prompt.

**Exit check:** production build memiliki manifest/service worker dan app shell dapat dibuka offline setelah pertama kali online.

## Phase 7 — Quality and deployment

- Jalankan lint/test/build.
- Jalankan semua acceptance tests.
- Test browser viewport mobile, tablet, desktop.
- Push ke GitHub.
- Import repository ke Vercel.
- Set environment variables.
- Verifikasi SPA routes, Supabase CRUD, install prompt/manual install, dan offline mode pada HTTPS deployment.

**Exit check:** siap dibagikan sebagai URL Vercel dan dapat didemonstrasikan saat responsi.
