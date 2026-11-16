# Technical Architecture

## 1. High-level architecture

```text
React UI (Pages / Components)
        |
        +--> React Hooks (loading, errors, selected note, filters)
        |
        +--> Note Repository
        |       +--> IndexedDB (Dexie: cache, blobs, mutation queue)
        |       +--> Axios REST Services --> Supabase PostgREST
        |                                      |
        |                                      +--> PostgreSQL + RLS
        |                                      +--> Supabase Storage
        |
        +--> Supabase Auth client (anonymous session)
        |
        +--> localStorage (theme + navigation preferences)

Vite build --> vite-plugin-pwa / Workbox --> installable app shell
Vercel HTTPS --> production hosting + SPA fallback
```

## 2. Data ownership and identity

MeNote tidak membutuhkan halaman login. Pada first launch, gunakan Supabase Auth anonymous sign-in. Sesi anonymous disimpan oleh Supabase client dan dipakai untuk memperoleh `access_token`. Semua row notes dimiliki oleh `auth.uid()`.

Catatan yang dibuat dari browser/perangkat yang berbeda akan berada pada anonymous user berbeda. Hal ini disengaja agar tugas tetap tanpa login UI. Jangan menjanjikan sinkron lintas perangkat atau pemulihan akun tanpa menambahkan sistem akun yang memang belum diminta.

## 3. Note data model

Database row `public.notes`:

```ts
type Note = {
  id: string;              // UUID, dibuat client agar offline-create bisa retry
  user_id: string;         // auth.uid()
  title: string;
  content: string;
  tags: string[];
  image_paths: string[];   // object paths pada bucket note-images
  is_pinned: boolean;
  is_archived: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};
```

IndexedDB menambahkan metadata lokal (jangan kirim field ini sebagai kolom Supabase):

```ts
type LocalNoteMeta = {
  syncStatus: 'synced' | 'pending' | 'error';
  lastSyncedAt?: string;
  localOnlyImageIds?: string[];
};
```

## 4. Supabase integration

### Auth

Gunakan `@supabase/supabase-js` untuk:

- inisialisasi client dari env;
- `auth.getSession()`;
- `auth.signInAnonymously()` jika belum ada sesi;
- `auth.onAuthStateChange()` untuk perubahan sesi.

Jangan memanggil `signInAnonymously()` berulang kali bila sesi valid sudah ada.

### Axios REST client

Gunakan `axios.create()` dengan baseURL `${VITE_SUPABASE_URL}/rest/v1` dan timeout wajar. Request interceptor harus memperoleh session access token dan memasang:

- `apikey: <publishable/anon key>`
- `Authorization: Bearer <session.access_token>`
- `Content-Type: application/json`

Response interceptor boleh menormalisasi error, tetapi jangan menghapus status code atau detail yang membantu diagnosis. Tangani 401/403, 404, timeout, network offline, dan response validation.

Jangan mengirim `service_role` key ke browser. Publishable/anon key saja bukan pengganti RLS.

### REST mapping

- List: `GET /notes?select=*&order=is_pinned.desc,sort_order.asc,updated_at.desc`
- Create/upsert: `POST /notes?on_conflict=id` dengan `Prefer: resolution=merge-duplicates,return=representation`.
- Update: `PATCH /notes?id=eq.<uuid>` dengan `Prefer: return=representation`.
- Delete: `DELETE /notes?id=eq.<uuid>`.

Buat query params menggunakan Axios `params` atau helper yang aman; jangan menyusun input user mentah menjadi URL query tanpa encoding. Filter owner tetap ditegakkan RLS.

## 5. Image storage

- Bucket: `note-images` (private).
- Object path: `<user_id>/<note_id>/<random-file-name>.<ext>`.
- Upload hanya format JPEG/PNG/WebP dan maksimum 5 MB per image.
- RLS Storage policy memastikan folder pertama sama dengan `auth.uid()`.
- Simpan hanya object path di kolom `image_paths`, bukan signed URL yang cepat kedaluwarsa.
- Untuk preview remote, generate signed URL; untuk image offline gunakan Blob lokal di IndexedDB.
- Hapus remote image hanya setelah operasi note update/delete berhasil atau antrekan delete sudah diproses dengan aman.

## 6. Offline-first approach

### Storage responsibilities

| Storage | Isi | Tujuan |
|---|---|---|
| localStorage | theme, nav position, preferensi kecil | UI settings yang ringan |
| IndexedDB (`Dexie`) | cached notes, image blobs, mutation queue | data terstruktur dan operasi offline |
| Supabase DB | notes canonical | persistence server |
| Supabase Storage | image objects | persistence gambar server |
| Service worker cache | app shell, JS/CSS, fonts, icons | membuka aplikasi ketika offline |

### Read strategy

