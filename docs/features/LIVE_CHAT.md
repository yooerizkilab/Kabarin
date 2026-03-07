# Live Chat / Shared Inbox

Fitur Live Chat menyediakan antarmuka real-time mirip WhatsApp Web yang memungkinkan _User_ untuk berinteraksi langsung dengan pelanggan dari dashboard.

## Fitur Utama

- **Real-time Synchronization**: Pesan masuk muncul seketika di dashboard tanpa perlu refresh.
- **Chat History**: Memuat riwayat percakapan lama yang tersimpan di database lokal.
- **Multi-Device Selection**: Memilih perangkat mana yang ingin dipantau percakapannya.
- **Shared Team Access**: Memungkinkan banyak admin/CS membalas pesan dari satu nomor WhatsApp yang sama.

## Alur Sistem Real-time (WebSocket)

Fitur ini sangat bergantung pada **Socket.io** (`wsServer.ts`):

1. **Incoming Message**:
   - `sessionManager` menerima pesan baru dari WA.
   - Pesan disimpan ke database (`Message`).
   - Server memancarkan event `new_message` ke client frontend yang terhubung.
2. **Chat List**: Frontend memanggil `getChatList` untuk mendapatkan daftar kontak terakhir yang berinteraksi.
3. **History**: Saat chat diklik, frontend memanggil `getChatHistory` untuk memuat gelembung chat.

## Struktur Database

Model `Message` digunakan bersama untuk menyimpan pesan masuk (`INCOMING`) dan keluar (`OUTGOING`). Pembeda utamanya adalah kolom `direction`.

## Penanganan Media di Live Chat

Media yang masuk (gambar/suara) akan diunduh oleh backend (jika dikonfigurasi) atau dilayani langsung melalui URL sesi untuk ditampilkan di chat bubble frontend.
