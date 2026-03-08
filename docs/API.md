# Dokumentasi API & WebSocket

Bagian ini berisi referensi teknis untuk integrasi dengan API WhatsApp Gateway.

## 🔌 Keamanan & Autentikasi

Seluruh API (kecuali rute publik) diamankan menggunakan salah satu metode berikut:

1.  **Bearer Token JWT** (Direkomendasikan untuk Frontend):
    Header: `Authorization: Bearer <token_anda>`
2.  **API Key** (Direkomendasikan untuk Integrasi Script/Server):
    Header: `x-api-key: <api_key_anda>`

---

## ⏳ Rate Limiter (API Protection)

Untuk menjaga stabilitas server, kami menerapkan kebijakan Rate Limit:

- **Global**: Maksimal **100 request per menit** per User/IP.
- Melebihi batas akan menerima error `429 Too Many Requests`.
- Rute WebSocket (`/ws`) dan Health Check dikecualikan dari limit ini.

---

### 1. Authentication (`/api/v1/auth`)

- **`POST /register`**: Mendaftarkan akun baru.
- **`POST /login`**: Mendapatkan token JWT.
  - Payload: `{ "email": "...", "password": "..." }`
- **`GET /me`**: Mendapatkan profil pengguna yang sedang login.
- **`PUT /profile`**: Memperbarui profil (Nama, Email, dan Jam Kerja).
  - **Payload**:
    ```json
    {
      "name": "User Name",
      "email": "user@example.com",
      "workingHoursEnabled": true,
      "workingHoursStart": "09:00",
      "workingHoursEnd": "17:00",
      "timezone": "Asia/Jakarta"
    }
    ```
- **`PUT /profile/password`**: Mengganti password user.

---

### 2. Devices - Perangkat WA (`/api/v1/devices`)

- **`GET /`**: Menampilkan daftar semua sesi perangkat.
- **`POST /connect`**: Inisialisasi koneksi perangkat baru (QR Code).
- **`GET /:id/status`**: Cek status koneksi perangkat tertentu.
- **`DELETE /:id`**: Putus koneksi dan hapus sesi perangkat.

---

### 3. Messaging - Pesan (`/api/v1/messages`)

- **`POST /send`**: Mengirim pesan tunggal.
  - **Payload**:
    ```json
    {
      "deviceId": "...",
      "to": "6281...",
      "type": "TEXT",
      "content": "Halo!",
      "scheduledAt": "2026-03-08T10:00:00Z" // ISO 8601 (Opsional)
    }
    ```
  - Mendukung `"type": "IMAGE" | "DOCUMENT"` dengan parameter `mediaUrl`.
- **`GET /logs`**: Riwayat pengiriman pesan.
- **`POST /blast`**: Membuat kampanye broadcast masal.
- **`GET /blast`**: Daftar semua kampanye blast.
- **`GET /blast/:id`**: Detail status pekerjaan blast tertentu.

---

### 4. Contacts & Groups (`/api/v1/contacts`)

- **`GET /`**: Daftar semua kontak.
- **`POST /`**: Tambah kontak baru.
- **`PUT /:id`**: Update data kontak.
- **`DELETE /:id`**: Hapus kontak.
- **`POST /import`**: Impor kontak dari CSV.
- **`GET /groups`**: Daftar grup kontak.
- **`POST /groups`**: Buat grup kontak baru.

---

### Tags / Segments (`/api/v1/tags`)

Manage contact segments with custom colors.

- **GET `/`**: List all tags.
- **POST `/`**: Create a new tag.
  - Body: `{ "name": "VIP", "color": "#ff0000" }`
- **PUT `/:id`**: Update a tag.
- **DELETE `/:id`**: Delete a tag.

---

### Media (`/api/v1/media`)

- `GET /` - List media items
- `POST /` - Upload media
- `DELETE /:id` - Delete media

---

### Agents (`/api/v1/agents`)

- `GET /` - List team members
- `POST /` - Create agent
- `PUT /:id` - Update agent
- `DELETE /:id` - Delete agent

---

### 5. Analytics Dashboard (`/api/v1/analytics`)

Statistik performa pesan dan kampanye.

- **`GET /summary`**: Angka statistik umum (Total Sent, Pending, Failed, Success Rate).
- **`GET /chart`**: Data volume pesan harian untuk grafik.
- **`GET /blasts`**: Statistik performa kampanye blast terbaru.

---

### 6. Media Library & Storage (`/api/v1/media`)

Penyimpanan aset media internal.

- **`GET /`**: Daftar semua file yang diunggah.
- **`POST /upload`**: Mengunggah file baru (Multipart).
- **`DELETE /:id`**: Menghapus file dari library.

---

### 7. Templates (`/api/v1/templates`)

- **`GET /`**: Daftar template pesan.
- **`POST /`**: Buat template baru.
- **`PUT /:id`**: Update template.
- **`DELETE /:id`**: Hapus template.

---

### 8. Auto Responder (`/api/v1/auto-responder`)

- **`GET /`**: Daftar auto-responder.
- **`POST /`**: Buat auto-responder baru.
- **`GET /:id`**: Detail auto-responder.
- **`PUT /:id`**: Update auto-responder.
- **`DELETE /:id`**: Hapus auto-responder.
- **`POST /:id/rules`**: Tambah aturan (_rule_) pada auto-responder.

---

### 9. Webhooks (`/api/v1/webhooks`)

- **`GET /`**: Daftar webhook terdaftar.
- **`POST /`**: Daftarkan URL webhook baru.
- **`PUT /:id`**: Update konfigurasi webhook.
- **`DELETE /:id`**: Hapus webhook.

---

### 10. Billing & Plans (`/api/v1/billing`)

- **`GET /plans`** (Publik): Daftar paket langganan yang tersedia.
- **`POST /webhook`** (Publik): Endpoint untuk notifikasi Midtrans.
- **`POST /checkout`**: Inisialisasi pembayaran (Midtrans SNAP).
- **`GET /me`**: Status tagihan dan kuota pengguna saat ini.

---

### 11. Chats (`/api/v1/chats`)

- **`GET /`**: Daftar percakapan aktif.
- **`GET /history`**: Riwayat pesan dalam percakapan tertentu.

---

### 12. Admin Management (`/api/v1/admin`)

_Hanya dapat diakses oleh pengguna dengan role Admin._

- **Plans**: `GET`, `POST`, `PUT`, `DELETE` pada `/plans`.
- **Users**: `GET /users` (Daftar user), `PUT /users/:id/subscription` (Update manual langganan user).

---

## 📡 WebSocket Server (Real-time Updates)

Koneksi tersedia di: `ws://localhost:3001/ws`

Digunakan untuk sinkronisasi live:

- Status koneksi perangkat (QR Code, Connected, Disconnected).
- Status pengiriman pesan (Sent, Delivered, Read).
- Notifikasi sistem lainnya.
