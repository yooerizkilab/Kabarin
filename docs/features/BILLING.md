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

## Manajemen Admin

Pengguna dengan role `ADMIN` memiliki otoritas penuh atas sistem billing dan tidak terikat oleh batasan paket langganan standar.

### Fitur Khusus Admin

- **Unlimited Quota**: Admin secara otomatis melewati (_bypass_) semua pengecekan kuota pesan. Setiap pesan yang dikirim oleh Admin tidak akan mengurangi kuota dan tidak akan diblokir meskipun mencapai limit tertentu.
- **Subscription Management**: Admin dapat mengelola definisi `SubscriptionPlan` langsung melalui database atau interface admin (jika tersedia), termasuk mengubah harga, batas perangkat, dan batas pesan bulanan.
- **User Plan Overrides**: Admin memiliki kemampuan untuk mengubah paket langganan atau status langganan User lain secara manual untuk keperluan kustomisasi atau kompensasi.
- **Hidden Billing Menu**: Di sisi frontend, menu Billing disembunyikan untuk user Admin karena mereka tidak memerlukan proses checkout atau pembayaran untuk menggunakan fitur platform.

## Keamanan Transaksi

Setiap transaksi yang terjadi dicatat dengan detail referensi dari Midtrans, memungkinkan Admin untuk melakukan audit jika terjadi perselisihan pembayaran atau kegagalan aktivasi otomatis.
