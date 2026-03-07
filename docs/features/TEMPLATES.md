# Message Templates

Templates memungkinkan _User_ untuk membuat format pesan standar yang dapat digunakan berulang kali dengan variabel dinamis (placeholder).

## Fitur Utama

- **Dynamic Placeholders**: Menggunakan variabel seperti `{{name}}`, `{{phone}}`, atau variabel kustom lainnya dalam pesan.
- **JSON Variable Store**: Mendefinisikan daftar variabel yang tersedia untuk setiap template.
- **Preview**: Melihat hasil akhir pesan sebelum dikirim.

## Struktur Database

Model Prisma yang terlibat:

- `Template`: Menyimpan nama template, konten mentah, dan daftar variabel yang didukung.

## Contoh Penggunaan Variabel

Isi Template:

```text
Halo kak {{name}}, selamat pagi!
Kami ingin menginfokan bahwa pesanan ke nomor {{phone}} sedang diproses.
```

Saat dikirim melalui fitur _Blast_, sistem akan otomatis mengambil data dari `Contact` yang bersangkutan dan mengganti `{{name}}` dengan nama kontak tersebut.

## Alur Resolusi Template (`csvParser.ts` / `blastController.ts`)

1. Saat memproses _Blast Job_, sistem mengambil konten template.
2. Fungsi `resolveTemplate` menggunakan regex untuk mencari pola `{{variable}}`.
3. Mengganti pola tersebut dengan nilai asli dari objek kontak.
4. Pesan yang sudah "bersih" (resolved) disimpan di tabel `BlastRecipient` sebelum dikirim oleh worker.
