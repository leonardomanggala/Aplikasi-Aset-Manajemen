/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';
import {
  Asset,
  DashboardStats,
  formatRupiah,
  isAssetDepreciable,
  JENIS_ASET_MAP,
  BIDANG_MAP
} from '../types';
import { ShieldAlert, TrendingDown, ClipboardList, Wallet, Sparkles, TrendingUp, X } from 'lucide-react';

const COLORS = {
  BAIK: '#10b981',        // Emerald 500
  RUSAK_RINGAN: '#f59e0b', // Amber 500
  RUSAK_BERAT: '#ef4444'   // Red 500
};

const truncateChartLabel = (value: string, maxLength = 16) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;

interface DashboardTabProps {
  assets: Asset[];
  onSelectAsset: (asset: Asset) => void;
  jenisAsetMap?: Record<string, string>;
  bidangMap?: Record<string, string>;
}

export default function DashboardTab({ assets, onSelectAsset, jenisAsetMap, bidangMap: propsBidangMap }: DashboardTabProps) {
  const activeJenisAsetMap = jenisAsetMap || JENIS_ASET_MAP;
  const activeBidangMap = propsBidangMap || BIDANG_MAP;
  
  const [activeModal, setActiveModal] = useState<'bookValue' | 'depreciation' | 'damaged' | null>(null);

  const modalAssets = useMemo(() => {
    if (!activeModal) return [];
    
    return assets.filter(asset => {
      if (activeModal === 'damaged') {
        return asset.kondisiBarang === 'RUSAK_RINGAN' || asset.kondisiBarang === 'RUSAK_BERAT';
      }
      
      if (activeModal === 'bookValue') {
        return Number(asset.nilaiBuku) > 0;
      }
      
      if (activeModal === 'depreciation') {
        const qty = Number(asset.qty) || 1;
        const umurManfaat = Number(asset.umurManfaat) || 0;
        if (umurManfaat > 0 && asset.tanggalPerolehan && isAssetDepreciable(asset)) {
          const tglPerolehan = new Date(asset.tanggalPerolehan);
          let tahunPerolehan = tglPerolehan.getFullYear();
          let tahunSekarang = new Date().getFullYear();
          if (isNaN(tahunPerolehan)) tahunPerolehan = tahunSekarang;
          
          let selisihTahun = tahunSekarang - tahunPerolehan;
          return (selisihTahun > 0 && selisihTahun <= umurManfaat) && (Number(asset.biayaPenyusutan) || 0) > 0;
        }
        return false;
      }
      
      return false;
    });
  }, [assets, activeModal]);

  // Compute trend data over the last 12 months for book values
  const bookValueTrend = useMemo(() => {
    const trendData = [];
    const today = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthLabel = d.toLocaleDateString('id-ID', { month: 'short' });
      const yearLabel = d.getFullYear();
      
      trendData.push({
        label: `${monthLabel} ${yearLabel}`,
        year: d.getFullYear(),
        month: d.getMonth(),
        count: 0,
        value: 0,
        bookValue: 0
      });
    }

    assets.forEach(asset => {
      if (!asset.tanggalPerolehan) return;
      const pDate = new Date(asset.tanggalPerolehan);
      const pYear = pDate.getFullYear();
      const pMonth = pDate.getMonth();

      const match = trendData.find(item => item.year === pYear && item.month === pMonth);
      if (match) {
        const qty = Number(asset.qty) || 1;
        match.count += qty;
        match.value += (Number(asset.hargaPembelian) || 0) * qty;
        match.bookValue += (Number(asset.nilaiBuku) || 0) * qty;
      }
    });

    return trendData;
  }, [assets]);

  // Compute real statistics in real-time
  const stats = useMemo<DashboardStats>(() => {
    let totalOriginalValue = 0;
    let totalBookValue = 0;
    let totalDepreciationYear = 0;
    let totalUnits = 0;

    const catMap: Record<string, { original: number; book: number; count: number; depreciationYear: number }> = {};
    const bidangStatsMap: Record<string, { count: number; value: number }> = {};
    const kategoriMap: Record<string, { value: number }> = {
      'bergerak': { value: 0 },
      'tidak_bergerak': { value: 0 }
    };
    const condMap = {
      BAIK: 0,
      RUSAK_RINGAN: 0,
      RUSAK_BERAT: 0
    };

    // Initialize categories
    Object.keys(activeJenisAsetMap).forEach(k => {
      catMap[k] = { original: 0, book: 0, count: 0, depreciationYear: 0 };
    });

    Object.keys(activeBidangMap).forEach(k => {
      bidangStatsMap[k] = { count: 0, value: 0 };
    });

    const expiringAssetsList: Asset[] = [];

    assets.forEach(asset => {
      // Aggregate general counters
      const qty = Number(asset.qty) || 1;
      totalOriginalValue += (Number(asset.hargaPembelian) || 0) * qty;
      totalBookValue += (Number(asset.nilaiBuku) || 0) * qty;
      
      const umurManfaat = Number(asset.umurManfaat) || 0;
      if (umurManfaat > 0 && asset.tanggalPerolehan) {
        const tglPerolehan = new Date(asset.tanggalPerolehan);
        let tahunPerolehan = tglPerolehan.getFullYear();
        let tahunSekarang = new Date().getFullYear();
        if (isNaN(tahunPerolehan)) tahunPerolehan = tahunSekarang;
        
        let selisihTahun = tahunSekarang - tahunPerolehan;
        if (selisihTahun > 0 && selisihTahun <= umurManfaat) {
          totalDepreciationYear += (Number(asset.biayaPenyusutan) || 0) * qty;
        }
      }
      
      totalUnits += qty;

      // Group by category code
      const catCode = asset.jenisAset;
      if (!catMap[catCode]) {
        catMap[catCode] = { original: 0, book: 0, count: 0, depreciationYear: 0 };
      }
      catMap[catCode].original += (Number(asset.hargaPembelian) || 0) * qty;
      catMap[catCode].book += (Number(asset.nilaiBuku) || 0) * qty;
      catMap[catCode].count += qty;

      if (umurManfaat > 0 && asset.tanggalPerolehan) {
        const tglPerolehan = new Date(asset.tanggalPerolehan);
        let tahunPerolehan = tglPerolehan.getFullYear();
        let tahunSekarang = new Date().getFullYear();
        if (isNaN(tahunPerolehan)) tahunPerolehan = tahunSekarang;
        
        let selisihTahun = tahunSekarang - tahunPerolehan;
        if (selisihTahun > 0 && selisihTahun <= umurManfaat) {
          catMap[catCode].depreciationYear += (Number(asset.biayaPenyusutan) || 0) * qty;
        }
      }

      // Group by bidang
      const bidangCode = asset.bidang;
      if (bidangCode) {
        if (!bidangStatsMap[bidangCode]) {
          bidangStatsMap[bidangCode] = { count: 0, value: 0 };
        }
        bidangStatsMap[bidangCode].count += qty;
        bidangStatsMap[bidangCode].value += (Number(asset.nilaiBuku) || 0) * qty;
      }

      // Group by kategori (bergerak/tidak bergerak)
      const kategori = asset.kategoriAset === 'tidak_bergerak' ? 'tidak_bergerak' : 'bergerak';
      kategoriMap[kategori].value += (Number(asset.nilaiBuku) || 0) * qty;

      // Group by conditions
      const cond = asset.kondisiBarang || 'BAIK';
      if (cond === 'BAIK') condMap.BAIK += qty;
      else if (cond === 'RUSAK_RINGAN') condMap.RUSAK_RINGAN += qty;
      else if (cond === 'RUSAK_BERAT') condMap.RUSAK_BERAT += qty;

      // Expiring assets selection: useful life remaining < 1 year
      if (isAssetDepreciable(asset)) {
        const usefulYears = Number(asset.umurManfaat) || 1;
        const purchaseDate = new Date(asset.tanggalPerolehan);
        const today = new Date();
        const elapsedYears = (today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        
        const sisaUmur = Math.max(usefulYears - elapsedYears, 0);

        if (sisaUmur < 1.0) {
          expiringAssetsList.push(asset);
        }
      }
    });

    const categoryDistribution = Object.entries(catMap).map(([code, data]) => ({
      category: activeJenisAsetMap[code] || `Kategori ${code}`,
      originalValue: data.original,
      bookValue: data.book,
      count: data.count,
      depreciationYear: data.depreciationYear
    }));

    const conditionDistribution = [
      { condition: 'BAIK', count: condMap.BAIK },
      { condition: 'RUSAK_RINGAN', count: condMap.RUSAK_RINGAN },
      { condition: 'RUSAK_BERAT', count: condMap.RUSAK_BERAT }
    ];

    const bidangDistribution = Object.entries(bidangStatsMap).map(([code, data]) => ({
      bidang: activeBidangMap[code] || `Bidang ${code}`,
      count: data.count,
      value: data.value
    })).sort((a, b) => b.value - a.value);

    const kategoriValueDistribution = [
      { name: 'Aset Bergerak', value: kategoriMap['bergerak'].value },
      { name: 'Aset Tidak Bergerak', value: kategoriMap['tidak_bergerak'].value }
    ];

    // Sort expiring assets by book value descending
    expiringAssetsList.sort((a, b) => b.nilaiBuku - a.nilaiBuku);

    return {
      totalOriginalValue,
      totalBookValue,
      totalDepreciationYear,
      totalUnits,
      totalRusak: condMap.RUSAK_RINGAN + condMap.RUSAK_BERAT,
      categoryDistribution,
      conditionDistribution,
      bidangDistribution,
      kategoriValueDistribution,
      expiringAssets: expiringAssetsList.slice(0, 5) // top 5
    };
  }, [assets, activeJenisAsetMap]);

  const maxBidangBookValue = Math.max(
    ...stats.bidangDistribution.map(item => Number(item.value) || 0),
    1
  );
  const maxCategoryOriginalValue = Math.max(
    ...stats.categoryDistribution.map(item => Number(item.originalValue) || 0),
    1
  );

  return (
    <div id="dashboard-container" className="simas-dashboard space-y-7">
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        {/* Card 1: Total Units */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <p className="text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-1.5 flex items-center justify-between">
            <span>Total Kuantitas</span>
            <span className="text-primary-500 text-[10px] font-bold bg-primary-50 px-1.5 py-0.5 rounded">Aktif</span>
          </p>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold font-mono text-slate-900">{stats.totalUnits.toLocaleString('id-ID')}</span>
            <span className="text-[10px] text-slate-400 font-medium">Unit Terdata</span>
          </div>
        </div>

        {/* Card 2: Original Cost */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <p className="text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-1.5">Nilai Perolehan</p>
          <div className="flex items-end justify-between">
            <span className="text-xl font-bold font-mono text-slate-900">{formatRupiah(stats.totalOriginalValue)}</span>
            <span className="text-[10px] text-slate-400 font-semibold">Harga Awal</span>
          </div>
        </div>

        {/* Card 3: Book Value */}
        <div 
          onClick={() => setActiveModal('bookValue')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer"
        >
          <p className="text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-1.5 flex items-center justify-between">
            <span>Nilai Buku Saat Ini</span>
            <span className="text-primary-500 text-[9px] font-bold bg-primary-50 px-1 py-0.2 rounded">Depresiasi</span>
          </p>
          <div className="flex items-end justify-between">
            <span className="text-xl font-bold font-mono text-primary-600">{formatRupiah(stats.totalBookValue)}</span>
            <span className="text-[10px] text-slate-400 font-medium">Aktual</span>
          </div>
        </div>

        {/* Card 4: Depreciation per year */}
        <div 
          onClick={() => setActiveModal('depreciation')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer"
        >
          <p className="text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-1.5">Penyusutan / Tahun</p>
          <div className="flex items-end justify-between">
            <span className="text-xl font-bold font-mono text-amber-600">{formatRupiah(stats.totalDepreciationYear)}</span>
            <span className="text-[9px] text-slate-400 uppercase font-mono">Garis Lurus</span>
          </div>
        </div>

        {/* Card 5: Damaged Assets */}
        <div 
          onClick={() => setActiveModal('damaged')}
          className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/30 shadow-sm hover:shadow-md transition cursor-pointer"
        >
          <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1.5 flex items-center justify-between">
            <span>Aset Rusak</span>
            <span className="text-rose-600 text-[10px] font-bold bg-rose-100 px-1.5 py-0.5 rounded">Perlu Aksi</span>
          </p>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold font-mono text-rose-700">{stats.totalRusak.toLocaleString('id-ID')}</span>
            <span className="text-[10px] text-rose-500 font-medium">Unit Rusak</span>
          </div>
        </div>
      </div>

      {/* Recharts Visualizations */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Two-column chart row: category and ministry */}
          <div className="w-full self-start h-fit bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm lg:order-1">
          <div className="flex justify-between items-start mb-3 min-h-12">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Representasi Nilai Buku per Kategori</h3>
              <p className="text-xs text-slate-400">Membandingkan nilai awal vs nilai buku berjalan (Depresiasi)</p>
            </div>
          </div>
          <div className="max-h-[28rem] overflow-y-auto pr-1 space-y-3 mt-2">
            {stats.categoryDistribution
              .filter(item => item.originalValue > 0 || item.bookValue > 0)
              .map((item) => {
                const originalWidth = item.originalValue > 0 ? Math.max((item.originalValue / maxCategoryOriginalValue) * 100, 2) : 0;
                const bookWidth = item.bookValue > 0 ? Math.max((item.bookValue / maxCategoryOriginalValue) * 100, 2) : 0;
                return (
                  <div key={item.category} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3 text-[11px]">
                      <span className="font-semibold text-slate-700 truncate" title={item.category}>{item.category}</span>
                      <span className="font-mono font-bold text-slate-600 whitespace-nowrap">{formatRupiah(item.bookValue)}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-14 shrink-0 text-[9px] text-slate-400">Perolehan</span>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full bg-slate-300 transition-all duration-500" style={{ width: `${originalWidth}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-14 shrink-0 text-[9px] text-primary-500">Nilai Buku</span>
                        <div className="h-2 w-full rounded-full bg-primary-50 overflow-hidden">
                          <div className="h-full rounded-full bg-primary-500 transition-all duration-500" style={{ width: `${bookWidth}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            <div className="flex items-center gap-4 pt-1 text-[10px] text-slate-400">
              <span className="inline-flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-slate-300" />Perolehan</span>
              <span className="inline-flex items-center gap-1 text-primary-500"><i className="w-2 h-2 rounded-full bg-primary-500" />Nilai Buku</span>
            </div>
          </div>
          </div>

          {/* Column 1: Distribusi Nilai Aset per Bidang */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between lg:order-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Distribusi Nilai Aset per Bidang</h3>
              <p className="text-xs text-slate-400 mb-4">Total nilai buku berdasarkan bidang fungsional</p>
            </div>
            <div className="max-h-[28rem] overflow-y-auto pr-1 space-y-3 mt-2">
              {stats.bidangDistribution.map((item, index) => {
                const width = item.value > 0 ? Math.max((item.value / maxBidangBookValue) * 100, 2) : 0;
                const colors = ['#7c3aed', '#8b5cf6', '#10b981', '#0ea5e9', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'];
                return (
                  <div key={item.bidang} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3 text-[11px]">
                      <span className="font-semibold text-slate-700 truncate" title={item.bidang}>{item.bidang}</span>
                      <span className="font-mono font-bold text-slate-600 whitespace-nowrap">{formatRupiah(item.value)}</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${width}%`, backgroundColor: colors[index % colors.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* 3-Column Grid: Kondisi Fisik Barang, Nilai Aset per Kategori & Tren Registrasi Aset Baru */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Column 1: Pie Chart Kondisi Fisik */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Kondisi Fisik Barang</h3>
              <p className="text-xs text-slate-400 mb-4">Proporsi kelayakan guna inventaris saat ini</p>
            </div>
            <div className="h-44 flex items-center justify-center relative my-3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.conditionDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={6}
                    dataKey="count"
                  >
                    {stats.conditionDistribution.map((entry) => (
                      <Cell 
                        key={entry.condition} 
                        fill={COLORS[entry.condition as keyof typeof COLORS] || '#94a3b8'} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`${value} unit`, 'Jumlah Aset']}
                    contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center flex flex-col items-center">
                <span className="text-2xl font-bold font-mono text-slate-700">{stats.totalUnits}</span>
                <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Unit Total</span>
              </div>
            </div>
            <div className="space-y-2 mt-2 pt-2 border-t border-slate-100">
              {stats.conditionDistribution.map((item) => {
                const percentage = stats.totalUnits > 0 ? ((item.count / stats.totalUnits) * 100).toFixed(1) : '0';
                const label = item.condition === 'BAIK' ? 'Baik (Siap Pakai)' : item.condition === 'RUSAK_RINGAN' ? 'Rusak Ringan (Butuh Servis)' : 'Rusak Berat (Afkir/Ganti)';
                const colorHex = COLORS[item.condition as keyof typeof COLORS];
                return (
                  <div key={item.condition} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colorHex }}></span>
                      <span className="text-slate-600 font-medium">{label}</span>
                    </div>
                    <span className="font-semibold text-slate-800 font-mono">{item.count} unit ({percentage}%)</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 2: Pie Chart Komposisi Nilai Aset per Kategori */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Komposisi Nilai Aset</h3>
              <p className="text-xs text-slate-400 mb-4">Proporsi total nilai buku berdasarkan kategori</p>
            </div>
            <div className="h-44 flex items-center justify-center relative my-3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.categoryDistribution.filter(c => c.bookValue > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="bookValue"
                    nameKey="category"
                    stroke="none"
                    cornerRadius={4}
                  >
                    {stats.categoryDistribution.filter(c => c.bookValue > 0).map((entry, index) => (
                      <Cell 
                        key={entry.category} 
                        fill={['#7c3aed', '#8b5cf6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#a855f7', '#c084fc', '#f43f5e', '#f59e0b'][index % 10]}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [formatRupiah(value), 'Nilai Buku']}
                    contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-2 pt-2 border-t border-slate-100 max-h-32 overflow-y-auto">
              {stats.categoryDistribution.filter(c => c.bookValue > 0).sort((a,b) => b.bookValue - a.bookValue).slice(0, 4).map((item, index) => {
                const percentage = stats.totalBookValue > 0 ? ((item.bookValue / stats.totalBookValue) * 100).toFixed(1) : '0';
                return (
                  <div key={item.category} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 max-w-[70%]">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ['#7c3aed', '#8b5cf6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#a855f7', '#c084fc', '#f43f5e', '#f59e0b'][index % 10] }}></span>
                      <span className="text-slate-600 font-medium truncate" title={item.category}>{item.category}</span>
                    </div>
                    <span className="font-semibold text-slate-800 font-mono">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 3: 📈 Tren Nilai Buku Aset 12 Bulan Terakhir */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
                    <TrendingUp className="w-5 h-5 shrink-0" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide text-left">Tren Nilai Buku Aset</h3>
                    <p className="text-xs text-slate-400 text-left">Perkembangan total nilai buku berjalan berdasarkan bulan perolehan</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 shrink-0">
                  <div className="flex items-center gap-1.5 font-sans font-bold text-[9px] tracking-wide text-primary-600 bg-primary-50 px-2 py-0.5 rounded uppercase">
                    Nilai Buku
                  </div>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bookValueTrend} margin={{ top: 15, right: 20, left: 60, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      width={60}
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => {
                        if (val >= 1e6) {
                          return `Rp ${(val / 1e6).toFixed(0)}jt`;
                        }
                        if (val > 0) {
                          return `Rp ${(val / 1e3).toFixed(0)}rb`;
                        }
                        return 'Rp 0';
                      }}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-950 text-white p-3 rounded-lg border border-slate-800 shadow-xl text-xs space-y-1 text-left">
                              <p className="font-bold text-slate-400 border-b border-slate-800 pb-1 mb-1 font-mono">{data.label}</p>
                              <div className="flex items-center gap-2 justify-between">
                                <span className="text-slate-300">Aset Terdaftar:</span>
                                <span className="font-bold text-slate-300 text-right font-mono">{data.count} Unit</span>
                              </div>
                              <div className="flex items-center gap-2 justify-between">
                                <span className="text-slate-300">Nilai Perolehan:</span>
                                <span className="font-bold text-slate-400 text-right font-mono">{formatRupiah(data.value)}</span>
                              </div>
                              <div className="flex items-center gap-2 justify-between border-t border-slate-850 pt-1 mt-1">
                                <span className="text-primary-400 font-semibold">Total Nilai Buku:</span>
                                <span className="font-bold text-primary-400 text-right font-mono">{formatRupiah(data.bookValue)}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="bookValue" 
                      stroke="#10b981" 
                      strokeWidth={3} 
                      activeDot={{ r: 6 }} 
                      dot={{ r: 4, strokeWidth: 1 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Rekapitulasi Nilai per Kategori Aset */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Wallet className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Rekapitulasi Nilai Berdasarkan Jenis Aset</h3>
              <p className="text-xs text-slate-400">Total Nilai Perolehan, Nilai Buku, dan Penyusutan/Tahun per Kategori Level 1</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Kategori (Jenis Aset)</th>
                <th className="px-6 py-3 font-mono text-right">Jumlah Unit</th>
                <th className="px-6 py-3 font-mono text-right">Nilai Perolehan</th>
                <th className="px-6 py-3 font-mono text-right">Nilai Penyusutan / Tahun</th>
                <th className="px-6 py-3 font-mono text-right text-primary-600">Nilai Buku Sisa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
              {stats.categoryDistribution.map((cat, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-3 font-medium text-slate-800">
                    {cat.category}
                  </td>
                  <td className="px-6 py-3 font-mono text-slate-600 text-right">
                    {cat.count.toLocaleString('id-ID')} Unit
                  </td>
                  <td className="px-6 py-3 font-mono text-slate-600 text-right">
                    {formatRupiah(cat.originalValue)}
                  </td>
                  <td className="px-6 py-3 font-mono text-amber-600 text-right">
                    {formatRupiah(cat.depreciationYear)}
                  </td>
                  <td className="px-6 py-3 font-mono font-bold text-primary-600 text-right">
                    {formatRupiah(cat.bookValue)}
                  </td>
                </tr>
              ))}
              {/* Grand Total Row */}
              <tr className="bg-slate-50/80 font-bold border-t border-slate-200">
                <td className="px-6 py-3 text-slate-800 uppercase tracking-wider text-[10px]">Total Keseluruhan</td>
                <td className="px-6 py-3 font-mono text-slate-800 text-right">{stats.totalUnits.toLocaleString('id-ID')} Unit</td>
                <td className="px-6 py-3 font-mono text-slate-800 text-right">{formatRupiah(stats.totalOriginalValue)}</td>
                <td className="px-6 py-3 font-mono text-amber-700 text-right">{formatRupiah(stats.totalDepreciationYear)}</td>
                <td className="px-6 py-3 font-mono text-primary-700 text-right">{formatRupiah(stats.totalBookValue)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 3: Useful life alerts */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-indigo-50 bg-slate-50/50 dark:bg-slate-900/40 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500 animate-pulse shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Aset yang Mendekati Akhir Umur Manfaat</h3>
              <p className="text-xs text-slate-400">Aset dengan sisa umur ekonomis kurang dari 1 tahun. Rekomendasi audit / maintenance [2, 10]</p>
            </div>
          </div>
          <span className="bg-amber-50 text-amber-800 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
            {stats.expiringAssets.length} Aset Terdegradasi
          </span>
        </div>

        {stats.expiringAssets.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Tidak ada aset yang mendekati akhir umur manfaat saat ini. Semua dalam periode sisa umur normal.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">No. Seri Final</th>
                  <th className="px-6 py-3">Uraian / Deskripsi</th>
                  <th className="px-6 py-3">Tanggal Perolehan</th>
                  <th className="px-6 py-3 font-mono">Umur Manfaat</th>
                  <th className="px-6 py-3">Nilai Buku Sisa</th>
                  <th className="px-6 py-3 text-right">Status Kondisi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                {stats.expiringAssets.map((asset) => {
                  const purchase = new Date(asset.tanggalPerolehan);
                  const today = new Date();
                  const elapsed = (today.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
                  const sisa = Math.max(Number(asset.umurManfaat) - elapsed, 0);

                  return (
                    <tr 
                      key={asset.id} 
                      onClick={() => onSelectAsset(asset)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/80 cursor-pointer transition"
                    >
                      <td className="px-6 py-3 font-mono text-xs text-indigo-600 font-semibold decoration-dashed hover:underline">
                        {asset.noSeriFinal}
                      </td>
                      <td className="px-6 py-3 font-medium text-slate-800">
                        {asset.uraian}
                      </td>
                      <td className="px-6 py-3">
                        {new Date(asset.tanggalPerolehan).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-3 font-mono font-medium">
                        {asset.umurManfaat} Thn <span className="text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded text-[10px]">Sisa {sisa.toFixed(1)} Thn</span>
                      </td>
                      <td className="px-6 py-3 font-semibold text-slate-900 font-mono">
                        {formatRupiah(asset.nilaiBuku)}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          asset.kondisiBarang === 'BAIK' ? 'bg-primary-50 text-primary-700' :
                          asset.kondisiBarang === 'RUSAK_RINGAN' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {asset.kondisiBarang.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {activeModal === 'bookValue' && 'Detail Nilai Buku Saat Ini'}
                  {activeModal === 'depreciation' && 'Detail Penyusutan Berjalan'}
                  {activeModal === 'damaged' && 'Daftar Aset Rusak'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">Total {modalAssets.length} aset ditemukan</p>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4 sm:p-6">
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="text-[10px] text-slate-400 uppercase bg-slate-50">
                    <tr>
                      <th className="px-4 py-3">No Seri / Uraian</th>
                      <th className="px-4 py-3">Kategori</th>
                      <th className="px-4 py-3">Nilai Buku</th>
                      {activeModal === 'depreciation' && <th className="px-4 py-3">Penyusutan / Thn</th>}
                      <th className="px-4 py-3">Kondisi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {modalAssets.map(asset => (
                      <tr 
                        key={asset.id} 
                        onClick={() => { setActiveModal(null); onSelectAsset(asset); }}
                        className="hover:bg-slate-50/50 transition cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <div className="font-mono text-primary-600 font-bold mb-0.5">{asset.noSeriFinal}</div>
                          <div className="font-medium text-slate-800">{asset.uraian}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">{asset.jenisAset}</span>
                        </td>
                        <td className="px-4 py-3 font-mono font-medium">
                          {formatRupiah(asset.nilaiBuku)}
                        </td>
                        {activeModal === 'depreciation' && (
                          <td className="px-4 py-3 font-mono font-medium text-amber-600">
                            {formatRupiah(asset.biayaPenyusutan)}
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            asset.kondisiBarang === 'BAIK' ? 'bg-primary-50 text-primary-700' :
                            asset.kondisiBarang === 'RUSAK_RINGAN' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {asset.kondisiBarang.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {modalAssets.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                          Tidak ada aset yang sesuai kriteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
