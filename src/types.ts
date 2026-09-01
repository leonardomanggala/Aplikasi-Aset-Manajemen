/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type KondisiBarang = 'BAIK' | 'RUSAK_RINGAN' | 'RUSAK_BERAT';
export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'VIEWER' | 'KOORDINATOR_TIM' | 'PETUGAS_VIEWER';
export type CanonicalRole = 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'VIEWER';

export const ROLE_LABELS: Record<CanonicalRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  OPERATOR: 'Operator',
  VIEWER: 'Viewer'
};

// Legacy role names remain supported for existing Firebase/local data.
export const getCanonicalRole = (role: Role | string): CanonicalRole => {
  if (role === 'KOORDINATOR_TIM') return 'OPERATOR';
  if (role === 'PETUGAS_VIEWER') return 'VIEWER';
  if (role === 'ADMIN' || role === 'OPERATOR' || role === 'VIEWER' || role === 'SUPER_ADMIN') return role;
  return 'VIEWER';
};

export const ROLE_PERMISSIONS: Record<CanonicalRole, { dashboard: boolean; assetsRead: boolean; assetsCreate: boolean; assetsUpdate: boolean; assetsDelete: boolean; qr: boolean; reports: boolean; import: boolean; master: boolean; users: boolean }> = {
  SUPER_ADMIN: { dashboard: true, assetsRead: true, assetsCreate: true, assetsUpdate: true, assetsDelete: true, qr: true, reports: true, import: true, master: true, users: true },
  ADMIN: { dashboard: true, assetsRead: true, assetsCreate: true, assetsUpdate: true, assetsDelete: true, qr: true, reports: true, import: true, master: true, users: false },
  OPERATOR: { dashboard: true, assetsRead: true, assetsCreate: true, assetsUpdate: true, assetsDelete: false, qr: true, reports: true, import: false, master: false, users: false },
  VIEWER: { dashboard: true, assetsRead: true, assetsCreate: false, assetsUpdate: false, assetsDelete: false, qr: true, reports: true, import: false, master: false, users: false }
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  username?: string;
  password?: string;
  kategoriAkses?: string; // e.g. "403" for Peralatan Listrik, "408" for Alat Komsos
}

export interface MaintenanceLog {
  id: string;
  assetId: string;
  tanggalServis: string;
  deskripsi: string;
  biaya: number;
  vendor: string;
  tanggalServisNext?: string;
  createdAt?: string;
}

export interface AssetMutation {
  id: string;
  assetId: string;
  ruangAsal: string;
  ruangTujuan: string;
  tanggalMutasi: string;
  keterangan?: string;
  picName: string;
}

export interface AssetDocument {
  id: string;
  assetId: string;
  namaDokumen: string;
  fileUrl: string;
  createdAt: string;
}

export interface AssetHistoryLog {
  id: string;
  assetId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'MUTASI' | 'MAINTENANCE';
  userId: string;
  userName: string;
  timestamp: string;
  details: string;
}

export interface Asset {
  id: string;
  uraian: string;
  qty: number;
  satuan: string;
  tanggalPerolehan: string;
  hargaPembelian: number;
  kategoriAset?: 'bergerak' | 'tidak_bergerak'; // Kategori: Bergerak / Tidak Bergerak
  jenisAset: string;        // Level 1 code (e.g. "100" - Tanah, "401" - Bangunan, "403" - Peralatan, "408" - Komsos)
  tahun: number;
  teritori: string;         // Level 3 code (e.g. "01" - Paroki, "02" - Stasi)
  peruntukan: string;       // Level 4 code (e.g. "01" - Gereja Paroki)
  letakRuang: string;       // Level 5 code (e.g. "02" - Panti Imam, "08" - R. Komsos, "09" - Sekretariat)
  noUrutSejenis: string;    // Level 6 code (e.g. "001", "002")
  kodeNamaBarang: string;    // Level 7 code (e.g. "1" - CPU, "101" - Tensimeter)
  noSeriFinal: string;      // Formatted automatic unique serial: jenisAset.teritori.peruntukan.letakRuang.kodeNamaBarang.noUrutSejenis
  umurManfaat: number;      // elements in years
  nilaiResidu: number;
  nilaiBuku: number;
  biayaPenyusutan: number;
  kondisiBarang: KondisiBarang;
  bidang?: string;
  
  // --- New Enhancement: Non-Depreciable & Specific Asset Attributes ---
  isDepreciable?: boolean; // Default true, false for Tanah
  
