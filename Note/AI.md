# AI.md — Instruksi untuk Claude / Coding Agent

Dokumen ini adalah kontrak implementasi. Baca seluruh dokumen proyek sebelum menulis kode. Jangan mengubah kebutuhan inti tanpa alasan teknis yang kuat.

## 1. Misi

Bangun MeNote dari awal sebagai PWA yang benar-benar berfungsi, rapi, responsif, dapat di-install, mendukung CRUD catatan melalui Supabase, dan tetap berguna secara offline. Target akhirnya adalah proyek yang dapat dijalankan lokal, dibuild, diuji, di-push ke GitHub, dan di-deploy ke Vercel.

Jangan berhenti pada mockup, static page, atau prototype. Semua tombol dan kontrol yang terlihat harus memiliki perilaku nyata.

## 2. Sumber kebenaran

Urutan dokumen yang harus diikuti:

1. `README.md` untuk ringkasan proyek dan identitas.
2. `docs/PROJECT_SPEC.md` untuk perilaku UI/UX dan fitur.
3. `docs/TECHNICAL_ARCHITECTURE.md` untuk keputusan teknis.
4. `docs/SUPABASE_SETUP.md` dan `docs/SUPABASE_SCHEMA.sql` untuk backend.
5. `docs/ACCEPTANCE_TESTS.md` untuk definisi selesai.
6. `antislop.md` untuk batas kualitas.

Jika terdapat konflik, spesifikasi halaman dan identitas pada `docs/PROJECT_SPEC.md` serta README menang atas ide desain spontan.

## 3. Stack wajib

Gunakan:

- ReactJS dengan JavaScript/JSX (jangan pindah ke framework lain).
- Vite sebagai build tool.
- Tailwind CSS melalui plugin Vite dan CSS custom untuk detail visual.
- React Hooks (`useState`, `useEffect`, `useMemo`, `useCallback`, custom hooks) secara benar.
- React Router untuk SPA.
- Axios sebagai HTTP client untuk REST API Supabase/PostgREST.
- Supabase Auth anonymous sign-in untuk identitas owner per instalasi/browser.
- Supabase PostgreSQL + RLS sebagai sumber data server.
- Supabase Storage untuk gambar catatan.
- Dexie/IndexedDB untuk cache offline, blob gambar lokal, dan antrean sinkronisasi.
- `vite-plugin-pwa` untuk manifest dan service worker.
- `lucide-react` untuk ikon.
- `@dnd-kit` untuk drag-and-drop.

Jangan mengganti Axios dengan fetch untuk seluruh akses API. Jangan menggunakan localStorage sebagai pengganti Supabase. localStorage tetap digunakan untuk preferensi UI dan kebutuhan ringan; IndexedDB menjadi tempat cache/offline queue.

## 4. Urutan navigasi yang tidak boleh berubah

Navigation utama hanya terdiri dari:

1. `Notes`
2. `Settings`
3. `About`

Urutan ini berlaku untuk bottom navigation maupun side navigation. **Jangan menukar Settings dan About.**

- Notes adalah halaman utama dan satu-satunya area CRUD catatan.
- Settings adalah halaman kedua untuk pengaturan tema, posisi navigation, dan status/install PWA.
- About adalah halaman ketiga untuk profil praktikan.
- Detail catatan boleh memiliki route seperti `/notes/:id`, tetapi bukan item navigation utama baru.

Posisi navigation default adalah `bottom`, dan dapat diubah menjadi `left` atau `right` di Settings. Simpan pilihan di localStorage dan terapkan setelah reload.

## 5. Identitas statis About

Gunakan persis data berikut:

```js
export const studentProfile = {
  name: 'Hafiyyan Dimas Walana',
  nim: '21120124140130',
  group: '18',
  shift: '03',
};
```

Jangan membuat data biografi, universitas, email, foto, atau identitas lain yang tidak diberikan. Avatar boleh menggunakan inisial `HW`.

## 6. Prinsip implementasi

- Rancang komponen kecil yang punya satu tanggung jawab jelas.
- Pisahkan pages, reusable components, hooks, services, config, database/offline, dan utilities.
- Gunakan custom hook untuk state/data yang dipakai lintas komponen.
- Pisahkan komponen UI dari pemanggilan API.
- Gunakan satu sumber kebenaran untuk state notes; hindari state duplikat yang tidak tersinkron.
- Gunakan UUID yang dibuat di client untuk ID note agar create offline dapat disinkronkan secara idempotent.
- Tambahkan loading, empty, error, success, offline, dan syncing state yang terlihat serta informatif.
- Validasi input sebelum request. Tangani error jaringan, error RLS, file terlalu besar, dan format file tidak didukung.
- Gunakan semantic HTML, label form, aria-label untuk icon-only button, focus ring, dan keyboard navigation.
- Hormati `prefers-reduced-motion`.
- Jangan menyembunyikan error penting di console saja.
- Jangan mengklaim data sudah tersinkron sebelum server mengonfirmasi.

