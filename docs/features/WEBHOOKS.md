# Webhook Management

Fitur Webhook memungkinkan sistem untuk meneruskan (_forward_) pesan masuk atau update status pesan ke server eksternal milik _User_ secara real-time melalui HTTP POST.

## Fitur Utama

- **Real-time Forwarding**: Mengirim data segera setelah diterima dari WhatsApp.
- **Security Secret**: Menggunakan token rahasia untuk memverifikasi bahwa request berasal dari server WA Gateway.
- **Toggle Switch**: Mengaktifkan atau menonaktifkan webhook per-perangkat dengan mudah.

## Struktur Database

Model Prisma yang terlibat:

- `Webhook`: Menyimpan URL endpoint, status aktif, dan secret key.
- Relasi: Satu `Device` hanya bisa memiliki satu `Webhook` aktif.

## Alur Sistem Backend (`webhookController.ts` & `sessionManager.ts`)

1. **Incoming Event**: `sessionManager` mendeteksi pesan baru atau perubahan status pesan.
2. **Detection**: Sistem mengecek apakah ada `Webhook` yang aktif untuk `deviceId` terkait.
3. **Dispatch**: Jika ada, sistem mengirimkan payload JSON ke URL yang terdaftar menggunakan metode POST.
4. **Retry Logic**: (Opsional) Jika endpoint target gagal (HTTP != 200), sistem dapat mencoba mengirim ulang beberapa kali sebelum menyerah.

## Contoh Payload Webhook

```json
{
  "event": "messages.upsert",
  "deviceId": "uuid-device-123",
  "data": {
    "from": "62812345678",
    "text": "Halo, saya ingin bertanya tentang produk Anda",
    "timestamp": 1678234567
  }
}
```

## Keamanan

Disarankan bagi pengembang pihak ketiga untuk selalu memverifikasi `X-Webhook-Secret` pada header HTTP mereka untuk memastikan integritas data.
