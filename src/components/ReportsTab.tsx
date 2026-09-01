import React, { useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Download, FileSpreadsheet, FileText, Filter, RotateCcw, Search } from 'lucide-react';
import { Asset, BIDANG_MAP, JENIS_ASET_MAP, LETAK_RUANG_MAP, KondisiBarang, formatRupiah } from '../types';

interface ReportsTabProps {
  assets: Asset[];
  jenisAsetMap?: Record<string, string>;
  letakRuangMap?: Record<string, string>;
  bidangMap?: Record<string, string>;
}

const conditionLabels: Record<KondisiBarang, string> = {
  BAIK: 'Baik',
  RUSAK_RINGAN: 'Rusak Ringan',
  RUSAK_BERAT: 'Rusak Berat'
};

const formatDate = (value: string) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('id-ID');
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export default function ReportsTab({ assets, jenisAsetMap, letakRuangMap, bidangMap }: ReportsTabProps) {
  const jMap = jenisAsetMap || JENIS_ASET_MAP;
  const lMap = letakRuangMap || LETAK_RUANG_MAP;
  const bMap = bidangMap || BIDANG_MAP;
  const [searchTerm, setSearchTerm] = useState('');
  const [roomFilter, setRoomFilter] = useState('ALL');
  const [bidangFilter, setBidangFilter] = useState('ALL');
  const [jenisFilter, setJenisFilter] = useState('ALL');
  const [conditionFilter, setConditionFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const options = useMemo(() => ({
    rooms: [...new Set(assets.map(asset => asset.letakRuang).filter(Boolean))].sort(),
    bidang: [...new Set(assets.map(asset => asset.bidang).filter(Boolean))].sort(),
    jenis: [...new Set(assets.map(asset => asset.jenisAset).filter(Boolean))].sort(),
    years: [...new Set(assets.map(asset => String(asset.tahun || '')).filter(Boolean))].sort((a, b) => Number(b) - Number(a))
  }), [assets]);

  const filteredAssets = useMemo(() => assets.filter(asset => {
    const query = searchTerm.trim().toLowerCase();
    const searchable = [asset.uraian, asset.noSeriFinal, asset.kodeNamaBarang, jMap[asset.jenisAset], lMap[asset.letakRuang], bMap[asset.bidang || '']]
      .filter(Boolean).join(' ').toLowerCase();
    return (!query || searchable.includes(query))
      && (roomFilter === 'ALL' || asset.letakRuang === roomFilter)
      && (bidangFilter === 'ALL' || asset.bidang === bidangFilter)
      && (jenisFilter === 'ALL' || asset.jenisAset === jenisFilter)
      && (conditionFilter === 'ALL' || asset.kondisiBarang === conditionFilter)
      && (yearFilter === 'ALL' || String(asset.tahun) === yearFilter)
      && (categoryFilter === 'ALL' || (asset.kategoriAset || 'bergerak') === categoryFilter);
  }), [assets, searchTerm, roomFilter, bidangFilter, jenisFilter, conditionFilter, yearFilter, categoryFilter, jMap, lMap, bMap]);

  const totals = useMemo(() => filteredAssets.reduce((summary, asset) => {
    const qty = Number(asset.qty) || 0;
    const acquisition = Number(asset.hargaPembelian) || 0;
    const bookValue = Number(asset.nilaiBuku) || 0;
    summary.units += qty;
    summary.acquisition += acquisition;
    summary.bookValue += bookValue;
    summary.accumulatedDepreciation += Math.max(0, acquisition - bookValue);
    return summary;
  }, { units: 0, acquisition: 0, bookValue: 0, accumulatedDepreciation: 0 }), [filteredAssets]);

  const resetFilters = () => {
    setSearchTerm('');
    setRoomFilter('ALL');
    setBidangFilter('ALL');
    setJenisFilter('ALL');
    setConditionFilter('ALL');
    setYearFilter('ALL');
    setCategoryFilter('ALL');
  };

  const reportRows = filteredAssets.map((asset, index) => ({
    no: index + 1,
    kode: asset.noSeriFinal,
    uraian: asset.uraian,
    tanggal: formatDate(asset.tanggalPerolehan),
    tahun: asset.tahun,
    qty: asset.qty,
    satuan: asset.satuan,
    kategori: jMap[asset.jenisAset] || asset.jenisAset,
    lokasi: lMap[asset.letakRuang] || asset.letakRuang,
    bidang: bMap[asset.bidang || ''] || asset.bidang || '-',
    kondisi: conditionLabels[asset.kondisiBarang] || asset.kondisiBarang,
    acquisition: Number(asset.hargaPembelian) || 0,
    accumulatedDepreciation: Math.max(0, (Number(asset.hargaPembelian) || 0) - (Number(asset.nilaiBuku) || 0)),
    bookValue: Number(asset.nilaiBuku) || 0
  }));

  const handleExportExcel = () => {
    const rows = reportRows.map(row => ({
      'No.': row.no,
      'Kode Aset / No. Seri Final': row.kode,
      'Uraian / Nama Barang': row.uraian,
      'Tanggal Perolehan': row.tanggal,
      'Tahun': row.tahun,
      'Qty': row.qty,
      'Satuan': row.satuan,
      'Jenis Aset': row.kategori,
      'Letak Ruang': row.lokasi,
      'Bidang': row.bidang,
      'Kondisi': row.kondisi,
      'Harga Perolehan': row.acquisition,
      'Akumulasi Penyusutan': row.accumulatedDepreciation,
      'Nilai Buku': row.bookValue
    }));
    const summaryRows = [
      { 'Ringkasan': 'Jumlah Unit', 'Nilai': totals.units },
      { 'Ringkasan': 'Harga Perolehan', 'Nilai': totals.acquisition },
      { 'Ringkasan': 'Akumulasi Penyusutan', 'Nilai': totals.accumulatedDepreciation },
      { 'Ringkasan': 'Nilai Buku', 'Nilai': totals.bookValue }
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Daftar Inventaris');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summaryRows), 'Ringkasan Akuntansi');
    XLSX.writeFile(workbook, `laporan-inventaris-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportPdf = () => {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const date = new Date().toLocaleDateString('id-ID');
    doc.setFontSize(15);
    doc.text('LAPORAN INVENTARIS ASET', 14, 16);
    doc.setFontSize(9);
    doc.text('Paroki Pringwulung · Format pencatatan akuntansi', 14, 22);
    doc.text(`Dicetak: ${date} · ${filteredAssets.length} baris aset`, 14, 28);
    autoTable(doc, {
      startY: 34,
      head: [['No', 'Kode Aset', 'Uraian', 'Tgl Perolehan', 'Qty', 'Jenis Aset', 'Lokasi', 'Bidang', 'Kondisi', 'Harga Perolehan', 'Akum. Penyusutan', 'Nilai Buku']],
      body: reportRows.map(row => [row.no, row.kode, row.uraian, row.tanggal, `${row.qty} ${row.satuan}`, row.kategori, row.lokasi, row.bidang, row.kondisi, formatRupiah(row.acquisition), formatRupiah(row.accumulatedDepreciation), formatRupiah(row.bookValue)]),
      styles: { fontSize: 6.5, cellPadding: 1.8 },
      headStyles: { fillColor: [30, 64, 175], textColor: 255 },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      columnStyles: { 2: { cellWidth: 35 }, 9: { halign: 'right' }, 10: { halign: 'right' }, 11: { halign: 'right' } }
    });
    const finalY = (doc as any).lastAutoTable?.finalY || 34;
    doc.setFontSize(8);
    doc.text(`Jumlah Unit: ${totals.units} · Harga Perolehan: ${formatRupiah(totals.acquisition)} · Akumulasi Penyusutan: ${formatRupiah(totals.accumulatedDepreciation)} · Nilai Buku: ${formatRupiah(totals.bookValue)}`, 14, finalY + 8);
    doc.save(`laporan-inventaris-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const selectClass = 'w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/30';
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary-500" />
          <h2 className="text-lg font-bold text-slate-900">Pelaporan</h2>
        </div>
        <p className="text-xs text-slate-500">Laporan inventaris dan ringkasan pencatatan akuntansi berdasarkan data aset tersaring.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          ['Jumlah Unit', totals.units.toLocaleString('id-ID'), 'text-slate-900'],
          ['Harga Perolehan', formatRupiah(totals.acquisition), 'text-blue-600'],
          ['Akumulasi Penyusutan', formatRupiah(totals.accumulatedDepreciation), 'text-amber-600'],
          ['Nilai Buku', formatRupiah(totals.bookValue), 'text-emerald-600']
        ].map(([label, value, color]) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
            <div className={`mt-2 text-lg font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800"><Filter className="w-4 h-4 text-primary-500" /> Filter Laporan</div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleExportPdf} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700"><Download className="w-3.5 h-3.5" /> PDF</button>
            <button type="button" onClick={handleExportExcel} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"><FileSpreadsheet className="w-3.5 h-3.5" /> Excel</button>
            <button type="button" onClick={resetFilters} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input value={searchTerm} onChange={event => setSearchTerm(event.target.value)} placeholder="Cari uraian, kode aset, kategori, ruangan..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <select value={roomFilter} onChange={event => setRoomFilter(event.target.value)} className={selectClass}><option value="ALL">Semua Ruangan</option>{options.rooms.map(code => <option key={code} value={code}>{lMap[code] || code}</option>)}</select>
          <select value={bidangFilter} onChange={event => setBidangFilter(event.target.value)} className={selectClass}><option value="ALL">Semua Bidang</option>{options.bidang.map(code => <option key={code} value={code}>{bMap[code] || code}</option>)}</select>
          <select value={jenisFilter} onChange={event => setJenisFilter(event.target.value)} className={selectClass}><option value="ALL">Semua Jenis Aset</option>{options.jenis.map(code => <option key={code} value={code}>{jMap[code] || code}</option>)}</select>
          <select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)} className={selectClass}><option value="ALL">Semua Kategori</option><option value="bergerak">Aset Bergerak</option><option value="tidak_bergerak">Aset Tidak Bergerak</option></select>
          <select value={conditionFilter} onChange={event => setConditionFilter(event.target.value)} className={selectClass}><option value="ALL">Semua Kondisi</option>{Object.entries(conditionLabels).map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select>
          <select value={yearFilter} onChange={event => setYearFilter(event.target.value)} className={selectClass}><option value="ALL">Semua Tahun</option>{options.years.map(year => <option key={year} value={year}>{year}</option>)}</select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200">
          <div><h3 className="text-sm font-bold text-slate-800">Daftar Inventaris</h3><p className="text-[11px] text-slate-500">Menampilkan {filteredAssets.length.toLocaleString('id-ID')} dari {assets.length.toLocaleString('id-ID')} baris aset</p></div>
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Basis akrual · IDR</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1120px] w-full text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wide text-[10px]"><tr>{['No', 'Kode Aset', 'Uraian / Penempatan', 'Tgl Perolehan', 'Jenis Aset', 'Lokasi', 'Bidang', 'Kondisi', 'Harga Perolehan', 'Akum. Penyusutan', 'Nilai Buku'].map(header => <th key={header} className="px-3 py-3 text-left font-bold">{header}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">{reportRows.slice(0, 100).map(row => <tr key={`${row.kode}-${row.no}`} className="hover:bg-slate-50/80"><td className="px-3 py-3 text-slate-400">{row.no}</td><td className="px-3 py-3 font-semibold text-primary-600 whitespace-nowrap">{row.kode}</td><td className="px-3 py-3 min-w-[220px]"><div className="font-semibold text-slate-800">{row.uraian}</div><div className="text-[10px] text-slate-400">{row.qty} {row.satuan}</div></td><td className="px-3 py-3 whitespace-nowrap text-slate-600">{row.tanggal}</td><td className="px-3 py-3 min-w-[150px] text-slate-600">{row.kategori}</td><td className="px-3 py-3 min-w-[120px] text-slate-600">{row.lokasi}</td><td className="px-3 py-3 min-w-[120px] text-slate-600">{row.bidang}</td><td className="px-3 py-3 whitespace-nowrap"><span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${row.kondisi === 'Baik' ? 'bg-emerald-100 text-emerald-700' : row.kondisi === 'Rusak Ringan' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>{row.kondisi}</span></td><td className="px-3 py-3 text-right whitespace-nowrap text-slate-700">{formatRupiah(row.acquisition)}</td><td className="px-3 py-3 text-right whitespace-nowrap text-slate-700">{formatRupiah(row.accumulatedDepreciation)}</td><td className="px-3 py-3 text-right whitespace-nowrap font-semibold text-slate-800">{formatRupiah(row.bookValue)}</td></tr>)}</tbody>
          </table>
        </div>
        {filteredAssets.length > 100 && <div className="px-4 py-3 text-[11px] text-slate-500 border-t border-slate-100">Tabel menampilkan 100 baris pertama. Ekspor PDF/Excel memuat seluruh hasil filter.</div>}
      </div>
    </div>
  );
}
