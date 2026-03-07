# Single Send Message

Fitur Send Message digunakan untuk pengiriman pesan instan ke satu tujuan secara manual melalui dashboard, mencakup berbagai tipe media.

## Fitur Utama

- **Text Messages**: Pengiriman teks standar.
- **Media Support**: Mengirim gambar dan dokumen via URL atau upload.
- **Instant Delivery**: Pesan dikirim langsung tanpa melalui antrian blast.
- **Quota Tracking**: Setiap pesan yang dikirim akan mengurangi kuota bulanan pengguna.

## Struktur Database

Model Prisma yang terlibat:

- `Message`: Menyimpan detail pesan (To, Content, Type, Status, Direction).
- `MessageLog`: Menyimpan riwayat perubahan status pesan dari WhatsApp (sent, delivered, read).

## Alur Sistem Backend (`messageController.ts`)

1. User mengirim request berisi `deviceId`, `to`, dan `content`.
2. Sistem menyimpan baris baru di tabel `Message` dengan status `PENDING`.
3. Memanggil `sessionManager` untuk mengirim pesan sesuai tipe (Text/Image/Document).
4. Jika berhasil, status diperbarui menjadi `SENT`.
5. Jika gagal (misal: nomor tidak valid), status diperbarui menjadi `FAILED` disertai alasan error.
6. (Opsional) Jika webhook aktif, status pesan akan terus diperbarui saat menerima event `ACK` (Centered/Delivered/Read) dari WhatsApp.

## Tipe Pesan yang Didukung

- `TEXT`: Pesan teks biasa.
- `IMAGE`: Gambar (JPG/PNG/WebP) disertai teks caption.
- `DOCUMENT`: File (PDF, DOCX, dll) disertai nama file.
