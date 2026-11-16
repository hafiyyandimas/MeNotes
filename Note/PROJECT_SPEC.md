# MeNote — Product & UI Specification

## 1. Product concept

MeNote adalah personal notes workspace yang tenang dan rapi. Aplikasi harus terasa seperti aplikasi produktivitas yang matang, bukan halaman admin atau formulir CRUD. Referensi UI dari pemilik proyek menjadi inspirasi komposisi layout dan kejelasan hierarchy; jangan menyalin warna dari referensi tersebut. Gunakan dark navy + calm blue sesuai arahan.

Tagline: **Your thoughts, beautifully organized.**

## 2. Navigation contract

Urutan navigation utama:

| Urutan | Halaman | Tujuan |
|---:|---|---|
| 1 | Notes | Halaman utama dan fitur CRUD |
| 2 | Settings | Pengaturan aplikasi |
| 3 | About | Profil praktikan |

- Default `navPosition = bottom`.
- Pilihan lain: `left` dan `right`.
- Navigation item selalu dalam urutan yang sama pada semua posisi.
- Detail note adalah child view dari Notes (`/notes/:id`) dan tidak menambah navigation item.
- Pada bottom mode, buat dock horizontal yang tidak menutupi konten dan menghormati safe-area mobile.
- Pada left/right mode, buat side rail yang responsif. Di desktop dapat menjadi sidebar yang lebih lebar; di layar kecil gunakan rail vertikal yang ringkas dan pastikan konten tetap usable.

## 3. Design system

### Mood

Dark-first, calm, minimal, premium, readable. Tidak pure black, tidak neon, tidak terlalu ramai.

### Starting color tokens

Gunakan CSS variables agar theme bisa berganti tanpa hard-coded warna di tiap komponen.

```css
:root {
  --color-bg: #0B1422;
  --color-surface: #111E2E;
  --color-surface-raised: #17283B;
  --color-surface-hover: #1D3249;
  --color-border: rgba(167, 195, 222, 0.13);
  --color-text: #E7EEF7;
  --color-text-muted: #9AADC2;
  --color-accent: #8BBCE8;
  --color-accent-strong: #A9D0F2;
  --color-danger: #E58B91;
  --radius-card: 18px;
  --radius-control: 12px;
}
```

Theme presets yang boleh dipilih di Settings (semuanya tetap dark/calm):

- `ocean` — default; navy background + soft blue accent.
- `slate` — charcoal/slate blue + muted ice-blue accent.
- `indigo` — deep blue-violet navy + muted periwinkle accent.

Jangan tambahkan light mode kecuali pemilik proyek memintanya. Seluruh theme harus memenuhi kontras teks yang layak.

### Typography and iconography

- Manrope atau Inter.
- Judul kuat tetapi tidak oversized.
- Body nyaman dibaca; metadata lebih kecil tetapi tetap terbaca.
- Gunakan Lucide React, stroke konsisten.
- Avatar About boleh berupa inisial `HW`; jangan membuat foto orang fiktif.

### Motion

Gunakan transisi singkat pada card hover/press, page change, editor/modal open-close, toast, selected navigation, dan drag reorder. Drag-and-drop harus mempunyai drag handle yang jelas. Hormati `prefers-reduced-motion`.

## 4. Page 1 — Notes

### Purpose

Tempat pengguna melihat dan mengelola catatan pribadi. Ini adalah halaman CRUD utama dan prioritas tertinggi.

### Desktop layout

- Header area dengan logo wordmark `MeNote`, sapaan/heading seperti `Your notes`, dan tombol `New note`.
- Search input yang jelas.
- Toolbar filter sederhana: `All`, `Pinned`, `Archived`.
- Grid notes responsif (2–3 kolom pada desktop sesuai lebar; jangan paksa grid jika card menjadi sempit).
- Metadata jumlah notes atau sync status boleh ada tetapi tidak mendominasi.

### Mobile layout

- Header ringkas.
- Search full-width.
- Filter horizontal yang dapat di-scroll bila perlu.
- Notes menjadi satu kolom atau grid dua kolom hanya jika lebar cukup.
- Floating action button `New note` boleh digunakan, tetapi tidak boleh menutupi bottom navigation.

### Note card

Setiap card minimal menampilkan:

- Judul note.
- Cuplikan isi yang dipotong secukupnya.
- Tanggal/waktu terakhir diperbarui.
- Tag chips bila tersedia.
- Thumbnail bila ada gambar.
- Indikator pin bila pinned.
- Indikator status lokal/sinkronisasi bila diperlukan, ringkas dan jelas.

Card dapat ditekan untuk membuka detail note. Jangan memaksa semua card memiliki warna berbeda. Gunakan satu surface style dan aksen secukupnya.

### CRUD and note editor

