# Alur Proses Lengkap Pengelolaan Aset Gereja

## SIMAS Gereja – Paroki Pringwulung

Dokumen ini menjelaskan perjalanan aset sejak penyesuaian spreadsheet standar Keuskupan, pendataan fisik, rekonsiliasi dengan Keuangan, digitalisasi, operasional, pelaporan, hingga audit.

## 1. Tujuan dan prinsip

Proses ini memastikan setiap aset memiliki identitas, kode, lokasi, bidang, kondisi, nilai, dan riwayat yang dapat ditelusuri. Prinsipnya adalah satu sumber data resmi, perubahan dapat diaudit, data fisik dikonfirmasi bidang, nilai keuangan dikonfirmasi Keuangan, dan setiap import diverifikasi sebelum dipublikasikan.

## 2. Pihak yang terlibat

| Pihak | Tanggung jawab |
|---|---|
| Penanggung jawab program | Menetapkan cakupan, jadwal, keputusan, dan persetujuan akhir |
| Admin aset | Master Data, import, verifikasi, koreksi, dan laporan |
| Bidang/komisi | Mengidentifikasi aset yang berada di bawah penguasaannya |
| Keuangan (Mbak Nina) | Mengonfirmasi harga, tahun pembelian, dan dokumen sumber |
| Operator lapangan | Pendataan fisik, stock opname, QR, dan kondisi |
| Super Admin | Hak akses, Master Data, pemulihan, dan perubahan kritis |
| Viewer/pimpinan | Membaca dashboard dan hasil laporan |

Peran di aplikasi adalah Super Admin, Admin, Operator, dan Viewer dengan hak CRUD yang berbeda.

## 3. Tahap 0 – Persiapan

Tetapkan periode, lokasi, penanggung jawab bidang, format spreadsheet, kamus kode, aturan penamaan, folder dokumen, prosedur persetujuan, jadwal pencadangan, dan jadwal verifikasi. Spreadsheet asli tidak boleh ditimpa; gunakan salinan kerja berversi.

## 4. Tahap 1 – Penyesuaian spreadsheet standar Keuskupan

### 4.1 Struktur kode

Nomor aset SIMAS terdiri dari tujuh segmen:

    [JenisAset]-[Tahun]-[Teritori]-[Peruntukan]-[LetakRuang]-[NoUrutSejenis]-[KodeNamaBarang]

Contoh: 403-2020-01-01-08-01-17.

| Segmen | Arti |
|---|---|
| 403 | Jenis aset, misalnya peralatan elektronik |
| 2020 | Tahun perolehan |
| 01 | Teritori/paroki |
| 01 | Peruntukan/Gereja Utama |
| 08 | Letak ruang |
| 01 | Urutan barang sejenis |
| 17 | Kode nama barang |

Nomor urut sejenis membedakan beberapa unit dengan nama dan struktur kode yang sama.

### 4.2 Kolom spreadsheet

| Kelompok | Kolom |
|---|---|
| Identitas | id, uraian, qty, satuan, noSeriFinal |
| Klasifikasi | kategoriAset, jenisAset, teritori, peruntukan, letakRuang, kodeNamaBarang, bidang |
| Waktu | tahun, tanggalPerolehan |
| Keuangan | hargaPembelian, nilaiResidu, umurManfaat, nilaiBuku, biayaPenyusutan |
| Kondisi | kondisiBarang |
| Tanah | landArea, certificateNumber, propertyRights, location, coordinates |
| Bangunan | buildingArea, totalFloors, buildYear, buildingPermit |

Minimal harus ada uraian, kategori, jenis aset, ruang, kode barang, tahun, harga, jumlah, dan kondisi.

### 4.3 Pembersihan

Hilangkan spasi/karakter tersembunyi, seragamkan nama dan satuan, gunakan kondisi BAIK/RUSAK_RINGAN/RUSAK_BERAT, pastikan harga berupa angka, seragamkan tanggal, gunakan kode Master Data, pisahkan bergerak/tidak bergerak, dan tandai data kosong sebagai perlu klarifikasi.

### 4.4 Rumus

Penyusutan tahunan = (Harga Perolehan - Nilai Residu) / Umur Manfaat.

Nilai Buku = Harga Perolehan - Akumulasi Penyusutan.

Tanah dapat ditandai tidak disusutkan. Nilai buku tidak boleh negatif dan dihitung ulang berdasarkan waktu berjalan.

Keluaran tahap ini adalah spreadsheet bersih, kamus kode, daftar pengecualian, template import, dan persetujuan format.

## 5. Tahap 2 – Pendataan aset ke bidang

### 5.1 Persiapan

Setiap bidang menerima daftar aset awal, template, petunjuk kode ruang/kategori, aturan foto, batas waktu, dan nama penanggung jawab.

### 5.2 Pendataan fisik

Catat nama, spesifikasi, merek/tipe, jumlah, satuan, lokasi aktual, bidang pengguna, kondisi, nomor seri pabrikan, sertifikat/dokumen properti, foto aset, dan perbedaan dari data lama.

