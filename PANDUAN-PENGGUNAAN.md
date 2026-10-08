# Panduan Penggunaan SIMAS Gereja – Aset Manajemen

Panduan ini menjelaskan alur penggunaan aplikasi manajemen aset Paroki Pringwulung, mulai dari masuk ke aplikasi sampai pencatatan, pemutakhiran, pelaporan, dan pemeliharaan data aset.

## 1. Gambaran umum aplikasi

SIMAS Gereja – Aset Manajemen digunakan untuk:

- mencatat aset bergerak dan aset tidak bergerak;
- membentuk nomor aset berdasarkan struktur kode paroki;
- mengelola master data referensi;
- mengunggah aset secara massal melalui Excel/CSV;
- memantau nilai perolehan, penyusutan, dan nilai buku;
- mencari aset melalui nomor seri atau QR;
- menghasilkan laporan inventaris dan ringkasan akuntansi;
- mengelola pengguna berdasarkan peran dan hak akses.

Data aplikasi disimpan pada penyimpanan aplikasi/Firebase yang terhubung. Setelah melakukan perubahan besar, tunggu pesan berhasil sebelum berpindah menu atau menutup halaman.

## 2. Masuk atau Login

1. Buka alamat aplikasi.
2. Isi **Username**.
3. Isi **Kata Sandi**.
4. Tekan **Masuk Workspace**.
5. Setelah berhasil, aplikasi membuka Dashboard sesuai hak akses pengguna.

### Akun bawaan untuk pengujian awal

| Pengguna | Username | Kata sandi | Peran |
|---|---|---|---|
| Romo Paroki | `romo` | `123` | Super Admin |
| Anastasia Sekar | `sekar` | `123` | Operator |
| Aloysius Heri | `heri` | `123` | Operator |
| Theresia Lindung | `theresia` | `123` | Viewer |

Akun tersebut adalah kredensial awal aplikasi. Segera ubah kata sandi atau buat akun baru untuk penggunaan nyata.

## 3. Peran dan hak akses

| Peran | Membaca aset | Menambah | Mengubah | Menghapus | Unggah massal | Master data | Pengguna |
|---|---:|---:|---:|---:|---:|---:|---:|
| Super Admin | Ya | Ya | Ya | Ya | Ya | Ya | Ya |
| Admin | Ya | Ya | Ya | Ya | Ya | Ya | Tidak |
| Operator | Ya | Ya | Ya | Tidak | Tidak | Tidak | Tidak |
| Viewer | Ya | Tidak | Tidak | Tidak | Tidak | Tidak | Tidak |

Peran lama **Koordinator Tim** diperlakukan sebagai Operator, sedangkan **Petugas Viewer** diperlakukan sebagai Viewer. Koordinator dapat dibatasi pada bidang tertentu sesuai konfigurasi akun.

## 4. Dashboard

Dashboard memberikan ringkasan kondisi aset, antara lain:

- total kuantitas aset;
- nilai perolehan;
- nilai buku saat ini;
- penyusutan per tahun;
- aset rusak;
- representasi nilai buku per kategori;
- distribusi nilai aset per bidang;
- daftar aset yang mendekati akhir umur manfaat.

Klik kartu ringkasan atau baris aset jika tersedia untuk melihat detailnya. Gunakan mode terang/gelap sesuai kebutuhan tampilan.

## 5. Register Aset

Menu **Register Aset** terbagi menjadi:

- **Tidak Bergerak**: tanah, bangunan, dan bangunan nonpermanen;
- **Bergerak**: peralatan, elektronik, mebel, kendaraan, dan aset bergerak lainnya.

### Menambah aset satu per satu

1. Buka **Register Aset**.
2. Pilih kategori aset yang sesuai.
3. Tekan **Aset Baru**.
4. Isi uraian/nama aset.
5. Isi jumlah, satuan, tanggal perolehan, harga pembelian, kondisi, umur manfaat, dan bidang.
6. Pilih kode pada Level 1, Level 3, Level 4, Level 5, dan Level 7.
7. Untuk aset tidak bergerak, lengkapi atribut tanah/bangunan seperti luas, nomor sertifikat, lokasi, luas bangunan, dan tahun bangun bila tersedia.
8. Periksa pratinjau nomor seri final.
9. Tekan **Simpan Aset** dan tunggu pesan berhasil.

