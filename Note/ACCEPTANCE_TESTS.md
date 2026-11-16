# Acceptance Tests — MeNote

Gunakan checklist ini sebelum menyatakan aplikasi siap dikumpulkan. Catat hasil nyata; jangan mengklaim tes yang belum dijalankan.

## A. Navigation and profile

- [ ] Navigation utama memiliki tepat tiga item dengan urutan Notes, Settings, About.
- [ ] Default navigation berada di bawah.
- [ ] Settings dapat mengubah posisi navigation menjadi Left dan Right.
- [ ] Posisi navigation tetap tersimpan setelah reload.
- [ ] About menampilkan `Hafiyyan Dimas Walana`.
- [ ] About menampilkan NIM `21120124140130`.
- [ ] About menampilkan Kelompok `18` dan Shift `03`.
- [ ] Detail note tidak muncul sebagai item navigation utama.

## B. Settings and visual

- [ ] Theme Ocean, Slate, dan Indigo dapat dipilih.
- [ ] Semua theme tetap dark/calm dengan teks terbaca.
- [ ] Theme tersimpan setelah reload.
- [ ] Layout usable pada lebar 360px, 390px, 768px, 1024px, dan 1440px.
- [ ] Tidak ada horizontal overflow.
- [ ] Hover, focus, pressed, disabled, loading, dan selected state terlihat.
- [ ] `prefers-reduced-motion` dihormati.

## C. Notes CRUD

- [ ] Create note baru dengan title, content, tags.
- [ ] Note muncul setelah save dan setelah reload.
- [ ] Read membuka detail lengkap dan seluruh isi teks.
- [ ] Update menyimpan perubahan title/content/tags.
- [ ] Delete meminta konfirmasi dan benar-benar menghapus note.
- [ ] Search menemukan berdasarkan title.
- [ ] Search menemukan berdasarkan content.
- [ ] Search menemukan berdasarkan tag.
- [ ] Pin/unpin bekerja dan persisten.
- [ ] Archive/unarchive bekerja dan persisten.
- [ ] Drag-and-drop reorder bekerja dengan mouse/touch dan urutannya persisten.
- [ ] Empty state dan no-results state memiliki CTA/aksi yang berguna.

## D. Images

- [ ] JPEG, PNG, dan WebP <= 5 MB dapat dipilih.
- [ ] Preview gambar terlihat sebelum save.
- [ ] Gambar berhasil diupload ke bucket private.
- [ ] Signed URL dapat menampilkan gambar pada sesi pemilik.
- [ ] Pengguna lain tidak dapat membaca gambar.
- [ ] Format tidak didukung ditolak.
- [ ] File > 5 MB ditolak dengan pesan jelas.
- [ ] Offline image blob tetap ada hingga upload berhasil.

## E. Supabase and RLS

- [ ] Anonymous auth session dibuat hanya bila belum ada sesi.
- [ ] Axios mengirim apikey dan access token user yang valid.
- [ ] User A dapat membuat dan membaca note sendiri.
- [ ] User B tidak dapat membaca note User A.
- [ ] User B tidak dapat mengubah/menghapus note User A.
- [ ] RLS tetap enabled.
- [ ] Tidak ada service_role key di bundle, source, atau repository.

## F. Offline and sync

- [ ] Setelah satu kali online load, app shell terbuka kembali saat offline.
- [ ] Catatan yang pernah dicache tampil saat offline.
- [ ] Create offline menunjukkan status Saved locally/Pending sync.
- [ ] Update offline tersimpan setelah reload.
- [ ] Delete offline tidak membuat note muncul kembali dari cache.
- [ ] Mutation queue tidak hilang saat request gagal.
- [ ] Setelah online kembali, antrean diproses.
- [ ] Retry tidak membuat duplikasi note.
- [ ] Status berubah menjadi Synced hanya setelah server mengonfirmasi.
- [ ] Sync now dapat memicu sinkronisasi manual.

## G. PWA and deployment

- [ ] Web app manifest valid.
- [ ] Icon 192px dan 512px tersedia; maskable bila memungkinkan.
- [ ] Service worker aktif pada production HTTPS.
- [ ] Install prompt ditampilkan hanya bila browser mendukungnya.
- [ ] Petunjuk manual Add to Home Screen tersedia.
- [ ] App dapat dibuka dalam standalone display setelah install.
- [ ] Update service worker tidak membuang draft yang belum tersimpan.
- [ ] `npm run build` berhasil.
- [ ] Route `/`, `/settings`, `/about`, dan `/notes/:id` tidak 404 saat refresh di Vercel.
- [ ] CRUD Supabase berhasil pada URL Vercel.

## H. Demo responsi yang disarankan

1. Buka MeNote dan tunjukkan tiga halaman.
2. Tunjukkan About beserta nama, NIM, kelompok, shift.
3. Buat note, tambahkan tag dan gambar.
4. Buka detail, edit, pin, archive, dan hapus satu note demo.
5. Cari note dan drag untuk mengubah urutan.
6. Ubah theme dan posisi nav, lalu refresh untuk menunjukkan persistence.
7. Matikan koneksi, buat/edit note dan tunjukkan status lokal.
8. Nyalakan koneksi dan tekan Sync now; tunjukkan status Synced.
9. Tunjukkan installability PWA pada browser/perangkat.