## 7. Supabase dan keamanan

- Baca dan gunakan `docs/SUPABASE_SCHEMA.sql`.
- Auth anonymous dilakukan sebelum operasi database pertama.
- Request REST PostgREST harus membawa `apikey` (publishable/anon key) dan `Authorization: Bearer <access_token pengguna>` dari sesi Supabase Auth.
- Jangan mengirim publishable/anon key sebagai Bearer token pengguna jika sesi anonymous sudah tersedia.
- Jangan pernah memasukkan `service_role` key ke file `VITE_*`, source frontend, commit, atau deployment client.
- Jangan menonaktifkan RLS untuk membuat aplikasi tampak berfungsi.
- Semua query/update/delete harus dibatasi oleh RLS; jangan mengandalkan filter frontend sebagai mekanisme keamanan.
- Gunakan bucket `note-images` yang private. Gunakan signed URL atau mekanisme aman untuk membaca gambar.
- Path gambar harus diawali user UUID: `<auth.uid>/<note_id>/<file>`.
- Jangan membuat tabel profil tambahan karena About memakai data praktikan statis.

## 8. Offline dan sinkronisasi

- Service worker hanya meng-cache app shell, static assets, icon, font lokal, dan file publik yang aman.
- Jangan cache request authenticated Supabase API secara umum di Workbox; cache data per pengguna di IndexedDB.
- IndexedDB menyimpan catatan yang pernah diunduh, draft, blob gambar lokal, dan mutation queue.
- Create/update/delete saat offline harus langsung tercermin di UI dan disimpan lokal.
- Saat online, startup, tab kembali aktif, atau pengguna menekan Sync, proses antrean secara berurutan.
- Gunakan operasi upsert berbasis ID note agar retry tidak membuat duplikasi.
- Jika sinkronisasi gagal, pertahankan antrean dan tampilkan status yang jujur.
- Jangan menjanjikan background sync yang tidak benar-benar diimplementasikan.
- Jelaskan batasan bahwa perangkat baru tidak dapat mengambil catatan yang belum pernah tersinkron dan belum ada di cache lokal.

## 9. PWA dan deployment

- Konfigurasikan web app manifest dengan nama `MeNote`, short name `MeNote`, `display: standalone`, start URL `/`, theme/background color sesuai tema gelap, dan icon 192x192 serta 512x512 (tambahkan maskable bila tersedia).
- Implementasikan service worker melalui `vite-plugin-pwa`.
- Sediakan indikator online/offline dan prompt install yang hanya muncul ketika browser menyediakan event/kemampuan instalasi.
- Sediakan instruksi manual Add to Home Screen untuk browser yang tidak menyediakan `beforeinstallprompt`.
- Pastikan app shell terbuka saat offline setelah kunjungan online pertama.
- Build harus lolos `npm run build`.
- Siapkan `vercel.json` untuk SPA fallback bila diperlukan. Pastikan route `/notes/:id` tidak menghasilkan 404 saat dibuka langsung.
- Environment variables Supabase diatur di Vercel Project Settings; jangan commit `.env`.

## 10. Alur kerja yang diharapkan

1. Periksa repository dan dokumen proyek.
2. Buat scaffold Vite React dan dependencies.
3. Implementasikan theme tokens, app shell, responsive navigation, dan tiga halaman.
4. Implementasikan Supabase Auth, Axios client, REST services, schema, serta state CRUD.
5. Implementasikan gambar dan Supabase Storage.
6. Implementasikan IndexedDB/offline queue dan sinkronisasi.
7. Implementasikan PWA manifest/service worker/install UX.
8. Jalankan lint/build/test yang tersedia, perbaiki error, dan jalankan acceptance checklist.
9. Tulis instruksi setup Supabase, local run, build, GitHub, dan Vercel.
10. Berikan ringkasan file penting, environment variable yang dibutuhkan, serta hal yang perlu dilakukan manual oleh pemilik proyek.

Jangan meminta user mengisi pertanyaan yang sudah dijawab di dokumen. Bila sebuah detail minor belum ditentukan, ambil keputusan sederhana yang konsisten, catat keputusan tersebut, dan lanjutkan.

## 11. Definition of done

Pekerjaan belum selesai sampai:

- Tiga navigation item tampil dengan urutan Notes, Settings, About.
- About menampilkan empat data praktikan dengan benar.
- CRUD notes berhasil terhadap Supabase dengan RLS aktif.
- Gambar dapat ditambahkan, dilihat, dan dihapus dengan benar.
- Search, pin, archive, dan reorder berfungsi.
- Pilihan theme dan navigation position persisten setelah reload.
- Cache dan local mutation bekerja ketika offline, lalu dapat disinkronkan ketika online.
- Installability, manifest, service worker, dan offline app shell telah diuji.
- `npm run build` berhasil.
- Panduan deployment Vercel lengkap.
- Tidak ada tombol palsu, placeholder UI, atau data palsu yang disajikan sebagai data nyata.