### Format nomor aset

Nomor seri final menggunakan format:

```text
[JenisAset]-[Tahun]-[Teritori]-[Peruntukan]-[LetakRuang]-[NoUrutSejenis]-[KodeBarang]
```

Contoh:

```text
403-2020-01-01-06-01-17
```

Artinya:

- `403`: jenis aset Peralatan Elektronik;
- `2020`: tahun perolehan;
- `01`: teritori Paroki;
- `01`: peruntukan Gereja Utama;
- `06`: letak ruang;
- `01`: urutan barang sejenis;
- `17`: kode barang.

Nomor urut barang sejenis dibuat agar beberapa aset dengan nama dan struktur kode yang sama tetap memiliki nomor unik.

### Mengubah aset

1. Cari aset dengan kotak pencarian atau filter.
2. Tekan ikon **Ubah** pada baris aset.
3. Periksa perubahan kategori, bidang, kode, dan atribut lainnya.
4. Tekan simpan.

Perubahan kategori dari aset bergerak ke aset tidak bergerak tidak menghapus aset. Pastikan seluruh atribut wajib aset tidak bergerak sudah dilengkapi sebelum menyimpan.

### Menghapus aset

Gunakan ikon hapus hanya setelah memeriksa nomor seri dan uraian. Untuk penghapusan massal, pilih aset yang benar-benar dimaksud dan baca daftar konfirmasi sebelum menyetujui. Operator tidak dapat menghapus aset; penghapusan tersedia untuk Admin dan Super Admin.

### Pencarian, filter, dan paginasi

Register Aset menyediakan pencarian, filter kategori/ruangan/kondisi/bidang, ekspor CSV/PDF, dan paginasi. Mengubah filter akan mengembalikan daftar ke halaman pertama.

## 6. Master Data

Master data adalah sumber referensi untuk dropdown, validasi, dan pembentukan nomor aset. Level yang digunakan aplikasi adalah:

| Level | Referensi |
|---|---|
| Level 1 | Jenis Aset |
| Level 3 | Teritori |
| Level 4 | Peruntukan |
| Level 5 | Letak Ruang |
| Level 7 | Kode Barang, dengan pasangan Nama Barang |
| Tambahan | Bidang/Fungsi Terkoordinasi |

### Menambah atau mengubah referensi

1. Buka **Master Data**.
2. Pilih level yang akan dikelola.
3. Gunakan pencarian untuk menemukan kode.
4. Tekan **Tambah Baru** atau ikon **Ubah**.
5. Isi kode dan nama deskriptif.
6. Simpan dan tunggu notifikasi sinkronisasi.

Level 7 tetap penting karena kode digunakan untuk standardisasi nomor aset, sedangkan nama barang membuat pilihan mudah dipahami oleh operator.

### Bulk upload master data

1. Siapkan file `.xlsx`, `.xls`, atau `.csv` dengan kolom **Kode** dan **Nama**.
2. Buka level master data yang sesuai.
3. Tekan **Bulk Upload**.
4. Pilih file.
5. Periksa jumlah baris valid dan baris yang dilewati.
6. Tunggu pesan bahwa seluruh referensi sudah tersimpan.

Data bulk digabungkan dengan referensi yang sudah ada. Kode yang sama akan diperbarui namanya; kode baru akan ditambahkan.

## 7. Unggah Massal aset

Menu **Unggah Massal** digunakan untuk memasukkan banyak aset sekaligus melalui Excel/CSV.

### Alur yang disarankan

1. Tekan **Unduh Template Excel**.
2. Isi kolom sesuai nama template.
3. Pastikan `uraian` dan `hargaPembelian` terisi.
4. Pastikan `jenisAset`, `letakRuang`, `bidang`, dan kode referensi sudah ada di Master Data.
5. Isi `kategoriAset` dengan `bergerak` atau `tidak_bergerak`.
6. Untuk aset tidak bergerak, isi atribut properti yang relevan.
7. Unggah file.
8. Tunggu semua batch selesai diproses.
9. Periksa ringkasan berhasil/gagal dan daftar baris yang bermasalah.
10. Pastikan jumlah aset setelah proses sesuai dengan jumlah yang diharapkan.

