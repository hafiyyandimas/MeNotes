# MeNote

> Your thoughts, beautifully organized.

MeNote adalah aplikasi catatan pribadi berbasis **Progressive Web App (PWA)**. Aplikasi dibuat sebagai tugas Responsi Modul 5 Praktikum Pengembangan Perangkat Bergerak (PPB) 2026 Ganjil.

## Identitas praktikan

| Data | Nilai |
|---|---|
| Nama | Hafiyyan Dimas Walana |
| NIM | 21120124140130 |
| Kelompok | 18 |
| Shift | 03 |

## Ringkasan produk

MeNote memiliki tiga halaman navigasi utama dengan urutan yang wajib dipertahankan:

1. **Notes** — halaman utama untuk membuat, membaca, mengubah, menghapus, mencari, mem-pin, mengarsipkan, serta mengurutkan catatan. Catatan dapat memiliki gambar.
2. **Settings** — mengatur posisi navigation bar (`Bottom`, `Left`, atau `Right`) dan memilih variasi tema gelap bernuansa biru yang tetap tenang.
3. **About** — halaman profil praktikan yang menampilkan nama, NIM, kelompok, dan shift.

Navigation bar berada di bawah secara default. Pengguna dapat memindahkannya ke kiri atau kanan melalui Settings. Detail catatan adalah tampilan turunan dari halaman Notes, bukan halaman navigasi utama keempat.

## Teknologi

- ReactJS + JavaScript (JSX)
- Vite
- Tailwind CSS melalui plugin Vite, ditambah CSS khusus bila diperlukan
- React Hooks untuk state dan lifecycle
- React Router untuk navigasi SPA dan tampilan detail catatan
- Axios untuk REST API Supabase/PostgREST
- Supabase Auth (anonymous sign-in), PostgreSQL, Row Level Security (RLS), dan Supabase Storage
- Dexie / IndexedDB untuk cache catatan, gambar lokal, dan antrean sinkronisasi offline
- `vite-plugin-pwa` / Workbox untuk manifest, service worker, precache, dan instalasi PWA
- `lucide-react` untuk ikon
- `@dnd-kit` untuk drag-and-drop yang dapat digunakan dengan mouse, touch, dan keyboard
- Vercel untuk deployment

Lihat `docs/PROJECT_SPEC.md` dan `docs/TECHNICAL_ARCHITECTURE.md` sebelum mulai coding.

## Persyaratan responsi yang harus dipenuhi

- [ ] Minimal tiga halaman yang dapat dinavigasi: Notes, Settings, About.
- [ ] Halaman About memuat nama, NIM, dan kelompok (serta shift sebagai informasi tambahan).
- [ ] Setidaknya satu halaman memiliki CRUD yang benar-benar berfungsi. MeNote menerapkan CRUD untuk Notes.
- [ ] PWA dapat di-install melalui browser yang mendukung instalasi.
- [ ] PWA tetap membuka app shell dan catatan yang sudah tersimpan secara lokal ketika offline.
- [ ] Perubahan catatan offline tersimpan lokal dan dapat disinkronkan ketika koneksi kembali.
- [ ] Aplikasi di-deploy ke Vercel dan diuji pada URL HTTPS hasil deployment.

## Menjalankan proyek

Setelah implementasi dibuat oleh coding agent:

```bash
npm install
cp .env.example .env
npm run dev
```

Isi `.env` dengan konfigurasi Supabase milik proyek sendiri. Jangan pernah memasukkan `service_role` key ke frontend.

Build produksi dan pemeriksaan:

```bash
npm run build
npm run preview
```

## Environment variables

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

Nama variabel mengikuti konvensi Vite sehingga nilainya tersedia pada bundle browser. Hanya publishable/anon key yang boleh digunakan di frontend, dan seluruh akses database wajib dilindungi RLS.

## Dokumen proyek

- `AI.md` — instruksi utama untuk Claude atau coding agent.
- `antislop.md` — standar kualitas dan larangan implementasi asal jadi.
- `CLAUDE_HANDOFF.md` — prompt yang dapat langsung ditempel ke Claude.
- `docs/PROJECT_SPEC.md` — spesifikasi UI, halaman, fitur, dan perilaku.
- `docs/TECHNICAL_ARCHITECTURE.md` — arsitektur frontend, API, offline, PWA, dan deployment.
- `docs/SUPABASE_SETUP.md` — langkah konfigurasi Supabase.
- `docs/SUPABASE_SCHEMA.sql` — skema tabel, indeks, trigger, RLS, dan Storage policies.
- `docs/IMPLEMENTATION_ROADMAP.md` — urutan pengerjaan yang disarankan.
- `docs/ACCEPTANCE_TESTS.md` — checklist pengujian sebelum dikumpulkan.
- `project-structure.txt` — rancangan struktur folder dan file.

## Catatan sumber praktikum

Modul 5/Bab VI menjadi acuan teknologi: ReactJS, Vite, API/REST, Axios, React Hooks, error handling, localStorage, plugin PWA, serta alur deployment melalui GitHub dan Vercel. MeNote menerapkan localStorage untuk preferensi UI dan IndexedDB untuk data offline yang lebih besar/terstruktur. Arsitektur Axios + Supabase REST dipisahkan dari Supabase Auth agar request PostgREST membawa access token pengguna dan dapat dievaluasi oleh RLS.
