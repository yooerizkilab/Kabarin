# Billing & Subscription

Fitur Billing mengelola monetisasi platform melalui paket langganan (Plans) dan integrasi gerbang pembayaran (Payment Gateway).

## Fitur Utama

- **Subscription Plans**: Pilihan paket dengan batasan berbeda (Jumlah Device, Kuota Pesan).
- **Payment Gateway Integration**: Pembayaran otomatis menggunakan **Midtrans**.
- **Quota Management**: Membatasi penggunaan fitur berdasarkan paket yang aktif.
- **Transaction History**: Riwayat transaksi pembayaran yang transparan.

## Struktur Database

Model Prisma yang terlibat:

- `SubscriptionPlan`: Daftar paket langganan yang tersedia (Free, Pro, Business).
- `PaymentTransaction`: Log transaksi pembayaran (Status: PENDING, PAID, FAILED).
- `User`: Menyimpan status langganan saat ini dan tanggal kadaluarsa.

## Alur Pembayaran (`billingController.ts`)

1. **Checkout**: User memilih paket. Sistem membuat `PaymentTransaction` dan memanggil API Midtrans Snap untuk mendapatkan token pembayaran.
2. **Payment**: User melakukan pembayaran via UI Midtrans (E-wallet, Bank Transfer, dll).
3. **Notification (Webhook)**:
   - Midtrans mengirimkan notifikasi balik ke server backend kita (`/api/billing/webhook`).
   - Sistem memverifikasi validitas notifikasi.
   - Jika pembayaran berhasil (`settlement`), status transaksi diperbarui menjadi `PAID`.
   - Status langganan User diaktifkan dan kuota pesan diperbarui.

## Limitasi Kuota

Setiap kali User mengirim pesan (Blast atau Single Send), sistem akan mengecek:

1. Apakah status langganan `ACTIVE`.
2. Apakah `messagesSentThisMonth` belum melebihi limit paket di `SubscriptionPlan`.
   Jika tidak memenuhi syarat, pengiriman akan diblokir hingga paket diperbarui atau kuota di-reset di bulan berikutnya.
