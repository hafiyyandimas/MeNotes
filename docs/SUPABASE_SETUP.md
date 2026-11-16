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
- tabel `public.note_sessions` dan `public.note_session_members` untuk sesi bersama;
- RPC `open_note_session` yang membuat/bergabung ke sesi dengan passphrase bcrypt;
- indeks query per user;
- trigger `updated_at`;
- RLS policies untuk catatan pribadi dan anggota sesi;
- private Storage bucket `note-images`;
- Storage policies berdasarkan user UUID atau Session ID.

Jalankan schema terbaru setelah memperbarui aplikasi. Skrip dapat dijalankan ulang pada project yang sudah memiliki tabel notes.

## 4. Authentication flow

Aplikasi tidak memiliki UI login. Pada startup:

1. Ambil sesi dengan Supabase Auth.
2. Jika tidak ada sesi, jalankan anonymous sign-in.
3. Ambil `access_token` dari sesi yang aktif.
4. Gunakan access token tersebut pada header Authorization untuk request REST.
5. Jika sesi expired, refresh melalui Supabase client dan ulangi request yang aman.

Anonymous sign-in membuat user ID berbeda untuk browser/perangkat yang berbeda. Catatan akan terisolasi per user karena RLS.

### Shared Session ID

Di halaman Notes, tombol `?` di sebelah form Session ID menjelaskan cara berbagi. Pengguna pertama yang membuka ID baru dengan passphrase membuat sesi; pengguna lain memasukkan pasangan yang sama untuk bergabung dari perangkat mereka. ID dinormalisasi menjadi huruf kecil. ID memakai 3–64 karakter berupa huruf, angka, spasi, titik, garis bawah, atau tanda hubung.

Passphrase minimal 10 karakter dan maksimum 72 byte, disimpan sebagai bcrypt hash di database, dan tidak disimpan di browser. Siapa pun yang mengetahui ID serta passphrase dapat membaca, mengubah, dan menghapus catatan maupun gambar dalam sesi. Gunakan passphrase yang kuat dan simpan dengan aman. Tidak ada fitur pemulihan passphrase.

## 5. Storage path

Gunakan path:

```text
<user_id-or-session_id>/<note_id>/<random-filename>.<extension>
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
