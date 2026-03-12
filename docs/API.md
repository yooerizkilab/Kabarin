# 🔌 API Reference (v1)

WhatsApp Gateway menyediakan REST API yang mudah digunakan untuk integrasi sistem pihak ketiga. Seluruh endpoint menggunakan prefix `/v1`.

## 🔑 Autentikasi

Seluruh request wajib menyertakan token JWT pada header:
`Authorization: Bearer <YOUR_JWT_TOKEN>`

---

## 📱 Devices

### 1. List Devices
`GET /v1/devices`  
Mengambil daftar semua akun WhatsApp yang terhubung.

### 2. Connect Device (QR Code)
`POST /v1/devices/connect`  
Memulai sesi baru dan menghasilkan QR Code via WebSocket.

---

## ✉️ Messages

### 1. Send Text Message
`POST /v1/messages/send`

**Body:**
```json
{
  "deviceId": "uuid-device-...",
  "to": "628123456789",
  "content": "Halo, ini pesan dari API!"
}
```

### 2. Send Media Message
`POST /v1/messages/send`

**Body:**
```json
{
  "deviceId": "uuid-device-...",
  "to": "628123456789",
  "type": "IMAGE",
  "content": "Keterangan gambar",
  "mediaUrl": "https://example.com/image.jpg"
}
```

---

## 🤖 Auto-Responder

### 1. Update AI Settings
`PUT /v1/auto-responder/:id`

**Body:**
```json
{
  "aiProvider": "gemini",
  "aiModel": "gemini-1.5-flash",
  "apiKey": "AIza...",
  "systemPrompt": "Kamu adalah asisten toko online."
}
```

---

## 📡 WebSocket Events

Koneksi: `ws://your-domain.com/ws`

| Event | Deskripsi |
| :--- | :--- |
| `qr_update` | QR Code baru untuk scan |
| `connection_update` | Perubahan status (CONNECTED/DISCONNECTED) |
| `message_update` | Pesan baru masuk |

---

## 🔌 Advanced Webhooks

Sistem dapat mengirimkan notifikasi ke server Anda secara otomatis. Lihat **[Panduan Webhooks](features/WEBHOOKS.md)** untuk detail implementasi.

---

[🏠 Kembali ke Home](README.md)
