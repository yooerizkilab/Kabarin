# 🚀 Panduan Instalasi

Ikuti langkah-langkah di bawah ini untuk menyiapkan WhatsApp Gateway di mesin lokal atau server Anda.

## 📋 Prasyarat

Pastikan perangkat Anda sudah terpasang:
- **Node.js**: v20.x atau lebih baru.
- **MySQL/MariaDB**: v8.0+ atau v10.4+.
- **Git**: Untuk manajemen versi.
- **OS**: Windows, macOS, atau Linux (Ubuntu/Debian direkomendasikan).

---

## 🛠️ Langkah-Langkah Instalasi

### 1. Persiapan Repositori
Clone repositori dan masuk ke direktori utama:
```bash
git clone <url-repositori>
cd whatsapp-gateway
```

### 2. Konfigurasi Backend
Masuk ke folder backend dan instal dependensi:
```bash
cd backend
npm install
```

Salin file contoh environment dan sesuaikan:
```bash
cp .env.example .env
```
> [!NOTE] 
> Edit `.env` dan pastikan `DATABASE_URL` sesuai dengan kredensial MySQL Anda (User, Password, Host, Port, dan Nama Database).

### 3. Inisialisasi Database
Jalankan perintah berikut untuk membuat skema tabel dan data awal:
```bash
# Membuat tabel baru
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Mengisi data awal (Admin & Plans)
npm run prisma:seed
```

### 4. Konfigurasi Frontend
Buka terminal baru, masuk ke folder frontend, dan instal dependensi:
```bash
cd frontend
npm install
cp .env.example .env.local
```

---

## 🏗️ Menjalankan Aplikasi

Pastikan MySQL Anda sudah aktif, lalu jalankan perintah berikut:

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

Akses aplikasi di: `http://localhost:3000`

---

## ❓ Masalah Umum (Troubleshooting)

- **EPERM / File Locked**: Pastikan server backend sedang tidak berjalan saat menjalankan `npx prisma generate`.
- **MySQL Connection Error**: Pastikan user MySQL memiliki hak akses penuh ke database `whatsapp_gateway`.
- **QR Code tidak muncul**: Periksa log backend, pastikan folder `./sessions` memiliki izin tulis (write permission).

---

[🏠 Kembali ke Home](README.md) | [⚙️ Lanjut ke Konfigurasi](CONFIGURATION.md)