Sistem menunggu seluruh batch, mengunci listener selama import, memverifikasi hasil, lalu memperbarui tampilan. Jika verifikasi gagal, data lama dipertahankan dan pesan kegagalan ditampilkan.

### Kolom yang umum digunakan

- `kategoriAset`: `bergerak` atau `tidak_bergerak`;
- `uraian`: nama aset;
- `hargaPembelian`: harga perolehan;
- `jenisAset`: kode Level 1;
- `letakRuang`: kode Level 5;
- `bidang`: kode bidang/fungsi;
- `umurManfaat`: umur ekonomis dalam tahun;
- atribut properti: `landArea`, `certificateNumber`, `location`, `buildingArea`, dan atribut terkait lainnya.

Jika muncul error seperti `Unsupported field value: undefined`, periksa kolom kosong atau nilai yang belum dipetakan pada file. Gunakan template terbaru dan jangan menghapus nama kolom wajib.

## 8. Scanner & QR Booth

1. Buka **Scanner & QR Booth**.
2. Masukkan atau pindai nomor seri/QR aset.
3. Periksa detail aset yang ditemukan.
4. Gunakan detail tersebut untuk inspeksi, pelaporan servis, atau pemeriksaan kondisi.

Jika kamera tidak tersedia, gunakan pencarian nomor seri secara manual.

## 9. Pelaporan

Menu **Pelaporan** menyediakan laporan inventaris dengan format pencatatan akuntansi.

1. Gunakan pencarian dan filter ruangan, bidang, jenis aset, kategori, kondisi, dan tahun.
2. Periksa ringkasan jumlah unit, harga perolehan, akumulasi penyusutan, dan nilai buku.
3. Gunakan paginasi untuk meninjau data per halaman.
4. Tekan **PDF** untuk laporan siap cetak.
5. Tekan **Excel** untuk analisis atau pengolahan lanjutan.

Ekspor PDF/Excel memuat seluruh hasil filter, bukan hanya baris yang sedang terlihat pada halaman aktif.

## 10. Pengaturan Akun

Menu **Pengaturan Akun** digunakan untuk:

- memperbarui nama, email, username, atau kata sandi;
- memilih peran pengguna;
- menetapkan bidang untuk Koordinator Tim;
- mendaftarkan operator baru (khusus Super Admin);
- mencabut akses pengguna lain (khusus Super Admin).

Gunakan email dan username yang unik. Jangan membagikan kata sandi antaroperator.

## 11. Rekomendasi operasional

- Selalu gunakan kode yang sudah ada di Master Data.
- Jangan mengubah kode master tanpa memeriksa aset yang menggunakannya.
- Setelah bulk upload, cocokkan jumlah baris berhasil dengan jumlah aset di Register Aset.
- Gunakan ekspor Excel sebagai salinan kerja sebelum perubahan besar.
- Hindari membuka beberapa tab aplikasi saat proses upload sedang berjalan.
- Tunggu notifikasi berhasil sebelum me-refresh halaman.
- Lakukan pencadangan berkala melalui fitur ekspor yang tersedia.

## 12. Pemecahan masalah singkat

### Data tampak hilang setelah refresh

Periksa koneksi internet dan tunggu listener Firebase selesai memuat. Pastikan proses unggah sebelumnya menampilkan pesan berhasil dan jumlah data sudah diverifikasi.

### Upload ditolak

Gunakan template terbaru, cek nama kolom, hapus nilai kosong pada kolom wajib, dan pastikan kode referensi sudah terdaftar di Master Data.

### Menu tidak terlihat

Menu mengikuti hak akses. Misalnya, Master Data dan Unggah Massal hanya tersedia untuk Admin/Super Admin, sedangkan manajemen pengguna hanya tersedia untuk Super Admin.

### Nomor aset tidak sesuai

Periksa seluruh kode Level 1, Teritori, Peruntukan, Letak Ruang, nomor urut sejenis, dan Kode Barang. Pastikan tidak ada spasi atau kode yang tidak terdaftar.

Dokumen ini mengikuti alur dan fitur aplikasi yang tersedia saat ini. Untuk perubahan struktur database, peran, atau format nomor aset, perbarui panduan setelah perubahan diuji di lingkungan preview.
