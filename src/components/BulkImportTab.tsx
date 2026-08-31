/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  Asset, 
  calculateStraightLineDepreciation, 
  isAssetDepreciable,
  generateNoSeriFinal, 
  JENIS_ASET_MAP, 
  LETAK_RUANG_MAP,
  TERITORI_MAP,
  PERUNTUKAN_MAP,
  BIDANG_MAP
} from '../types';
import { 
  FileSpreadsheet, 
  Upload, 
  CheckCircle, 
  XOctagon, 
  HelpCircle, 
  Sparkles, 
  ArrowRight, 
  Download,
  Terminal,
  ShieldCheck,
  AlertCircle,
  Trash2
} from 'lucide-react';

interface BulkImportTabProps {
  onImportAssets: (importedAssets: Asset[], replaceExisting?: boolean) => void;
  onClearAllAssets: () => void;
  assetsLength: number;
  existingAssets?: Asset[];
  jenisAsetMap?: Record<string, string>;
  letakRuangMap?: Record<string, string>;
  teritoriMap?: Record<string, string>;
  peruntukanMap?: Record<string, string>;
  kodeNamaBarangMap?: Record<string, string>;
  bidangMap?: Record<string, string>;
}

export default function BulkImportTab({ 
  onImportAssets, 
  onClearAllAssets, 
  assetsLength,
  existingAssets = [],
  jenisAsetMap,
  letakRuangMap,
  teritoriMap,
  peruntukanMap,
  kodeNamaBarangMap,
  bidangMap
}: BulkImportTabProps) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number; items: any[]; successItems?: { asset: any; nomor: string }[]; failedItems?: { nomor: string; uraian: string; reason: string }[] } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [wipedMessage, setWipedMessage] = useState('');
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);

  // Template demo records that the user can instantly load or download 
  const SAMPLE_TEMPLATE_DATA = [
    {
      nomor: 1,
      uraian: "Kursi Pastor Jati Ukir Panti Imam",
      qty: 2,
      satuan: "unit",
      tanggalPerolehan: "2023-08-10",
      hargaPembelian: 12000000,
      kategoriAset: "bergerak",
      jenisAset: "410",
      teritori: "01",
      peruntukan: "01",
      letakRuang: "01",
      kodeNamaBarang: "2",
      umurManfaat: 10,
      kondisiBarang: "BAIK",
      bidang: "BDG-01"
    },
    {
      nomor: 2,
      uraian: "Tanah Gereja Pusat",
      qty: 1,
      satuan: "m2",
      tanggalPerolehan: "1990-01-01",
      hargaPembelian: 500000000,
      kategoriAset: "tidak_bergerak",
      jenisAset: "100",
      teritori: "01",
      peruntukan: "01",
      letakRuang: "00",
      kodeNamaBarang: "1",
      umurManfaat: 0,
      kondisiBarang: "BAIK",
      bidang: "BDG-01",
      landArea: 1500,
      certificateNumber: "HM.12345",
      propertyRights: "SHM",
      location: "Jl. Paroki No. 1"
    },
    {
      nomor: 3,
      uraian: "Proyektor Laser Epson EB-L530U (Komsos)",
      qty: 1,
      satuan: "unit",
      tanggalPerolehan: "2024-01-20",
      hargaPembelian: 27500000,
      kategoriAset: "bergerak",
      jenisAset: "408",
      teritori: "01",
      peruntukan: "01",
      letakRuang: "09",
      kodeNamaBarang: "77",
      umurManfaat: 5,
      kondisiBarang: "BAIK",
      bidang: "BDG-01"
    },
    {
      nomor: 4,
      uraian: "Gedung Karya Pastoral",
      qty: 1,
      satuan: "unit",
      tanggalPerolehan: "2015-06-01",
      hargaPembelian: 750000000,
      kategoriAset: "tidak_bergerak",
      jenisAset: "101",
      teritori: "01",
      peruntukan: "01",
      letakRuang: "00",
      kodeNamaBarang: "10",
      umurManfaat: 50,
      kondisiBarang: "BAIK",
      bidang: "BDG-01",
      landArea: 500,
      buildingArea: 800,
      totalFloors: 2,
      buildYear: 2015,
      buildingPermit: "IMB.9876"
    }
  ];

  // Helper for aligning descriptive texts back to codes
  const reverseLookup = (map: Record<string, string>, val: any, fallback: string): string => {
    if (val === undefined || val === null) return fallback;
    const strVal = String(val).trim();
    if (!strVal) return fallback;
    
    // 1. If it is already exactly a valid code in the map keys
    if (Object.prototype.hasOwnProperty.call(map, strVal)) {
      return strVal;
    }

    // 2. Try regex-based word boundary matching for codes (e.g. "410 - Mebel" matches key "410")
    for (const code of Object.keys(map)) {
      const escapedCode = code.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const codeRegex = new RegExp(`\\b${escapedCode}\\b`, 'i');
      if (codeRegex.test(strVal)) {
        return code;
      }
    }

    // 3. Try matching with zero padding (e.g. "1" -> "01", "8" -> "08")
    const padded = strVal.padStart(2, '0');
    if (Object.prototype.hasOwnProperty.call(map, padded)) {
      return padded;
    }
    
    const normalized = strVal.toLowerCase();
    
    // 4. Try exact label match
    for (const [code, label] of Object.entries(map)) {
      if (label.toLowerCase() === normalized) {
        return code;
      }
    }

    // 5. Try substring match
    for (const [code, label] of Object.entries(map)) {
      const labelLower = label.toLowerCase();
      if (labelLower.includes(normalized) || normalized.includes(labelLower)) {
        return code;
      }
    }
    
    return fallback;
  };

  // Flexible helper to read cell values when column headers have spelling/spacing/casing discrepancies
  const getFlexibleValue = (row: any, candidates: string[]): any => {
    if (!row || typeof row !== 'object') return undefined;
    const normCandidates = candidates.map(c => c.toLowerCase().replace(/[\s_-]+/g, ''));
    for (const key of Object.keys(row)) {
      const normKey = key.toLowerCase().replace(/[\s_-]+/g, '');
      if (normCandidates.includes(normKey)) {
        return row[key];
      }
    }
    return undefined;
  };

  const processRows = (rows: any[]) => {
    setLoading(true);
    setErrorMessage('');
    
    // Simulate slight delay for professional telemetry
    setTimeout(() => {
      try {
        let successCount = 0;
        let failedCount = 0;
        const validAssets: Asset[] = [];
        const failedItems: { nomor: string; uraian: string; reason: string }[] = [];
        const successItems: { asset: Asset; nomor: string }[] = [];

        rows.forEach((row, index) => {
          // Track row identifier
          const rawNomor = getFlexibleValue(row, ['nomor', 'no', 'urut', 'index', 'id']);
          const nomorRow = rawNomor ? String(rawNomor).trim() : String(index + 1);

          // Standard validation check with support for both Indonesian translated and English/Camel headers
          const rawUraian = getFlexibleValue(row, ['uraian', 'uraianBarang', 'uraian_barang', 'deskripsi', 'description', 'namaBarang', 'nama_barang', 'nama', 'barangNama', 'items', 'item']);
          const uraian = rawUraian ? String(rawUraian).trim() : '';

          const rawQty = getFlexibleValue(row, ['qty', 'quantity', 'jumlah', 'unit', 'volume', 'count']);
          const qty = Number(rawQty !== undefined && rawQty !== null && !isNaN(Number(rawQty)) ? Number(rawQty) : 1);

          const rawSatuan = getFlexibleValue(row, ['satuan', 'unitSatuan', 'satuanBarang', 'uom', 'measure']);
          const satuan = rawSatuan ? String(rawSatuan).trim() : 'unit';
          
          let tanggalPerolehan = getFlexibleValue(row, ['tanggalPerolehan', 'tanggal_perolehan', 'tanggal', 'date', 'acquisitionDate', 'tahunPerolehan', 'tahun']);
          // handle Date parsing or Excel serialized counts
          if (!tanggalPerolehan) {
            tanggalPerolehan = "2024-01-01";
          } else if (typeof tanggalPerolehan === 'number') {
            // Excel serial date integer format or just a year (e.g. 2020)
            if (tanggalPerolehan >= 1900 && tanggalPerolehan <= 2100) {
              tanggalPerolehan = `${tanggalPerolehan}-01-01`;
            } else {
              const parsedDate = new Date((tanggalPerolehan - 25567) * 86400 * 1000);
              if (!isNaN(parsedDate.getTime())) {
                tanggalPerolehan = parsedDate.toISOString().split('T')[0];
              } else {
                tanggalPerolehan = "2024-01-01";
              }
            }
          } else if (typeof tanggalPerolehan === 'string') {
            // Try cleaning string date or parsing
            let cleanDateStr = tanggalPerolehan.trim();
            // Handle Indonesian months
            const idMonths: Record<string, string> = {
              'januari': 'January', 'februari': 'February', 'maret': 'March',
              'mei': 'May', 'juni': 'June', 'juli': 'July',
              'agustus': 'August', 'oktober': 'October', 'desember': 'December'
            };
            for (const [id, en] of Object.entries(idMonths)) {
              cleanDateStr = cleanDateStr.replace(new RegExp(id, 'gi'), en);
            }
            
            const dateObj = new Date(cleanDateStr);
            if (!isNaN(dateObj.getTime())) {
              tanggalPerolehan = dateObj.toISOString().split('T')[0];
            } else {
              // Extract 4 digit year if possible
              const match = cleanDateStr.match(/\b(19|20)\d{2}\b/);
              if (match) {
                tanggalPerolehan = `${match[0]}-01-01`;
              } else {
                tanggalPerolehan = "2024-01-01";
              }
            }
          }

          const rawHarga = getFlexibleValue(row, ['hargaPembelian', 'harga_pembelian', 'harga', 'price', 'nilaiPerolehan', 'nilai_perolehan', 'jumlahHarga', 'cost', 'hargaBeli']);
          const hargaPembelian = Number(rawHarga !== undefined && rawHarga !== null && !isNaN(Number(rawHarga)) ? Number(rawHarga) : 0);
          
          // Optionally extract parts from existing formatted Serial Number if provided
          const rawSerialCode = getFlexibleValue(row, ['noSeriFinal', 'no_seri_final', 'noSeri', 'serialCode', 'serialNumber', 'kodeSeri', 'seri', 'kodeUnik']);
          
          let parsedJenisAset: string | undefined = undefined;
          let parsedTahun: number | undefined = undefined;
          let parsedTeritori: string | undefined = undefined;
          let parsedLetakRuang: string | undefined = undefined;
          let parsedPeruntukan: string | undefined = undefined;
          let parsedKodeNamaBarang: string | undefined = undefined;

          if (rawSerialCode && typeof rawSerialCode === 'string') {
            const cleanSerial = rawSerialCode.trim();
            if (cleanSerial.includes('-')) {
              // New template layout: 403-2020-1-8-1-17-001 (7 segments)
              const parts = cleanSerial.split('-');
              if (parts.length >= 7) {
                parsedJenisAset = parts[0];
                parsedTahun = Number(parts[1]) || undefined;
                parsedTeritori = parts[2];
                parsedLetakRuang = parts[3];
                parsedPeruntukan = parts[4];
                parsedKodeNamaBarang = parts[5];
                if (!parsedKodeNamaBarang) parsedKodeNamaBarang = parts[6];
              } else if (parts.length === 6) {
                parsedJenisAset = parts[0];
                parsedTahun = Number(parts[1]) || undefined;
                parsedTeritori = parts[2];
                parsedLetakRuang = parts[3];
                parsedPeruntukan = parts[4];
                parsedKodeNamaBarang = parts[5];
              } else if (parts.length === 5) {
                parsedJenisAset = parts[0];
                parsedTeritori = parts[1];
                parsedPeruntukan = parts[2];
                parsedLetakRuang = parts[3];
                parsedKodeNamaBarang = parts[4];
              }
            } else if (cleanSerial.includes('.')) {
              // Legacy layout
              const parts = cleanSerial.split('.');
              if (parts.length >= 5) {
                parsedJenisAset = parts[0];
                parsedTeritori = parts[1];
                parsedPeruntukan = parts[2];
                parsedLetakRuang = parts[3];
                parsedKodeNamaBarang = parts[4];
              }
            }
          }

          // Segments matching
          const rawJenisAset = getFlexibleValue(row, ['jenisAset', 'jenis_aset', 'kategori', 'kategoriAkses', 'kategoriKode', 'category', 'jenis']) || parsedJenisAset;
          const rawTeritori = getFlexibleValue(row, ['teritori', 'wilayah', 'stasi', 'territory', 'stasiKode', 'wilayahKode']) || parsedTeritori;
          const rawPeruntukan = getFlexibleValue(row, ['peruntukan', 'peruntukanKode', 'allocation', 'tujuan']) || parsedPeruntukan;
          const rawLetakRuang = getFlexibleValue(row, ['letakRuang', 'letak_ruang', 'letakRuangan', 'ruangan', 'ruang', 'lokasi', 'room', 'location', 'letak', 'koderuang']) || parsedLetakRuang;
          
          const rawKodeNamaBarang = getFlexibleValue(row, ['kodeNamaBarang', 'kodeBarang', 'kodeNama', 'itemCode', 'barangKode', 'kodetipe', 'tipe']) || parsedKodeNamaBarang;
          const rawNoUrutSejenis = getFlexibleValue(row, ['noUrutSejenis', 'noUrut', 'urut', 'sequenceNumber', 'seq', 'nomorurut']);
          const rawBidang = getFlexibleValue(row, ['bidang', 'fungsi', 'bidangTerkoordinasi', 'fungsiTerkoordinasi', 'kategoriBidang']);

          const rawKategoriAset = getFlexibleValue(row, ['kategoriAset', 'kategori_aset', 'kategori']);
          const rawLandArea = getFlexibleValue(row, ['landArea', 'luasTanah']);
          const rawCertificateNumber = getFlexibleValue(row, ['certificateNumber', 'nomorSertifikat', 'noSertifikat']);
          const rawPropertyRights = getFlexibleValue(row, ['propertyRights', 'hakMilik', 'hakTanggungan']);
          const rawLocation = getFlexibleValue(row, ['location', 'lokasi', 'alamat']);
          const rawBuildingArea = getFlexibleValue(row, ['buildingArea', 'luasBangunan']);
          const rawTotalFloors = getFlexibleValue(row, ['totalFloors', 'jumlahLantai']);
          const rawBuildYear = getFlexibleValue(row, ['buildYear', 'tahunBangun']);
          const rawBuildingPermit = getFlexibleValue(row, ['buildingPermit', 'imb', 'nomorIMB']);

          // Standardize Segments Codes against master lists
          const jenisAset = reverseLookup(jenisAsetMap || JENIS_ASET_MAP, rawJenisAset, '403');
          
          let kategoriAset = rawKategoriAset ? String(rawKategoriAset).trim().toLowerCase() : undefined;
          if (kategoriAset !== 'bergerak' && kategoriAset !== 'tidak_bergerak') {
            kategoriAset = ['100', '101', '401'].includes(jenisAset) ? 'tidak_bergerak' : 'bergerak';
          }
          const teritori = reverseLookup(teritoriMap || TERITORI_MAP, rawTeritori, '01');
          const peruntukan = reverseLookup(peruntukanMap || PERUNTUKAN_MAP, rawPeruntukan, '01');
          const letakRuang = reverseLookup(letakRuangMap || LETAK_RUANG_MAP, rawLetakRuang, '02');
          
          const bidang = rawBidang ? reverseLookup(bidangMap || BIDANG_MAP, rawBidang, '') : '';
          
          const kodeNamaBarang = rawKodeNamaBarang ? String(rawKodeNamaBarang).trim() : '1';
          let noUrutSejenis = rawNoUrutSejenis ? String(rawNoUrutSejenis).trim() : '1';
          if (/^0+\d+$/.test(noUrutSejenis)) {
            noUrutSejenis = String(Number(noUrutSejenis)); // strip leading zeros
          }

          const rawUmur = getFlexibleValue(row, ['umurManfaat', 'umur_manfaat', 'masaManfaat', 'usiaEkonomis', 'usefulLife', 'umur', 'manfaat']);
          const umurManfaat = Number(rawUmur !== undefined && rawUmur !== null && !isNaN(Number(rawUmur)) ? Number(rawUmur) : 5);
          
          // Conditions intelligent mapping
          const rawKondisi = getFlexibleValue(row, ['kondisiBarang', 'kondisi', 'condition', 'status', 'keadaan']) || 'BAIK';
          let kondisiBarang = 'BAIK';
          if (rawKondisi) {
            const cleanKondisi = String(rawKondisi).trim().toUpperCase().replace(/[\s_-]+/g, '_');
            if (cleanKondisi === 'BAIK' || cleanKondisi === 'RUSAK_RINGAN' || cleanKondisi === 'RUSAK_BERAT') {
              kondisiBarang = cleanKondisi;
            } else if (cleanKondisi === 'RUSAK' || cleanKondisi === 'BROKEN') {
              kondisiBarang = 'RUSAK_BERAT';
            } else if (cleanKondisi.includes('RINGAN')) {
              kondisiBarang = 'RUSAK_RINGAN';
            } else if (cleanKondisi.includes('BERAT') || cleanKondisi.includes('PARAH')) {
              kondisiBarang = 'RUSAK_BERAT';
            } else if (cleanKondisi.includes('BAGUS') || cleanKondisi.includes('NORMAL')) {
              kondisiBarang = 'BAIK';
            }
          }

          // Validation rules validation (Uraian is required, and prices/years must be greater than zero)
          if (!uraian || hargaPembelian < 0 || calendarYearOf(tanggalPerolehan) <= 0 || umurManfaat < 0) {
            failedCount++;
            let reason = "Data tidak lengkap atau tidak valid.";
            if (!uraian) reason = "Uraian kosong.";
            else if (hargaPembelian < 0) reason = "Harga negatif.";
            else if (umurManfaat < 0) reason = "Umur manfaat negatif.";
            
            failedItems.push({ nomor: nomorRow, uraian: uraian || "(Tanpa Nama)", reason });
            return;
          }

          const depr = calculateStraightLineDepreciation(
            hargaPembelian,
            0, // System calculated (forced to 0)
            umurManfaat,
            tanggalPerolehan,
            new Date().toISOString(),
            isAssetDepreciable({ jenisAset })
          );

          // Generate assets based on qty (expand mass qty into individual records to prevent data loss/collisions)
          const baseKey = `${jenisAset}-${teritori}-${peruntukan}-${letakRuang}-${kodeNamaBarang}`;
          
          // Find max urut from validAssets for this baseKey
          let maxUrut = 0;
          for (const va of validAssets) {
            const vaBase = `${va.jenisAset}-${va.teritori}-${va.peruntukan}-${va.letakRuang}-${va.kodeNamaBarang}`;
            if (vaBase === baseKey) {
              const u = parseInt(va.noUrutSejenis, 10);
              if (!isNaN(u) && u > maxUrut) maxUrut = u;
            }
          }
          if (!replaceExisting) {
            for (const ea of existingAssets) {
              const eaBase = `${ea.jenisAset}-${ea.teritori}-${ea.peruntukan}-${ea.letakRuang}-${ea.kodeNamaBarang}`;
              if (eaBase === baseKey) {
                const u = parseInt(ea.noUrutSejenis, 10);
                if (!isNaN(u) && u > maxUrut) maxUrut = u;
              }
            }
          }

          // Secara otomatis menetapkan nomor urut (no. urut) berbasis hitungan (1, 2, 3...)
          let startUrut = maxUrut + 1;

          for (let i = 0; i < qty; i++) {
            const currentUrut = String(startUrut + i);
            const serialCode = generateNoSeriFinal({
              jenisAset,
              teritori,
              peruntukan,
              letakRuang,
              kodeNamaBarang,
              tahun: calendarYearOf(tanggalPerolehan),
              tanggalPerolehan,
              noUrutSejenis: currentUrut
            });

            // Build valid Asset model (qty is forced to 1 for individual atomic records)
            const newAsset: Asset = {
              id: `as-import-${successCount}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              uraian,
              qty: 1,
              satuan,
              tanggalPerolehan,
              hargaPembelian,
              kategoriAset: kategoriAset as 'bergerak' | 'tidak_bergerak',
              jenisAset,
              tahun: calendarYearOf(tanggalPerolehan),
              teritori,
              peruntukan,
              letakRuang,
              noUrutSejenis: currentUrut,
              kodeNamaBarang,
              noSeriFinal: serialCode,
              umurManfaat,
              nilaiResidu: 0,
              nilaiBuku: depr.nilaiBuku,
              biayaPenyusutan: depr.biayaPenyusutan,
              kondisiBarang: kondisiBarang as any,
              bidang: bidang,
              landArea: rawLandArea !== undefined ? Number(rawLandArea) : undefined,
              certificateNumber: rawCertificateNumber ? String(rawCertificateNumber) : undefined,
              propertyRights: rawPropertyRights ? String(rawPropertyRights) : undefined,
              location: rawLocation ? String(rawLocation) : undefined,
              buildingArea: rawBuildingArea !== undefined ? Number(rawBuildingArea) : undefined,
              totalFloors: rawTotalFloors !== undefined ? Number(rawTotalFloors) : undefined,
              buildYear: rawBuildYear !== undefined ? Number(rawBuildYear) : undefined,
              buildingPermit: rawBuildingPermit ? String(rawBuildingPermit) : undefined,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              maintenanceLogs: [],
              mutations: [],
              documents: []
            };

            validAssets.push(newAsset);
            successItems.push({ asset: newAsset, nomor: nomorRow });
            successCount++;
          }
        });

        // Small utility to return safe numeric year
        function calendarYearOf(dateStr: string): number {
          try {
            const yr = new Date(dateStr).getFullYear();
            return isNaN(yr) ? new Date().getFullYear() : yr;
          } catch {
            return new Date().getFullYear();
          }
        }

        if (validAssets.length > 0) {
          onImportAssets(validAssets, replaceExisting);
        }

        setResults({
          success: successCount,
          failed: failedCount,
          items: validAssets,
          successItems: successItems,
          failedItems: failedItems
        });

      } catch (err: any) {
        console.error(err);
        setErrorMessage(`Terjadi kegagalan mengurai format: ${err.message || 'Struktur Excel tidak kompatibel'}`);
      } finally {
        setLoading(false);
      }
    }, 1200);
  };

  // Click file processing handle
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    parseFile(file);
  };

  const parseFile = (file: File) => {
    setLoading(true);
    setResults(null);
    setErrorMessage('');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonRows = XLSX.utils.sheet_to_json(sheet);
        
        if (jsonRows.length === 0) {
          setErrorMessage('File Excel kosong atau tidak terdeteksi baris data.');
          setLoading(false);
          return;
        }

        processRows(jsonRows);

      } catch (err: any) {
        setErrorMessage(`Gagal membaca file Excel: ${err.message}`);
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setErrorMessage('Terjadi error pembacaan file sistem lokal.');
      setLoading(false);
    };

    reader.readAsBinaryString(file);
  };

  // Drag Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      parseFile(file);
    }
  };

  // Instant simulate import demo workbook
  const handleTriggerDemoImport = () => {
    setResults(null);
    setLoading(true);
    processRows(SAMPLE_TEMPLATE_DATA);
  };

  // Export template helper: downloads standard columns mapping 
  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet(SAMPLE_TEMPLATE_DATA);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "TempAsetParoki");
    XLSX.writeFile(wb, "template_import_aset_gereja.xlsx");
    alert("✓ File template_import_aset_gereja.xlsx diunduh berhasil!");
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Guidelines */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 space-y-2">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
            <FileSpreadsheet className="w-4.5 h-4.5 text-indigo-600" />
            Panduan Struktur Lembar Masukan Aset (Bulk Import)
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Sistem pengunggahan massal mendukung akselerasi registrasi inventaris gereja dari lembar kerja Excel (.xlsx, .xls) atau CSV. Nilai depresiasi straight-line dan kode segmen penomoran No Seri Final akan dihitung otomatis oleh sistem pada saat data masuk. [1, 2, 10].
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 pt-2 text-[11px] text-slate-500 font-medium">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
              <span><strong>kategoriAset</strong>: bergerak / tidak_bergerak</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
              <span><strong>Uraian</strong>: Nama barang (Wajib)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
              <span><strong>hargaPembelian</strong>: Harga satuan perolehan (Wajib)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
              <span><strong>jenisAset</strong>: Kode Jenis, misal 100, 101, 403</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
              <span><strong>letakRuang</strong>: Kode Ruang, misal 02, 09</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
              <span><strong>umurManfaat</strong>: Usia ekonomis dalam thn</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
              <span><strong>bidang</strong>: Kode Bidang / Fungsi, misal BDG-01</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
              <span><strong>Atribut Tidak Bergerak</strong>: landArea, certificateNumber, location, buildingArea</span>
            </div>
          </div>
        </div>

        {/* Templates actions column */}
        <div className="md:col-span-4 bg-slate-50/60 dark:bg-slate-900/40 dark:border-slate-800 p-4 rounded-xl border border-slate-100 flex flex-col justify-center gap-3">
          <button
            onClick={handleDownloadTemplate}
            className="w-full bg-white text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Download className="w-4 h-4 text-slate-400" />
            Unduh Template Excel
          </button>
          
          <button
            onClick={handleTriggerDemoImport}
            className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 text-xs font-semibold py-2 px-2.5 rounded-lg flex items-center justify-center gap-2 transition"
          >
            <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
            Simulasi Impor Instan
          </button>
        </div>
      </div>

      {/* Opsi Sinkronisasi & Penghapusan Database */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-primary-600" />
              Konfigurasi Penyelarasan & Sinkronisasi Data
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Tentukan bagaimana data dari lembar Excel diselaraskan dengan database register paroki. Anda dapat mengosongkan seluruh data terlebih dahulu.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowWipeConfirm(true)}
              className="bg-red-50 hover:bg-red-100 text-rose-700 border border-red-200 text-[11px] font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              Kosongkan Seluruh Data Saat Ini
            </button>
          </div>
        </div>

        {wipedMessage && (
          <div className="bg-amber-50 text-amber-800 p-3 rounded-lg border border-amber-200 text-xs flex items-center gap-2 animate-fade-in font-medium">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            {wipedMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Mode Append Option */}
          <label className={`border rounded-xl p-3 cursor-pointer flex items-start gap-3 transition ${
            !replaceExisting 
              ? 'border-indigo-500 bg-indigo-50/20 text-indigo-900 shadow-sm' 
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}>
            <input 
              type="radio" 
              name="import-overwrite-mode" 
              checked={!replaceExisting} 
              onChange={() => setReplaceExisting(false)}
              className="mt-0.5 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 shrink-0"
            />
            <div>
              <span className="font-bold block text-[11px] uppercase tracking-wide">Gabungkan Data (Append Mode)</span>
              <span className="text-[10px] text-slate-500 block mt-0.5 leading-relaxed">
                Tambahkan baris aset baru dari Excel ke dalam database register tanpa menghapus {assetsLength} unit aset terdaftar saat ini.
              </span>
            </div>
          </label>

          {/* Mode Overwrite Option */}
          <label className={`border rounded-xl p-3 cursor-pointer flex items-start gap-3 transition ${
            replaceExisting 
              ? 'border-indigo-500 bg-indigo-50/20 text-indigo-900 shadow-sm' 
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}>
            <input 
              type="radio" 
              name="import-overwrite-mode" 
              checked={replaceExisting} 
              onChange={() => setReplaceExisting(true)}
              className="mt-0.5 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 shrink-0"
            />
            <div>
              <span className="font-bold block text-[11px] uppercase tracking-wide text-indigo-950">Kosongkan & Ganti Semua (Overwrite Mode)</span>
              <span className="text-[10px] text-slate-500 block mt-0.5 leading-relaxed">
                Hapus dan kosongkan seluruh database register {assetsLength} unit aset paroki terlebih dahulu, kemudian simpan <strong>hanya</strong> data baru terupload.
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Upload zone */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition ${
            dragOver 
              ? 'bg-indigo-50/60 border-indigo-500' 
              : 'bg-slate-50 hover:bg-slate-100/50 border-slate-200'
          }`}
          onClick={() => {
            const el = document.getElementById('excel-file-uploader');
            if (el) el.click();
          }}
        >
          <input 
            type="file" 
            id="excel-file-uploader" 
            className="hidden" 
            accept=".xlsx, .xls, .csv" 
            onChange={handleFileChange}
            disabled={loading}
          />
          
          <div className="p-4 bg-white rounded-full shadow-sm text-slate-400 border border-slate-100">
            <Upload className="w-7 h-7 text-indigo-600 animate-bounce" />
          </div>

          <div className="text-center">
            <span className="text-sm font-bold text-slate-700 block">Tarik & Letakkan Berkas atau Klik untuk Memilih</span>
            <span className="text-xs text-slate-400 block mt-0.5">Mendukung format lembar XLSX, XLS, atau CSV hingga 10MB</span>
          </div>
        </div>

        {/* Loading overlay indicator */}
        {loading && (
          <div className="mt-6 flex flex-col items-center justify-center py-4 text-center space-y-2">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-xs font-semibold text-slate-600">
              Sedang mengurai dan memvalidasi model relasi database paroki...
            </div>
          </div>
        )}

        {/* Results report summary block */}
        {results && (
          <div id="bulk-import-status" className="mt-6 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border dark:border-slate-800 border-slate-100 space-y-4 animate-fade-in text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                <ShieldCheck className="w-4.5 h-4.5 text-primary-500" />
                Laporan Hasil Impor Data Inventaris
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">
                Total Aset Terdaftar: <strong className="text-slate-800">{assetsLength}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-primary-50/50 p-4 rounded-xl border border-primary-100 flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-primary-500 shrink-0" />
                <div>
                  <span className="text-[10px] text-primary-600 font-bold uppercase block">Berhasil Diimpor</span>
                  <span className="text-xl font-bold font-mono text-primary-800">{results.success} unit</span>
                  <p className="text-[10px] text-primary-700 mt-0.5">Nilai buku & Seri-Final terbuat sempurna.</p>
                </div>
              </div>

              <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 flex items-center gap-3">
                <XOctagon className="w-8 h-8 text-rose-500 shrink-0" />
                <div>
                  <span className="text-[10px] text-rose-600 font-bold uppercase block">Baris Gagal (Validasi Eror)</span>
                  <span className="text-xl font-bold font-mono text-rose-800">{results.failed} baris</span>
                  <p className="text-[10px] text-rose-700 mt-0.5">Dilewati karena ketidaktersediaan harga/nama.</p>
                </div>
              </div>
            </div>
            
            {results.failedItems && results.failedItems.length > 0 && (
              <div className="space-y-2 mt-4 p-4 bg-red-50 border border-red-100 rounded-xl">
                <span className="font-bold text-red-700 uppercase tracking-wide block text-xs">Daftar Baris Gagal:</span>
                <div className="overflow-x-auto max-h-40 overflow-y-auto rounded-lg">
                  <table className="min-w-full divide-y divide-red-200 text-left text-[11px]">
                    <thead className="bg-red-100/50 text-red-700 sticky top-0 font-bold uppercase text-[9px] tracking-wide">
                      <tr>
                        <th className="px-3 py-2">No</th>
                        <th className="px-3 py-2">Uraian</th>
                        <th className="px-3 py-2">Alasan Kegagalan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-red-100 bg-white/50 text-red-800">
                      {results.failedItems.map((fi, i) => (
                        <tr key={i} className="hover:bg-red-50 transition-colors">
                          <td className="px-3 py-2 font-mono">{fi.nomor}</td>
                          <td className="px-3 py-2 font-medium">{fi.uraian}</td>
                          <td className="px-3 py-2">{fi.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Imported Rows Preview table snippet */}
            {results.items.length > 0 && (
              <div className="space-y-2">
                <span className="font-bold text-slate-700 uppercase tracking-wide block">Data Baru Terimpor:</span>
                <div className="overflow-x-auto max-h-48 overflow-y-auto border border-slate-100 rounded-lg">
                  <table className="min-w-full divide-y divide-slate-100 text-left text-[11px]">
                    <thead className="bg-slate-100 text-slate-500 sticky top-0 font-bold uppercase text-[9px] tracking-wide">
                      <tr>
                        <th className="px-4 py-2">No. Excel</th>
                        <th className="px-4 py-2">No Seri Final</th>
                        <th className="px-4 py-2">Uraian</th>
                        <th className="px-4 py-2">Tanggal Perolehan</th>
                        <th className="px-4 py-2">Harga Perolehan</th>
                        <th className="px-4 py-2">Fisik</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600 bg-white">
                      {(results.successItems || results.items.map(it => ({ asset: it, nomor: '-' }))).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                          <td className="px-4 py-2 font-mono font-bold">{item.nomor}</td>
                          <td className="px-4 py-2 font-mono text-indigo-600 font-bold">{item.asset.noSeriFinal}</td>
                          <td className="px-4 py-2 font-medium text-slate-800">{item.asset.uraian}</td>
                          <td className="px-4 py-2">{item.asset.tanggalPerolehan}</td>
                          <td className="px-4 py-2 font-mono">{item.asset.hargaPembelian.toLocaleString('id-ID')}</td>
                          <td className="px-4 py-2">
                            <span className="bg-primary-50 text-primary-700 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                              {item.asset.kondisiBarang}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {errorMessage && (
          <div className="mt-6 bg-red-50 text-red-800 p-4 rounded-xl border border-red-100 flex items-start gap-2.5 text-xs">
            <AlertCircle className="w-4.5 h-4.5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block uppercase tracking-wide">Kegagalan Unggah Massal</span>
              <p className="leading-relaxed mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

      </div>

      {/* Visual Terminal logger displaying standard console messages */}
      <div className="bg-slate-900 text-slate-300 rounded-xl p-4 border border-slate-800 shadow-md flex items-start gap-3">
        <Terminal className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="font-mono text-[10px] space-y-1 w-full overflow-hidden">
          <span className="text-slate-400 font-bold block uppercase tracking-widest text-[9px]">CONSOLE PARSER LOGSTREAM</span>
          <div className="text-indigo-400">SIM-GEREJA_PRINGWULUNG v2.4.0 ON localhost:3000</div>
          <div>[INFO] Waiting in local listener for file events. Handler active.</div>
          {results && (
            <>
              <div className="text-primary-400">[PARSER] Excel parsed rows successfully: {results.items.length + results.failed} items found.</div>
              <div className="text-primary-400">[DB] Appended {results.success} elements into state. State size: {assetsLength} items.</div>
              <div>[INFO] Recalculating Straight-line book values using days resolution coeff 365.25 [10]. Done.</div>
            </>
          )}
        </div>
      </div>

      {/* ⚠️ DIALOG KONFIRMASI KOSONGKAN REGISTER KUSTOM */}
      {showWipeConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col p-6 space-y-4 animate-fade-in text-left border border-slate-200">
            <div className="flex items-center gap-3 text-red-650 text-red-600">
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Kosongkan Database Register Aset</h3>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin mengosongkan seluruh database Register Aset saat ini? Tindakan ini akan menghapus semua aset yang terdaftar di sistem. Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowWipeConfirm(false)}
                className="flex-1 bg-white hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 font-semibold text-xs py-2.5 rounded-lg border border-slate-205 transition cursor-pointer text-center"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearAllAssets();
                  setWipedMessage("✓ Seluruh database register aset berhasil dikosongkan! Sesi aplikasi kini bersih tanpa ada data contoh bawaan.");
                  setResults(null);
                  setShowWipeConfirm(false);
                  setTimeout(() => setWipedMessage(''), 6050);
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs py-2.5 rounded-lg shadow-md transition cursor-pointer text-center"
              >
                Ya, Kosongkan Semua
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
