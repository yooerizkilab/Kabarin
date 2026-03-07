# WhatsApp Gateway

Sistem WhatsApp Gateway (SaaS) full-stack yang dibangun menggunakan **Node.js, Fastify, Prisma, Baileys** (Backend) dan **Next.js, TailwindCSS** (Frontend).

## 📋 Prasyarat Sistem

Sebelum memulai instalasi, pastikan sistem Anda memiliki:

- Node.js (versi 20 atau lebih baru)
- MySQL / MariaDB (minimal versi 8.0)
- Git (jika ingin clone dari repositori)

---

## 🚀 Cara Instalasi (Jika Clone dari GitHub)

Ikuti langkah-langkah berikut jika Anda baru saja melakukan _clone_ project ini dari GitHub.

### 1. Clone Repositori

```bash
git clone <url-repositori-github>
cd whatsapp-gateway
```

### 2. Setup Database

Buat database baru di MySQL dengan nama `whatsapp_gateway` (atau nama lain sesuai keinginan Anda).

### 3. Instalasi Backend & Konfigurasi

```bash
cd backend

# Install semua dependensi
npm install

# Copass .env dan sesuaikan dengan database Anda
# (Pastikan MySQL sudah berjalan dan kredensialnya benar)
cp .env.example .env

# Jalankan migrasi database (Membuat tabel-tabel di MySQL)
npx prisma migrate dev --name init

# Generate Prisma Client (Wajib dijalankan setelah migrasi)
npx prisma generate

# Jalankan seeder (Untuk membuat akun Admin bawaan)
npm run prisma:seed
```

### 4. Instalasi Frontend & Konfigurasi

Buka terminal/tab baru dan masuk ke folder frontend.

```bash
cd frontend

# Install dependensi frontend
npm install

# Buat file env (untuk menyambungkan frontend ke backend)
cp .env.example .env.local
```

---

## ⚙️ Konfigurasi Environment (`.env`)

### Konfigurasi Backend (`backend/.env`)

Silakan sesuaikan isi file `.env` di dalam folder `backend`:

```env
# Koneksi Database (Ubah root & password sesuai lokal PC Anda)
DATABASE_URL="mysql://root:password@localhost:3306/whatsapp_gateway"

# Port berjalannya API Backend
PORT=3001

# Rahasia JWT (Ganti dengan string acak)
JWT_SECRET="rahasia_jwt_sangat_kuat_123"

# Lokasi penyimpanan sesi cache WhatsApp (Local Folder)
SESSION_DIR="./sessions"

# Interval worker untuk mengecek DB (MiliDetik)
WORKER_INTERVAL_MS=5000

# Jeda waktu pengiriman antar pesan untuk menghindari Banned (MiliDetik)
MESSAGE_DELAY_MS=3000

# URL Frontend (Untuk keamanan CORS)
FRONTEND_URL="http://localhost:3000"
```

### Konfigurasi Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

---

## ▶️ Cara Menjalankan Aplikasi

Aplikasi ini menggunakan sistem Queue terpisah, sehingga harus ada **3 proses yang berjalan bersamaan**. Buka **3 CMD/Terminal** yang berbeda:

**Terminal 1: Menjalankan Backend API Server**

```bash
cd backend
npm run dev
# Menjalankan server Fastify di http://localhost:3001
```

**Terminal 2: Menjalankan Background Worker (Untuk Blast Job)**

```bash
cd backend
npm run worker
# Worker ini bertugas memproses antrean pengiriman pesan blast di latar belakang.
# Wajib dijalankan jika ingin fitur "Blast" berfungsi.
```

**Terminal 3: Menjalankan Frontend (UI Dashboard)**

```bash
cd frontend
npm run dev
# Menjalankan UI Next.js di http://localhost:3000
```

---

## 📖 Cara Penggunaan & Login

1. Buka browser dan akses **`http://localhost:3000`**
2. Login menggunakan akun Seed bawaan:
   - **Email:** `admin@example.com`
   - **Password:** `admin123`
3. Masuk ke halaman **Devices** di menu sebelah kiri.
4. Klik **"+ Connect Device"** dan beri nama perangkat Anda.
5. Modal QR Code akan muncul. Scan QR tersebut menggunakan aplikasi WhatsApp di HP Anda (Pilih _Tautkan Perangkat / Linked Devices_).
6. Setelah status berubah menjadi **Connected**, Anda sudah bisa menggunakan seluruh fitur (kirim pesan satuan & blast).

