# Blast Message (Bulk Sending)

Fitur Blast memungkinkan _User_ untuk mengirimkan pesan massal ke ribuan kontak sekaligus secara efisien menggunakan antrian (_Queue_) agar tidak membebani server dan meminimalisir risiko blokir oleh WhatsApp.

## Fitur Utama

- **Queue-Based Processing**: Menggunakan **Redis (BullMQ)** untuk mengelola antrian pesan.
- **Staggered Sending**: Jeda antar pesan (misal: 3 detik) untuk mensimulasikan perilaku manusia.
- **Scheduling**: Menentukan waktu pengiriman di masa depan.
- **Real-time Progress**: Memantau jumlah pesan terkirim, gagal, dan sisa antrian secara langsung.
- **Automatic Recovery**: Jika worker terhenti, pengiriman akan dilanjutkan otomatis saat worker aktif kembali (Backfill).

## Struktur Database

Model Prisma yang terlibat:

- `BlastJob`: Data utama kampanye blast (Nama, Pesan, Template, Jadwal, Status Total).
- `BlastRecipient`: Baris antrian per-penerima (Status individual, Waktu kirim, Error log).

## Alur Sistem Backend

1. **Submit Job** (`blastController.ts`):
   - Admin membuat blast job.
   - Sistem meresolusi template untuk setiap kontak.
   - Menyimpan daftar penerima ke tabel `BlastRecipient`.
   - Memasukkan ID penerima ke antrian **Redis (BullMQ)** dengan delay yang bertingkat (_Staggered_).
2. **Worker Processing** (`blastWorker.ts`):
   - Worker mengambil job dari Redis secara paralel (Concurrency default: 5).
   - Mengambil data session WhatsApp dari `sessionManager`.
   - Mengirim pesan ke API WhatsApp (Baileys).
   - Memperbarui status di database dan mengirim update progres ke frontend melalui WebSocket.

## Konfigurasi Antrian

Parameter antrian dapat dikonfigurasi melalui `.env`:

- `REDIS_HOST`, `REDIS_PORT`: Lokasi server Redis.
- `MESSAGE_DELAY_MS`: Jeda dasar antar pesan dalam milidetik (default: 3000ms).
