# Supabase Setup

## 1. Buat project

1. Buat project baru di Supabase.
2. Simpan Project URL dan publishable/anon key.
3. Aktifkan Anonymous Sign-Ins pada Authentication providers/settings.
4. Jangan mengambil atau menggunakan `service_role` key di frontend.

## 2. Environment variables

Buat `.env` pada root proyek:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

`.env` jangan di-commit. `.env.example` boleh di-commit dengan placeholder.

## 3. Buat database

Buka SQL Editor pada project Supabase, lalu jalankan semua isi `docs/SUPABASE_SCHEMA.sql`.

SQL tersebut membuat:

- tabel `public.notes`;
- indeks query per user;
- trigger `updated_at`;
- RLS policies untuk SELECT, INSERT, UPDATE, DELETE milik user yang sedang login;
- private Storage bucket `note-images`;
- Storage policies berdasarkan folder user UUID.

## 4. Authentication flow

Aplikasi tidak memiliki UI login. Pada startup:

1. Ambil sesi dengan Supabase Auth.
2. Jika tidak ada sesi, jalankan anonymous sign-in.
3. Ambil `access_token` dari sesi yang aktif.
4. Gunakan access token tersebut pada header Authorization untuk request REST.
5. Jika sesi expired, refresh melalui Supabase client dan ulangi request yang aman.

Anonymous sign-in membuat user ID berbeda untuk browser/perangkat yang berbeda. Catatan akan terisolasi per user karena RLS.

## 5. Storage path

Gunakan path:

```text
<user_id>/<note_id>/<random-filename>.<extension>
```

Contoh pola (bukan kredensial):

```text
8c...uuid.../b2...note-uuid.../f1...random....webp
```

Jangan gunakan public bucket untuk catatan pribadi. Gunakan signed URL untuk menampilkan object private.

## 6. Verifikasi RLS

Dengan dua sesi anonymous yang berbeda:

- User A membuat note A.
- User B tidak boleh melihat note A.
- User B tidak boleh mengubah atau menghapus note A meskipun mengetahui UUID.
- User A dapat membaca dan mengubah note A.

Jangan lanjut ke deployment final bila pengujian isolasi data gagal.

## 7. Batasan dan backup

Tanpa akun permanen atau mekanisme linking identity, anonymous user dapat kehilangan akses ke catatan server bila data browser/session dihapus atau perangkat diganti. Beri tahu pengguna tentang batasan ini secara jujur. Jangan membuat fitur export/restore palsu.
