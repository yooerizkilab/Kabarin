# Dashboard Analytics

Dashboard adalah halaman utama yang memberikan ringkasan statistik dan informasi penting mengenai penggunaan sistem secara keseluruhan.

## Informasi yang Ditampilkan

- **Active Devices**: Jumlah perangkat yang saat ini berstatus `CONNECTED`.
- **Message Stats**: Visualisasi pesan terkirim vs gagal hari ini.
- **Quota Usage**: Presentase penggunaan kuota pesan bulanan bagi User non-admin.
- **Quick Actions**: Pintasan cepat ke fitur Blast atau Tambah Perangkat.
- **Latest Activities**: Daftar aktivitas atau pesan terbaru yang baru saja terjadi.

## Sumber Data

Dashboard mengumpulkan data dari berbagai repository:

- `deviceRepository.countActive()`
- `messageRepository.countDailyStats()`
- `blastRepository.countRecentJobs()`

## Implementasi Real-time

Beberapa statistik di dashboard diperbarui secara real-time tanpa refresh halaman menggunakan **WebSocket**, seperti update status perangkat yang tiba-tiba terputus atau progres pengerjaan Blast yang sedang berjalan.
