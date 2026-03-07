# Device Management

Fitur Device Management memungkinkan _User_ untuk menghubungkan akun WhatsApp mereka ke dalam sistem menggunakan QR Code, mengelola status koneksi, dan memantau perangkat yang aktif.

## Fitur Utama

- **Multi-Device Support**: Mendukung koneksi banyak perangkat WhatsApp sekaligus (terbatas sesuai paket langganan).
- **Real-time Status**: Memantau status koneksi (CONNECTED, DISCONNECTED, CONNECTING, QR_REQUIRED) secara langsung (WebSocket).
- **Session Persistence**: Sesi WhatsApp disimpan sehingga perangkat tetap terhubung meskipun server dimulai ulang.

## Struktur Database

Model Prisma yang terlibat:

- `Device`: Menyimpan data perangkat (Nama, Nomor Telepon, Status, Path Sesi).
- Relasi: Satu `User` dapat memiliki banyak `Device`.

## Alur Sistem Backend (`sessionManager.ts`)

1. **Inisialisasi**: Saat aplikasi dimulai, `sessionManager` memuat semua sesi perangkat yang ada dari disk/database.
2. **Koneksi Baru**:
   - User membuat perangkat di dashboard.
   - `sessionManager.createSession(deviceId)` dipanggil.
   - Adapter _Baileys_ menginisialisasi socket koneksi.
3. **QR Code**: Jika sesi belum terautorisasi, event `connection.update` akan menangkap QR code dan mengirimkannya ke frontend via WebSocket.
4. **Update Status**: Status koneksi (`CONNECTED`, `DISCONNECTED`, dll) diperbarui di database setiap kali ada perubahan event dari WhatsApp.

## Penyimpanan Sesi

Sesi disimpan dalam folder yang ditentukan oleh `.env` (default: `backend/sessions/`) atau sesuai konfigurasi `sessionPath` pada model `Device`.