---

## 📝 Format CSV (Untuk Import Kontak massal)

Saat menggunakan fitur Import Kontak, file harus berupa format `.csv` dengan header (baris pertama) persis seperti berikut: `name, phone, email`.
Aturan nomor telepon: Harus menyertakan kode negara tanpa spasi atau plus (contoh: 62812...).

```csv
name,phone,email
Budi Santoso,628123456789,budi@example.com
Andi,628987654321,
```

---

## 🔌 Dokumentasi Singkat API Terintegrasi

Backend REST API ini berjalan di prefix `/api/`. Seluruh API diamankan dengan mode Bearer Token JWT (kecuali `/api/auth/login`). Header yang harus dikirimkan:
`Authorization: Bearer <token_anda>`

### 1. Authentication

- **`POST /api/auth/login`**: Untuk mendapatkan token JWT.
  - Payload: `{ "email": "admin@example.com", "password": "..." }`
- **`GET /api/auth/me`**: Mendapatkan profil pengguna yang sedang login.

### 2. Devices (Perangkat WA)

- **`GET /api/devices`**: Menampilkan semua sesi perangkat.
- **`POST /api/devices`**: Mendaftarkan sesi perangkat baru untuk login.
- **`DELETE /api/devices/:id`**: Melakukan remote logout dan menghapus sesi di server.

### 3. Messaging (Pesan)

- **`POST /api/messages/send`**: Mengirim pesan Real-time (seperti HTTP API Whatsapp pada umumnya).
  - Payload: `{ "deviceId": "123", "to": "6281...", "type": "TEXT", "content": "Pesan Tes" }`
  - Mendukung `"type": "IMAGE" | "DOCUMENT"` dengan opsi parameter `"mediaUrl"`.
- **`GET /api/logs`**: Menampilkan riwayat pengiriman pesan beserta status (_PENDING, SENT, DELIVERED, READ, FAILED_).

### 4. Blast Campaign (Broadcast Massal)

- **`POST /api/blasts`**: Mendaftarkan jadwal blast massal kepada sekumpulan Kontak (Grup).
  - Payload akan langsung dimasukkan ke database Queue, dan akan otomatis dikerjakan oleh **Worker** (Terminal 2).

### 5. Websocket Server (Realtime)

Koneksi websocket berada di `ws://localhost:3001/ws`.
Digunakan oleh frontend untuk menerima update status device secara _Live_, kode QR, dan riwayat status pesan tanpa perlu melakukan manual refresh halaman.

---

## 🔮 Next Features / Roadmap (Ide Pengembangan Lanjutan)

Project ini dibangun dengan arsitektur skalabel sehingga sangat mudah untuk dikembangkan menjadi SaaS tingkat lanjut. Berikut adalah beberapa fitur potensial untuk pengembangan berikutnya:

1. **🤖 Auto-Responder / Chatbot Builder**
   Membuat fitur _keyword detection_ atau visual flow builder yang membalas pesan secara otomatis tanpa campur tangan admin.
2. **🔗 Webhook Management**
   Kemampuan meneruskan (_forward_) pesan yang masuk (Incoming Messages) ke server/aplikasi milik pengguna pihak ketiga secara _Real-time_.
3. **💳 SaaS Billing & Tiering Quota**
   Integrasi payment gateway (Midtrans/Stripe) beserta kuota pesan bulanan per user untuk memonetisasi platform secara B2B.
4. **💬 Shared Team Inbox (Live Chat CS)**
   UI khusus mirip WhatsApp Web yang memungkinkan Multi-Customer Service milik _User_ membalas chat secara manual dari satu nomor yang sama.
5. **🚀 Migrasi Queue ke Redis (BullMQ)**
   Mengganti sistem _Database-Queue_ bawaan saat ini dengan **Redis** Worker agar bisa diskalakan secara horizontal (menjalankan banyak instance Worker sekaligus).
6. **🖼️ Blast Media & Interactive Messages**
   Dukungan mengirim gambar, dokumen, atau pesan interaktif (Button/List - tergantung support WhatsApp API non-resmi) di fitur Blast Campaign.
7. **🏷️ Dynamic Contact Tags**
   Sistem penanda (Tagging) kontak yang dinamis (misal: "VIP", "Telah Follow Up") sebagai alternatif penyortiran selain menggunakan statik Contact Group.
