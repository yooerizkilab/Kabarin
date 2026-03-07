# Roadmaps & Ide Pengembangan

Project ini dibangun dengan arsitektur skalabel sehingga sangat mudah untuk dikembangkan menjadi SaaS tingkat lanjut. Berikut adalah beberapa fitur potensial untuk pengembangan berikutnya:

1. ~~**🤖 Auto-Responder / Chatbot Builder**~~ (✅ Selesai)
   Membuat fitur _keyword detection_ atau visual flow builder yang membalas pesan secara otomatis tanpa campur tangan admin.
2. ~~**🔗 Webhook Management**~~ (✅ Selesai)
   Kemampuan meneruskan (_forward_) pesan yang masuk (Incoming Messages) ke server/aplikasi milik pengguna pihak ketiga secara _Real-time_.
3. ~~**💳 SaaS Billing & Tiering Quota**~~ (✅ Selesai)
   Integrasi payment gateway (Midtrans/Stripe) beserta kuota pesan bulanan per user untuk memonetisasi platform secara B2B.
4. ~~**💬 Shared Team Inbox (Live Chat CS)**~~ (✅ Selesai)
   UI khusus mirip WhatsApp Web yang memungkinkan Multi-Customer Service milik _User_ membalas chat secara manual dari satu nomor yang sama.
5. **🚀 Migrasi Queue ke Redis (BullMQ)**
   Mengganti sistem _Database-Queue_ bawaan saat ini dengan **Redis** Worker agar bisa diskalakan secara horizontal (menjalankan banyak instance Worker sekaligus).
6. **🖼️ Blast Media & Interactive Messages**
   Dukungan mengirim gambar, dokumen, atau pesan interaktif (Button/List - tergantung support WhatsApp API non-resmi) di fitur Blast Campaign.
7. **🏷️ Dynamic Contact Tags**
   Sistem penanda (Tagging) kontak yang dinamis (misal: "VIP", "Telah Follow Up") sebagai alternatif penyortiran selain menggunakan statik Contact Group.