### 5.3 Pemeriksaan bidang

Periksa seluruh aset di ruang, jumlah unit, lokasi, aset berpindah, aset hilang, aset rusak, aset tanpa dokumen, dan aset yang ternyata terdiri dari beberapa unit. Beri status terkonfirmasi bidang, perlu Keuangan, atau perlu keputusan Admin.

### 5.4 Pelabelan Aset

Setelah aset diperiksa dan identitasnya disetujui oleh bidang, setiap aset diberi label inventaris yang mengacu pada nomor seri final dari SIMAS.

Alur pelabelan:

1. Admin memastikan data aset sudah lolos validasi dan nomor seri final sudah terbentuk.
2. Sistem membuat QR Code dan/atau label nomor aset untuk setiap unit.
3. Label dicetak menggunakan bahan yang sesuai dengan media aset, misalnya stiker tahan air untuk peralatan dan label khusus untuk dokumen atau ruangan.
4. Petugas menempelkan label pada bagian aset yang mudah terlihat, tidak mudah terlepas, dan tidak mengganggu penggunaan.
5. Untuk aset yang terdiri dari beberapa unit sejenis, setiap unit menerima nomor urut dan label yang berbeda.
6. Petugas memindai QR setelah label ditempel untuk memastikan label membuka aset yang benar.
7. Jika label rusak, hilang, atau tidak terbaca, petugas membuat permintaan cetak ulang tanpa membuat identitas aset baru.
8. Hasil pelabelan dicatat dalam daftar serah terima dan disahkan oleh penanggung jawab bidang.

Keluaran tahap ini adalah aset berlabel, daftar nomor seri yang sudah ditempel, hasil uji pemindaian QR, daftar label yang perlu dicetak ulang, foto bukti pelabelan bila diperlukan, dan berita acara pelabelan.

## 7. Tahap 3 – Rekonsiliasi dengan Keuangan

### 7.1 Dokumen sumber

Gunakan faktur, kuitansi, buku inventaris lama, daftar pembelian, jurnal/buku besar, dokumen hibah, dan berita acara serah terima.

### 7.2 Kunci pencocokan

Cocokkan nomor seri, nama dan spesifikasi, tahun, lokasi/bidang, harga, lalu dokumen sumber. Jika nomor seri belum ada, gunakan nama + tahun + lokasi + harga sebagai kunci sementara.

### 7.3 Status

| Status | Tindakan |
|---|---|
| Cocok | Siap diimport |
| Harga berbeda | Konfirmasi Keuangan |
| Tahun berbeda | Tetapkan tahun disetujui dan simpan sumber |
| Dokumen belum ditemukan | Tandai untuk penelusuran |
| Tidak ditemukan fisik | Verifikasi bidang/pimpinan |
| Hibah/sumbangan | Tetapkan kebijakan nilai |
| Duplikat | Gabungkan atau beri nomor unit berbeda |

Perubahan harga/tahun wajib memiliki sumber dokumen, pemeriksa, tanggal, alasan, dan persetujuan. Keluaran tahap ini adalah rekonsiliasi fisik–keuangan, file final, daftar pengecualian, dan berita acara.

## 8. Tahap 4 – Digitalisasi ke SIMAS

### 8.1 Master Data

Isi referensi berikut terlebih dahulu:

| Level | Isi |
|---|---|
| Level 1 | Jenis Aset |
| Level 3 | Teritori |
| Level 4 | Peruntukan |
| Level 5 | Letak Ruang |
| Level 7 | Kode dan Nama Barang |
| Tambahan | Bidang/Fungsi |

Setiap level mendukung CRUD dan bulk upload CSV/Excel. Master Data menjadi sumber dropdown, validasi, dan serialisasi.

### 8.2 Import massal

1. Siapkan template.
2. Petakan kolom ke Master Data.
3. Bentuk nomor serial otomatis.
4. Hitung penyusutan dan nilai buku.
5. Proses dalam beberapa batch.
6. Kunci listener realtime selama import.
7. Tunggu seluruh batch selesai.
8. Verifikasi jumlah aset di server.
9. Perbarui tampilan dan cache hanya jika jumlah cocok.
10. Tampilkan baris berhasil dan gagal.
11. Jika gagal, pertahankan data baik sebelumnya dan bersihkan batch gagal.

### 8.3 Validasi otomatis

Sistem memeriksa uraian, jenis aset, ruang, kode barang, qty, harga, tahun, tujuh segmen serial, serial duplikat, dan hubungan nilai buku dengan harga. Error wajib menghentikan penyimpanan; peringatan ditampilkan untuk diperbaiki.

### 8.4 Penyimpanan

Firebase menjadi penyimpanan bersama dan cache lokal hanya membantu tampilan sementara. Setelah perubahan besar, tunggu pesan sukses, jangan refresh saat import, periksa jumlah aset, dan lakukan ekspor cadangan.

## 9. Fitur yang telah dikembangkan

### Akses dan keamanan