1. Tampilkan IndexedDB cache sesegera mungkin bila ada.
2. Jika online, fetch server melalui Axios.
3. Simpan response server ke IndexedDB.
4. Jika request gagal, pertahankan cache dan tampilkan offline/error indicator.
5. Jangan menghapus catatan lokal hanya karena fetch server gagal.

### Write strategy

- Online: simpan perubahan lokal terlebih dahulu (optimistic/persisted local), masukkan mutation queue, lalu kirim ke server. Setelah server mengonfirmasi, ubah status menjadi `synced` dan hapus mutation terkait.
- Offline: simpan perubahan lokal dan mutation queue, tandai `pending`, tampilkan `Saved on this device`.
- Retry gagal: pertahankan mutation, tandai `error` atau tetap pending dengan error message, dan sediakan retry.
- Gunakan UUID client untuk ID note dan upsert by ID agar retry create tidak menggandakan row.

### Queue design

Gunakan satu mutation terbaru per `noteId`, atau coalesce operasi secara deterministik:

- create kemudian update sebelum sync: kirim satu upsert dengan data terbaru;
- create lalu delete sebelum pernah sync: hapus cache dan batalkan mutation upsert;
- update berulang: simpan payload terbaru;
- delete note tersinkron: kirim delete dan pertahankan local tombstone sampai server mengonfirmasi.

Jalankan sync pada app startup, event `online`, tab `visibilitychange` ketika kembali aktif, dan tombol `Sync now`. Proses satu per satu untuk menghindari race. Tambahkan retry/backoff sederhana. Jangan mengandalkan Background Sync API sebagai satu-satunya mekanisme.

### Image synchronization

Blob yang dipilih ketika offline disimpan di IndexedDB. Saat sync:

1. Upsert note dasar agar note ID tersedia.
2. Upload image blobs ke Storage.
3. Update `image_paths` pada note.
4. Tandai image lokal sebagai synced dan bersihkan blob lokal hanya setelah remote object terkonfirmasi.

Jangan menghapus blob lokal sebelum upload sukses.

### Conflict policy

Untuk scope responsi, gunakan last-write-wins berdasarkan `updated_at` dan tampilkan status sync. Dokumentasikan bahwa edit bersamaan dari dua browser anonymous yang berbeda tidak akan digabung. Jangan membangun conflict-resolution UI kompleks yang tidak diperlukan.

## 7. PWA / Workbox

Gunakan `vite-plugin-pwa` dengan konfigurasi yang sesuai:

- manifest: `name`, `short_name`, `description`, `start_url`, `scope`, `display: standalone`, `theme_color`, `background_color`, icon 192/512, maskable icon bila ada;
- service worker aktif pada production build;
- precache app shell, built JS/CSS, fonts lokal, dan icon;
- navigation fallback ke `index.html` agar SPA tetap bisa dibuka offline;
- runtime cache boleh digunakan untuk aset publik statis yang aman;
- jangan cache POST/PATCH/DELETE atau response Supabase pribadi di Workbox.

Gunakan prompt update yang aman: beri tahu user ketika versi baru tersedia dan minta reload, jangan memutus edit yang belum tersimpan.

PWA harus diuji di HTTPS production. Development server tidak selalu menunjukkan perilaku install/service worker yang sama dengan production.

## 8. Navigation and settings persistence

Simpan preferensi menggunakan key berversi, misalnya `menote.settings.v1`:

```json
{
  "theme": "ocean",
  "navPosition": "bottom"
}
```

Validasi nilai saat membaca storage dan gunakan default bila JSON rusak atau value tidak dikenal. Theme provider menerapkan CSS variables pada root. Navigation layout membaca `navPosition` dari satu settings state.

## 9. React structure and state

- Router memetakan `/` ke Notes, `/settings` ke Settings, `/about` ke About, `/notes/:id` ke detail note, dan `/notes/new` ke editor.
- `AppShell` memiliki header/content/navigation.
- `NotesPage` mengorkestrasi search/filter/grid.
- `NoteCard` hanya presentasi dan event sederhana.
- `NoteEditor` mengelola form create/edit.
- Hooks berkomunikasi dengan repository/services; pages jangan mengandung URL endpoint Supabase.
- Services menangani API dan normalisasi error.
- Offline repository menangani cache dan mutation queue.

## 10. Vercel

- Build command: `npm run build`.
- Output directory: `dist`.
- Framework preset: Vite.
- Set `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` pada Project Settings > Environment Variables.
- Tambahkan SPA rewrite ke `index.html` jika diperlukan agar direct route `/notes/:id`, `/settings`, dan `/about` tidak 404.
- Deploy dari branch utama GitHub.
- Setelah deploy, test installability, service worker, offline behavior, dan CRUD pada URL HTTPS production.