Create:
- Tombol `New note` membuka editor melalui route, modal besar, atau sheet yang nyaman.
- Field title (wajib secara UI; jika kosong saat penyimpanan, gunakan validasi dan jangan membuat note tanpa judul yang tidak disengaja).
- Field content (teks multiline; line break dipertahankan).
- Input tags sederhana (pisahkan dengan Enter atau koma, cegah tag kosong/duplikat).
- Tambah gambar dari file picker.
- Save dan Cancel.

Read:
- Menekan card membuka detail note berisi title, seluruh content, gambar, tags, waktu dibuat/diubah.
- Tersedia tombol Edit, Pin/Unpin, Archive/Unarchive, Delete.

Update:
- Editor memuat data note sebelumnya.
- Save perubahan ke database/local cache.
- `updated_at` berubah.

Delete:
- Memerlukan confirmation dialog.
- Hapus data note dan gambar terkait sesuai urutan aman.
- Bila offline, catat operasi delete pada mutation queue.

### Image handling

- Format: JPEG, PNG, WebP.
- Maksimum 5 MB per gambar.
- Tampilkan preview sebelum disimpan.
- Sediakan remove image sebelum save.
- File offline disimpan sebagai Blob pada IndexedDB, bukan base64 besar di localStorage.
- Saat online, upload ke bucket private `note-images`; simpan path object pada `image_paths`.
- Tampilkan error yang jelas untuk format/ukuran yang tidak didukung.

### Search and organization

- Search minimal mencocokkan title, content, dan tags (case-insensitive).
- Filter `All`, `Pinned`, `Archived` berfungsi.
- Pinned note dapat tampil lebih dahulu pada All, tetapi drag ordering tetap masuk akal.
- Archive tidak berarti delete; archived notes dapat dilihat melalui filter dan dikembalikan.
- Drag-and-drop mengubah `sort_order` secara persisten. Sediakan drag handle agar card click tidak konflik dengan drag gesture. Keyboard interaction juga harus tersedia.

### Empty/loading/error state

- Empty state awal: ajak membuat catatan pertama dan berikan CTA.
- Search kosong: jelaskan tidak ada hasil dan tawarkan clear search.
- Loading: skeleton yang ukurannya menyerupai card.
- Backend error: tampilkan pesan dan retry; data cache lokal tetap ditampilkan bila tersedia.

## 5. Page 2 — Settings

Settings adalah halaman navigasi kedua. Kelompokkan pengaturan dalam section yang sederhana.

### Appearance

- Theme selector: Ocean, Slate, Indigo.
- Perubahan langsung terlihat (live preview).
- Simpan di localStorage.
- Semua preset tetap dark navy/calm blue.

### Navigation

- Pilihan: Bottom, Left, Right.
- Gunakan segmented control/radio cards dengan preview kecil bila membantu.
- Perubahan langsung diterapkan tanpa reload.
- Simpan di localStorage.

### PWA / app status

- Tampilkan status online/offline.
- Tampilkan status install bila dapat dideteksi.
- Tombol Install hanya muncul/aktif bila browser menyediakan install prompt.
- Bila install prompt tidak tersedia, tampilkan panduan singkat Add to Home Screen (khususnya iOS/Safari).
- Tampilkan versi aplikasi dari `package.json` bila mudah diinjeksikan saat build.
- Tombol `Sync now` untuk mencoba memproses antrean offline.

Jangan menambah pengaturan yang tidak memiliki kebutuhan nyata.

## 6. Page 3 — About

About adalah halaman navigasi ketiga dan profil praktikan. Tampilkan dalam satu profile card yang rapi.

Informasi wajib:

| Field | Value |
|---|---|
| Nama | Hafiyyan Dimas Walana |
| NIM | 21120124140130 |
| Kelompok | 18 |
| Shift | 03 |

- Avatar inisial `HW`.
- Nama menjadi fokus utama.
- NIM, kelompok, dan shift ditata sebagai informasi identitas yang mudah dibaca.
- Boleh ada section `About Me`/`About this app` singkat yang menjelaskan MeNote sebagai project PWA responsi, tanpa membuat klaim personal tambahan.
- Sediakan tombol copy NIM sebagai interaksi tambahan bila sederhana.

## 7. Responsive behavior

Uji setidaknya pada lebar 360px, 390px, 768px, 1024px, dan 1440px.

- Tidak boleh ada horizontal overflow pada body.
- Bottom dock harus menghormati `env(safe-area-inset-bottom)`.
- Side rail/side bar tidak boleh menutupi konten.
- Dialog/editor harus dapat discroll di layar pendek.
- Tombol dan input harus memiliki touch target memadai.
- Note card tetap nyaman dibaca pada mobile.

## 8. Accessibility

- Semantic landmarks dan headings berurutan.
- Input mempunyai label.
- Icon-only button punya aria-label.
- Keyboard focus jelas.
- Dialog mengelola focus dan Escape.
- Drag reorder punya dukungan keyboard atau mekanisme alternatif.
- Jangan mengandalkan warna saja untuk menunjukkan status.