Login, RBAC, pembatasan CRUD, manajemen pengguna, pencabutan akses, pembatasan bidang, dan pergantian operator sesi.

### Dashboard

KPI total unit, nilai perolehan, nilai buku, penyusutan tahunan, aset rusak, grafik kategori/bidang/kondisi, aset mendekati akhir umur manfaat, serta mode terang/gelap.

### Register Aset

Register bergerak/tidak bergerak, CRUD, pencarian, filter, sorting, paginasi, penghapusan massal dengan konfirmasi, atribut tanah/bangunan, serial otomatis, serta ekspor CSV/PDF/Excel.

### Master Data dan import

CRUD seluruh level, bulk upload Master Data, sinkronisasi kode/nama, pemetaan label ke kode, batch processing, listener lock, verifikasi jumlah, dan rollback saat gagal.

### QR, stock opname, dan riwayat

Scan QR kamera/input manual, detail aset, cetak QR individual/massal, update kondisi, mutasi ruang, servis, biaya, vendor, jadwal servis, dokumen pendukung, dan log CREATE/UPDATE/DELETE/MUTASI/MAINTENANCE.

### Pelaporan

Laporan per ruang, bidang, kategori, kondisi, dan tahun; ringkasan unit, harga, penyusutan, nilai buku; serta ekspor PDF/Excel.

### AI dan kualitas data

AI Assistant pencarian natural language seperti “CCTV di Gudang tahun 2020” atau “aset rusak”; jumlah hasil, total nilai buku, dan pembukaan detail aset. Versi awal bekerja lokal tanpa mengirim data ke layanan eksternal.

### UI/UX

Sidebar dapat diciutkan, mode terang/gelap, font Inter, menu dengan deskripsi fungsi, layout desktop/mobile, empty state, hover, toast, dialog, dan grafik responsif.

## 10. Operasional setelah sistem aktif

### Harian

Login sesuai peran, periksa dashboard, catat aset/perubahan kondisi, gunakan QR, simpan, dan tunggu pesan berhasil.

### Mingguan

Tinjau aset rusak, akhir umur manfaat, mutasi, pemeliharaan, konfirmasi perubahan bidang, dan ekspor cadangan setelah perubahan besar.

### Bulanan

Rekonsiliasi dengan Keuangan, tinjau nilai buku/penyusutan, periksa duplikat, tinjau hak akses, dan terbitkan laporan inventaris.

### Tahunan

Stock opname menyeluruh, pemeriksaan tanah/bangunan, pencocokan saldo dengan Keuangan, arsip laporan/berita acara, dan pembaruan template.

## 11. Titik kontrol

| Gate | Pertanyaan | Bukti |
|---|---|---|
| Format | Spreadsheet dan kode sudah standar? | Template/kamus kode |
| Fisik | Aset ada dan lokasinya diketahui? | Form/foto/pengesahan |
| Keuangan | Harga dan tahun sudah disetujui? | Dokumen/berita acara |
| Import | Batch selesai dan jumlah cocok? | Ringkasan/verifikasi |
| Publikasi | Dashboard/laporan sudah diperiksa? | Hasil uji/persetujuan |
| Perubahan | Ada alasan dan jejak audit? | History log/dokumen |

## 12. Risiko dan penanganan

**Data tampak hilang setelah refresh:** periksa status import, koneksi Firebase, jumlah server/lokal, dan log. Jangan langsung memakai mode replace.

**Unsupported field value undefined:** periksa kolom wajib, nilai angka kosong, atribut tanah/bangunan, dan template terbaru.

**Penghapusan massal terlalu luas:** pilih baris secara eksplisit, baca konfirmasi, periksa hak akses, dan ekspor sebelum tindakan besar.

**Harga/tahun berbeda:** jangan menimpa tanpa sumber; simpan nilai awal, koreksi, alasan, dan persetujuan Keuangan.

## 13. Arsip wajib

Spreadsheet final, kamus Master Data, daftar pendataan bidang, daftar selisih, rekonsiliasi Keuangan, file import, ringkasan import, ekspor Register, laporan inventaris/akuntansi, berita acara, riwayat koreksi, dan cadangan periodik.

## 14. Ringkasan alur

    Standar Keuskupan
      ↓
    Penyesuaian kolom, kode, dan rumus
      ↓
    Pendataan fisik oleh bidang
      ↓
    Rekonsiliasi harga/tahun dengan Keuangan
      ↓
    Persetujuan Master Data dan file final
      ↓
    Import batch ke SIMAS
      ↓
    Validasi + serial + depresiasi
      ↓
    Verifikasi jumlah dan sinkronisasi Firebase
      ↓
    QR, stock opname, mutasi, pemeliharaan, riwayat
      ↓
    Dashboard, laporan inventaris, dan laporan akuntansi
      ↓
    Audit dan pembaruan berkelanjutan

Dengan alur ini, SIMAS Gereja menjadi sistem pengendalian aset yang menghubungkan standar Keuskupan, pemeriksaan fisik, Keuangan, digitalisasi, dan pelaporan dalam satu siklus yang dapat ditelusuri.
