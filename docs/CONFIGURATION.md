# ⚙️ Konfigurasi Sistem

Seluruh pengaturan sistem dikelola melalui file Environment Variables (`.env`).

## 🖥️ Backend (`backend/.env`)

| Variabel | Deskripsi | Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | Koneksi MySQL (Prisma) | `mysql://root:password@localhost:3306/db` |
| `PORT` | Port server backend | `3001` |
| `JWT_SECRET` | Kunci enkripsi autentikasi | `rahasia_jwt` |
| `SESSION_DIR` | Folder penyimpanan sesi WA | `./sessions` |
| `FRONTEND_URL` | URL Frontend untuk CORS | `http://localhost:3000` |
| `GEMINI_API_KEY` | Key AI Google Gemini (Global) | - |
| `OPENAI_API_KEY` | Key AI OpenAI GPT (Global) | - |
| `ANTHROPIC_API_KEY` | Key AI Anthropic Claude (Global) | - |

> [!IMPORTANT]
> **Prioritas API Key**: Jika Anda mengisi API Key pada halaman **Auto-Responder Settings** di Dashboard, maka sistem akan menggunakan **Key Khusus Device** tersebut. API Key di `.env` hanya digunakan sebagai cadangan (Fallback) jika key di Dashboard kosong.

---

## 🌐 Frontend (`frontend/.env.local`)

| Variabel | Deskripsi | Default |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Endpoint API Backend | `http://localhost:3001` |
| `NEXT_PUBLIC_WS_URL` | Endpoint WebSocket | `ws://localhost:3001` |

---

## 🛡️ Best Practice

1.  **JWT Secret**: Selalu gunakan string acak yang panjang dan rumit untuk produksi.
2.  **MySQL Performance**: Gunakan MySQL v8.0+ untuk mendukung fitur indexing yang lebih modern.
3.  **Quota Management**: Disarankan menggunakan API Key per-device untuk menghindari limit harian pada akun AI gratisan.

---

[🚀 Instalasi](INSTALLATION.md) | [🏠 Home](README.md) | [▶️ Menjalankan Sistem](RUNNING.md)
