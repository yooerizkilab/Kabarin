# Contact & Group Management

Fitur ini digunakan untuk mengelola daftar penerima pesan (kontak) dan mengelompokkannya ke dalam grup untuk mempermudah pengiriman pesan massal (_Blast_).

## Fitur Utama

- **CRUD Kontak**: Menambah, mengubah, dan menghapus kontak (Nama, Nomor WA, Email).
- **Contact Groups**: Mengelompokkan kontak ke dalam kategori tertentu (misal: "Reseller", "Pelanggan VIP").
- **Bulk Import CSV**: Mengimpor ribuan kontak sekaligus dari file CSV.
- **Auto Mapping**: Mendeteksi kolom nama, telepon, dan email dari CSV secara otomatis.
- **Tagging & Segmentation**: Melabeli kontak dengan tag kustom berwarna untuk kategorisasi yang lebih mendalam (misal: "Prospect", "Cold Lead").

## Struktur Database

Model Prisma yang terlibat:

- `Contact`: Data individu kontak.
- `ContactGroup`: Pengelompokan kontak secara struktural.
- `Tag`: Label kategorisasi yang fleksibel.
- Relasi:
  - `Contact` opsional memiliki satu `ContactGroup`.
  - `Contact` dapat memiliki **banyak** `Tag` (Many-to-Many).
  - `User` mengelola `Tag` miliknya sendiri.

## Format CSV untuk Import

File CSV harus memiliki minimal kolom berikut (header tidak sensitif terhadap huruf besar/kecil):

- `name`: Nama kontak.
- `phone`: Nomor WhatsApp (dengan kode negara, misal: 62812345678).
- `email`: (Opsional) Alamat email.

Contoh isi CSV:

```csv
name,phone,email
Budi,62812345678,budi@example.com
Ani,62898765432,ani@example.com
```

## Alur Import (`contactController.ts`)

1. File CSV diunggah via multipart request.
2. `parseCsvContacts` (utils) memproses buffer file.
3. Melakukan normalisasi nomor telepon (menghapus karakter non-digit).
4. Menyimpan data secara massal menggunakan `prisma.contact.createMany`.

## Tagging & Segmentation

Berbeda dengan **Groups** yang bersifat statis (satu kontak satu grup), **Tags** memungkinkan segmentasi yang lebih dinamis:

- **Warna Kustom**: Mempermudah identifikasi visual di daftar kontak.
- **Filter Cepat**: Sidebar kontak menyediakan filter per-tag untuk mempermudah broadcast khusus segmen tertentu.
- **Multi-Assignment**: Satu kontak bisa dilabeli sebagai "Pelanggan" sekaligus "VIP".
