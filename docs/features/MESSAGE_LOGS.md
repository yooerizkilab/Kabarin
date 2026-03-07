# Message Logs

Fitur Message Logs memberikan visibilitas penuh terhadap semua aktivitas pengiriman pesan yang dilakukan melalui platform.

## Fitur Utama

- **Centralized Logs**: Satu tempat untuk melihat semua pesan masuk dan keluar dari semua perangkat.
- **Detailed History**: Melihat waktu pengiriman, isi pesan, nomor tujuan, dan status terakhir.
- **Status Events**: Menelusuri perjalanan pesan dari `PENDING` -> `SENT` -> `DELIVERED` -> `READ`.
- **Filtering**: Mencari log berdasarkan status (Success/Failed) atau perangkat tertentu.

## Struktur Database

Model Prisma yang terlibat:

- `Message`: Data utama pesan.
- `MessageLog`: Catatan setiap event teknis yang terjadi pada pesan terkait.

## Alur Pencatatan (`messageRepository.ts`)

1. Saat pesan pertama kali dibuat, log `PENDING` dicatat.
2. Sesaat setelah dikirim ke WhatsApp, status berubah jadi `SENT` dan log waktu kirim ditambahkan.
3. Melalui mekanisme Webhook Baileys (`messages.update`), backend menerima konfirmasi pengiriman:
   - Jika centang dua: Log `DELIVERED` ditambahkan.
   - Jika centang biru: Log `READ` ditambahkan.
   - Jika centang satu dalam waktu lama atau gagal: Status berubah jadi `FAILED` disertai alasan error.

## Kegunaan untuk Debugging

Jika ada pesan yang tidak sampai ke pelanggan, Admin dapat mengecek tabel `MessageLog` untuk melihat alasan kegagalan (misal: "Nomor tidak terdaftar", "Device terputus", atau "Token kadaluarsa").
