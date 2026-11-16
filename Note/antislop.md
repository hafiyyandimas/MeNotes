# antislop.md — Anti-Slop & Quality Rules

Tujuan dokumen ini adalah mencegah hasil coding yang terlihat bagus di screenshot tetapi dangkal, tidak konsisten, atau tidak benar-benar berfungsi.

## 1. Larangan fungsional

- Jangan membuat tombol dekoratif yang tidak melakukan apa pun.
- Jangan membuat CRUD palsu yang hanya mengubah React state tanpa menyimpan ke Supabase/IndexedDB.
- Jangan memakai array dummy sebagai sumber utama setelah backend diaktifkan.
- Jangan menampilkan toast "Saved" sebelum data benar-benar tersimpan ke server atau cache lokal yang sesuai. Bedakan status `Saved locally` dan `Synced`.
- Jangan membuat fungsi delete yang hanya menghilangkan card dari layar.
- Jangan membuat pencarian, filter, pin, archive, atau drag-and-drop yang hanya kosmetik.
- Jangan membuat halaman kedua/ketiga sebagai placeholder.
- Jangan menaruh informasi About di halaman keempat.
- Jangan menambah tab navigasi utama selain Notes, Settings, About.
- Jangan mengklaim offline penuh jika hanya app shell yang tersimpan.

## 2. Larangan visual

- Jangan memakai template dashboard generik yang penuh gradient, glassmorphism, glow, dan card berlebihan.
- Jangan memakai warna hitam murni sebagai seluruh background.
- Jangan mengubah arah desain menjadi ungu neon, cyberpunk, atau warna mencolok.
- Jangan memakai terlalu banyak radius/pill sehingga semua elemen terlihat sama.
- Jangan membuat setiap card punya warna acak.
- Jangan memakai emoji sebagai pengganti ikon UI; gunakan Lucide.
- Jangan menggunakan lorem ipsum atau teks placeholder di hasil akhir.
- Jangan membuat teks terlalu kecil atau kontras rendah demi estetika.
- Jangan membuat desktop dan mobile hanya berbeda ukuran tanpa memperbaiki layout.
- Jangan membuat animasi panjang, memantul berlebihan, atau menghambat interaksi.

## 3. Arah visual wajib

- Dark-first, calm blue, soft contrast, low visual noise.
- Gunakan dark navy/slate, bukan pure black.
- Gunakan satu warna aksen utama yang lembut dan konsisten.
- Card punya border/subtle surface separation; shadow hanya bila membantu hierarki.
- Gunakan spacing konsisten dan grid yang rapi.
- Tampilkan hierarchy: page title > section title > note title > preview/meta.
- Hover, pressed, focus, disabled, loading, dan selected state harus dirancang.
- Sediakan empty state yang membantu pengguna memulai, bukan ilustrasi kosong tanpa CTA.
- Responsive dari lebar 360px hingga desktop lebar.

## 4. Kualitas data dan keamanan

- Jangan pernah memakai Supabase service role key pada client.
- Jangan mematikan RLS.
- Jangan menyimpan gambar base64 besar di localStorage.
- Jangan mengandalkan cache service worker untuk data pribadi authenticated.
- Jangan menghapus mutation queue ketika request gagal.
- Jangan menimpa cache lokal dengan response server yang lebih lama tanpa strategi yang jelas.
- Jangan menganggap navigator.onLine selalu menjamin API dapat dijangkau; tetap tangani kegagalan request.
- Jangan menyisipkan HTML mentah dari catatan pengguna ke DOM tanpa sanitasi.
- Jangan membuat fallback error menghilangkan data pengguna.

## 5. Kualitas kode

- Hindari satu file `App.jsx` raksasa.
- Hindari duplikasi komponen untuk card, modal, toast, dan form.
- Hindari nested ternary yang sulit dibaca.
- Hindari `any`-style data shape tidak konsisten; dokumentasikan model `Note` dan status sinkronisasi.
- Hindari hard-coded magic values yang berulang; gunakan tokens/constants.
- Bersihkan event listeners, object URLs, timers, dan subscriptions pada unmount.
- Gunakan stable keys pada list.
- Hindari update state dari async request yang sudah obsolete/unmounted.
- Jangan menutupi warning/error dengan catch kosong.
- Jangan mengabaikan lint/build errors.

## 6. Motion dan interaksi

- Animasi harus memberi feedback: open/close editor, detail note, toast, reorder, tab/page transition.
- Durasi umumnya singkat (sekitar 150–250ms), easing natural.
- Drag harus tetap bisa dipakai dengan touch dan keyboard.
- Hindari konflik antara drag gesture dan card click. Sediakan drag handle atau aturan activation yang jelas.
- Hormati `prefers-reduced-motion`.
- Semua interaksi penting harus memiliki focus state dan keyboard equivalent.

## 7. Bukti sebelum menyebut selesai

Sebelum menyatakan proyek selesai, periksa secara nyata:

- `npm run build` berhasil.
- Create/read/update/delete berhasil terhadap Supabase dengan RLS aktif.
- Reload tidak menghilangkan notes yang sudah tersinkron.
- Offline create/edit/delete tercatat di IndexedDB dan statusnya jujur.
- Online kembali memproses antrean tanpa membuat duplikasi.
- File gambar valid bisa diunggah dan file invalid/terlalu besar ditolak dengan pesan yang jelas.
- Navigation setting dan theme bertahan setelah reload.
- Route detail bisa dibuka langsung setelah refresh di Vercel.
- PWA manifest dan service worker aktif di production HTTPS.
- App shell dan catatan cache dapat dibuka setelah offline.

Jika ada yang belum diuji, sebutkan sebagai belum diuji. Jangan mengarang hasil pengujian.
