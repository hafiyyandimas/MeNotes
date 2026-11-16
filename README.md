# MeNotes

MeNotes adalah PWA catatan pribadi untuk Responsi Modul 5 Praktikum Pengembangan Perangkat Bergerak. Aplikasi menggunakan React + Vite, IndexedDB untuk catatan lokal/offline, dan Supabase untuk sinkronisasi cloud opsional.

## Fitur

- Halaman utama Notes dengan CRUD, pencarian title/content/tag, pin, archive, dan drag-and-drop reorder.
- Gambar JPEG/PNG/WebP hingga 5 MB; disimpan lokal saat offline dan dikirim ke private Supabase Storage saat sinkronisasi.
- Tiga navigasi utama: Notes, Settings, About. Posisi menu dapat dipilih (Bottom/Left/Right).
- Shared Session ID dan passphrase untuk membuka kumpulan notes yang sama lintas perangkat.
- Tema Ocean, Slate, dan Indigo tersimpan di perangkat.
- PWA installable dengan app shell yang di-cache setelah kunjungan pertama.
- Data notes dan antrean perubahan tersimpan di IndexedDB.
- Tanpa kredensial Supabase, catatan tetap berfungsi dan disimpan lokal; cloud sync dinonaktifkan dengan pemberitahuan yang jelas.

## Menjalankan aplikasi

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Isi `.env` dengan URL project dan publishable/anon key Supabase untuk mengaktifkan cloud. Jangan pernah memasukkan `service_role` key ke aplikasi frontend.

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

## Menyiapkan Supabase

1. Buat project Supabase dan aktifkan **Anonymous Sign-Ins**.
2. Jalankan seluruh isi [docs/SUPABASE_SCHEMA.sql](./docs/SUPABASE_SCHEMA.sql) di SQL Editor. Schema ini mencakup shared Session ID.
3. Isi kedua environment variable di `.env`, lalu mulai ulang Vite.
4. Verifikasi akses dua sesi anonymous berbeda sesuai [docs/SUPABASE_SETUP.md](./docs/SUPABASE_SETUP.md).

Anonymous user terikat pada browser/perangkat. Menghapus data browser dapat menghilangkan akses ke catatan cloud yang belum memiliki akun permanen; data offline yang belum tersinkron hanya tersedia di perangkat ini.

## Build dan deployment

```powershell
npm run build
npm run preview
```

Deploy repository ini ke Vercel dengan build command `npm run build` dan output directory `dist`. Tambahkan `VITE_SUPABASE_URL` serta `VITE_SUPABASE_ANON_KEY` di Project Settings → Environment Variables. `vercel.json` menangani fallback route SPA.

PWA/service worker diuji pada production build; instalasi dan perilaku offline akhir perlu diverifikasi lewat HTTPS setelah deployment.

## Profil praktikan

| Data | Nilai |
|---|---|
| Nama | Hafiyyan Dimas Walana |
| NIM | 21120124140130 |
| Kelompok | 18 |
| Shift | 03 |

Spesifikasi sumber tugas tersedia dalam folder [Note](./Note/).