  // Tanah (Land) Attributes
  landArea?: number; // in m2
  certificateNumber?: string;
  propertyRights?: string;
  location?: string;
  coordinates?: string;
  
  // Gedung (Building) Attributes
  buildingArea?: number; // in m2
  totalFloors?: number;
  buildYear?: number;
  buildingPermit?: string; // e.g., PBG/IMB

  createdAt: string;
  updatedAt: string;

  // Related lists for simulation
  maintenanceLogs?: MaintenanceLog[];
  mutations?: AssetMutation[];
  documents?: AssetDocument[];
  historyLogs?: AssetHistoryLog[];
}

export interface DashboardStats {
  totalOriginalValue: number;
  totalBookValue: number;
  totalDepreciationYear: number;
  totalUnits: number;
  totalRusak: number;
  categoryDistribution: { category: string; count: number; originalValue: number; bookValue: number; depreciationYear: number }[];
  conditionDistribution: { condition: string; count: number }[];
  bidangDistribution: { bidang: string; count: number; value: number }[];
  kategoriValueDistribution?: { name: string; value: number }[];
  expiringAssets: Asset[];
}

// Map Indonesian descriptive labels to codes
export const BIDANG_MAP: Record<string, string> = {
  "BDG-01": "Bidang Liturgi",
  "BDG-02": "Bidang Pewartaan",
  "BDG-03": "Bidang Paguyuban",
  "BDG-04": "Bidang Kemasyarakatan",
  "BDG-05": "Tim Aset & Pemeliharaan",
  "BDG-06": "Sekretariat Paroki",
  "BDG-07": "Komsos (Komunikasi Sosial)",
  "BDG-08": "Tim P3K / Kesehatan"
};

export const JENIS_ASET_MAP: Record<string, string> = {
  "100": "Tanah",
  "101": "Gedung",
  "401": "Bangunan Gereja & Kapel",
  "403": "Peralatan Elektronik & Sound System",
  "405": "Paramenta & Perlengkapan Liturgi",
  "408": "Alat Komunikasi Sosial (KOMSOS)",
  "410": "Mebel & Inventaris Kantor",
  "412": "Kendaraan Operasional Paroki"
};

export const TERITORI_MAP: Record<string, string> = {
  "01": "Paroki Pringwulung",
  "02": "Stasi Wedomartani",
  "03": "Stasi Maguwoharjo"
};

export const PERUNTUKAN_MAP: Record<string, string> = {
  "01": "Gereja Utama Paroki",
  "02": "Pastorat (Gedung Domus)",
  "03": "Gedung Pertemuan (GGP)",
  "04": "Sekolah / Aula Luar"
};

export const LETAK_RUANG_MAP: Record<string, string> = {
  "01": "Panti Imam (Altar)",
  "02": "Panti Umat / Nave",
  "03": "Ruang Sakristi",
  "04": "Sekretariat Paroki",
  "05": "Ruang Konsultasi Pastor",
  "06": "Kamar Kostor / Penjaga",
  "07": "Ruang Rapat Utama",
  "08": "Gudang Peralatan Liturgi (Paramenta)",
  "09": "Ruang KOMSOS (Multimedia)"
};

export const KODE_NAMA_BARANG_MAP: Record<string, string> = {
  "4": "Air Conditioner (AC)",
  "12": "Laptop / Komputer Portabel",
  "15": "Kursi Lipat",
  "17": "Televisi & Perlengkapan Multimedia",
  "21": "Mixer Konsol Audio",
  "44": "Kamera Mirrorless / DSLR",
  "99": "Mobil Operasional",
  "119": "Gong & Alat Musik Tradisional"
};

// Formatting utilities
export function formatRupiah(val: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(val);
}

