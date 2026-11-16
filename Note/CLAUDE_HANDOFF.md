# Prompt untuk Claude — Build MeNote PWA

Kamu bertindak sebagai senior frontend/PWA engineer. Bangun aplikasi **MeNote** dari awal untuk tugas Responsi Modul 5 PPB.

**Mulai dengan membaca `README.md`, `AI.md`, `antislop.md`, dan seluruh file dalam folder `docs/`.** Dokumen tersebut adalah spesifikasi proyek dan sumber kebenaran. Jangan hanya memberikan tutorial atau potongan kode; implementasikan proyek secara nyata di workspace/repository yang tersedia.

Hasil akhir harus berupa React + Vite PWA dengan Supabase, Axios REST API, CRUD notes, penyimpanan offline berbasis IndexedDB, manifest/service worker, serta siap deploy ke Vercel.

Hal yang tidak boleh berubah:

1. Nama aplikasi: **MeNote**.
2. Navigation utama tepat tiga item dengan urutan **Notes → Settings → About**.
3. Navigation default di bawah; Settings dapat mengubah posisi menjadi kiri atau kanan.
4. Identitas About:
   - Nama: Hafiyyan Dimas Walana
   - NIM: 21120124140130
   - Kelompok: 18
   - Shift: 03
5. Gaya visual dark navy + calm blue, elegan, minimal, responsif, dengan animasi halus.
6. Notes harus memiliki CRUD Supabase yang nyata, gambar, search, pin, archive, dan drag-and-drop reorder.
7. Theme dan posisi navigation disimpan secara persisten.
8. Offline harus mencakup app shell dan catatan cache; operasi catatan offline masuk antrean untuk disinkronkan ketika online.

Ikuti roadmap dan acceptance tests. Buat kode modular, jangan menaruh semua implementasi dalam satu file. Jangan gunakan mock CRUD, tombol palsu, atau data dummy sebagai backend. Jangan pernah memasukkan Supabase service-role key ke frontend.

Selesaikan proyek secara bertahap tanpa menunggu konfirmasi untuk keputusan minor. Jika kredensial Supabase belum tersedia, tetap implementasikan integrasi, buat `.env.example`, sertakan SQL schema dan instruksi setup, dan sediakan pesan konfigurasi yang jelas saat environment variable belum diisi. Jangan berpura-pura backend sudah tersambung.

Di akhir pekerjaan, laporkan:
- struktur file final;
- fitur yang sudah selesai;
- command untuk menjalankan dan build;
- environment variables yang harus diisi;
- langkah membuat project Supabase dan menjalankan SQL;
- langkah deploy ke Vercel;
- hasil pengujian yang benar-benar dijalankan dan bagian yang belum dapat diuji.