// Realstraight-line depreciation calculation model (matches app/Services/DepreciationService.php)
export function calculateStraightLineDepreciation(
  hargaPembelian: number,
  nilaiResidu: number, // kept for backward compatibility, but we will force it to 0 as per user rule
  umurManfaat: number,
  tanggalPerolehan: string,
  asOfDate: string = new Date().toISOString(),
  isDepreciable: boolean = true
) {
  if (!isDepreciable) {
    return {
      biayaPenyusutan: 0,
      akumulasiPenyusutan: 0,
      nilaiBuku: Math.round(hargaPembelian * 100) / 100,
      umurBerjalanTahun: 0
    };
  }

  const tglPerolehan = new Date(tanggalPerolehan);
  const tglSekarang = new Date(asOfDate);

  // As per user request: always ignore any residual value from legacy dummy data,
  // ensure the system sets residual value to 0 for church assets to strictly follow straight-line depreciation down to 0.
  const assumedResidu = 0;

  // Beban Depresiasi Tahunan
  const biayaPenyusutanTahunan = umurManfaat > 0 
    ? (hargaPembelian - assumedResidu) / umurManfaat 
    : 0;

  // Menghitung selisih tahun berdasarkan tahun kalender (Tahun 0 = Awal, Tahun 1 = 1 tahun kemudian)
  let tahunPerolehan = tglPerolehan.getFullYear();
  let tahunSekarang = tglSekarang.getFullYear();
  
  if (isNaN(tahunPerolehan)) tahunPerolehan = tahunSekarang;

  let selisihTahun = tahunSekarang - tahunPerolehan;

  if (selisihTahun < 0) {
    selisihTahun = 0;
  }

  // Jika umur sudah melebihi masa manfaat, set ke max umur manfaat
  const umurBerjalan = Math.min(selisihTahun, umurManfaat);

  let akumulasiDepresiasi = biayaPenyusutanTahunan * umurBerjalan;
  let nilaiBukuSaatIni = hargaPembelian - akumulasiDepresiasi;

  let biayaPenyusutanBerjalan = biayaPenyusutanTahunan;

  // Jika masa manfaat terlampaui, pastikan nilai buku mencapai 0 jika tidak ada nilai residu
  // Tidak boleh memaksa nilai buku 0 secara sepihak jika ada nilai residu (Consistency Principle)
  if (umurManfaat > 0 && selisihTahun >= umurManfaat) {
    // We do not force book value to 0 if there is a residual value.
    // The mathematical calculation (hargaPembelian - akumulasiDepresiasi) correctly yields assumedResidu.
    // If assumedResidu is 0, it naturally reaches exactly 0.
    // We do not set biayaPenyusutanBerjalan = 0 here because the user wants to see the annual rate (e.g. Rp 1.375.000/th) even if it's fully depreciated.
  }

  return {
    biayaPenyusutan: Math.round(biayaPenyusutanBerjalan * 100) / 100,
    akumulasiPenyusutan: Math.round(akumulasiDepresiasi * 100) / 100,
    nilaiBuku: Math.round(nilaiBukuSaatIni * 100) / 100,
    umurBerjalanTahun: selisihTahun
  };
}

export function isAssetDepreciable(asset: Partial<Asset>): boolean {
  if (asset.isDepreciable !== undefined) {
    return asset.isDepreciable;
  }
  // By default, category "100" (Tanah) is NOT depreciable.
  return asset.jenisAset !== "100";
}

// Automatically generate the church's canonical asset code:
// [JENIS_ASET]-[TAHUN]-[TERITORI]-[LETAK_RUANG]-[PERUNTUKAN]-[KODE_NAMA_BARANG]
export function generateNoSeriFinal(asset: Partial<Asset>): string {
  const jenis = asset.jenisAset || "403";
  
  let tahun = asset.tahun || new Date().getFullYear();
  if (!asset.tahun && asset.tanggalPerolehan) {
    const parsed = new Date(asset.tanggalPerolehan).getFullYear();
    if (!isNaN(parsed)) tahun = parsed;
  }

  const teri = String(asset.teritori || "01").padStart(2, '0');
  const ruang = String(asset.letakRuang || "02").padStart(2, '0');
  const peruntukan = String(asset.peruntukan || "01").padStart(2, '0');
  const kodeBarang = asset.kodeNamaBarang || "17";

  return `${jenis}-${tahun}-${teri}-${ruang}-${peruntukan}-${kodeBarang}`;
}

// Generate human-readable string for QR Code scanner payload
export function generateQrValue(asset: Asset): string {
  const bidangName = BIDANG_MAP[asset.bidang] || asset.bidang;
  const letakName = LETAK_RUANG_MAP[asset.letakRuang] || asset.letakRuang;
  return `No Seri: ${asset.noSeriFinal}
Nama Barang: ${asset.uraian}
Tahun: ${asset.tahun}
Bidang: ${bidangName}
Letak Ruang: ${letakName}
Kondisi: ${asset.kondisiBarang}`;
}

import initialUsers from "./initial_users.json";
import initialAssets from "./initial_assets.json";

// Master preloaded mock data representing high-quality initial list for Pringwulung Parish
export const INITIAL_USERS: User[] = initialUsers as User[];
export const INITIAL_ASSETS: Asset[] = (initialAssets as Asset[]).map(asset => ({ ...asset, kategoriAset: 'bergerak' }));
