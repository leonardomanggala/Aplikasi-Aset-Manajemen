/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect } from 'react';
import { 
  Asset, 
  LETAK_RUANG_MAP, 
  JENIS_ASET_MAP, 
  TERITORI_MAP, 
  PERUNTUKAN_MAP, 
  KODE_NAMA_BARANG_MAP,
  formatRupiah, 
  calculateStraightLineDepreciation,
  isAssetDepreciable,
  generateQrValue
} from '../types';
import { 
  X, 
  MapPin, 
  Calendar, 
  Wrench, 
  Compass, 
  FileText, 
  Clock, 
  ShieldCheck, 
  Settings, 
  Activity, 
  BookOpen,
  Tag,
  Printer,
  Download,
  QrCode
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface AssetModalProps {
  asset: Asset | null;
  onClose: () => void;
  jenisAsetMap?: Record<string, string>;
  letakRuangMap?: Record<string, string>;
  teritoriMap?: Record<string, string>;
  peruntukanMap?: Record<string, string>;
  kodeNamaBarangMap?: Record<string, string>;
  bidangMap?: Record<string, string>;
}

export default function AssetModal({ 
  asset, 
  onClose,
  jenisAsetMap,
  letakRuangMap,
  teritoriMap,
  peruntukanMap,
  kodeNamaBarangMap,
  bidangMap
}: AssetModalProps) {
  if (!asset) return null;

  const jMap = jenisAsetMap || JENIS_ASET_MAP;
  const lMap = letakRuangMap || LETAK_RUANG_MAP;
  const tMap = teritoriMap || TERITORI_MAP;
  const pMap = peruntukanMap || PERUNTUKAN_MAP;
  const kMap = kodeNamaBarangMap || KODE_NAMA_BARANG_MAP;

  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedUmur, setSimulatedUmur] = useState(asset.umurManfaat);
  const [simulatedResidu, setSimulatedResidu] = useState(0);

  useEffect(() => {
    if (asset) {
      setSimulatedUmur(asset.umurManfaat);
      setSimulatedResidu(0);
    }
  }, [asset]);

  // Real straight-line values
  const deprValues = useMemo(() => {
    return calculateStraightLineDepreciation(
      asset.hargaPembelian,
      isSimulating ? simulatedResidu : 0,
      isSimulating ? simulatedUmur : asset.umurManfaat,
      asset.tanggalPerolehan,
      new Date().toISOString(),
      isAssetDepreciable(asset)
    );
  }, [asset, isSimulating, simulatedUmur, simulatedResidu]);

  const chartData = useMemo(() => {
    const umurManfaat = Number(isSimulating ? simulatedUmur : asset?.umurManfaat) || 0;
    const nilaiResidu = Number(isSimulating ? simulatedResidu : 0) || 0;
    const hargaPembelian = Number(asset?.hargaPembelian) || 0;
    
    if (!asset || umurManfaat <= 0) return [];
    
    return Array.from({ length: umurManfaat + 1 }).map((_, i) => {
      const annExp = (hargaPembelian - nilaiResidu) / umurManfaat;
      
      let accum = annExp * i;
      if (i >= umurManfaat) accum = hargaPembelian - nilaiResidu;
      else if (accum > (hargaPembelian - nilaiResidu)) accum = hargaPembelian - nilaiResidu;
      
      let book = hargaPembelian - accum;
      if (i >= umurManfaat) book = nilaiResidu;
      else if (book < nilaiResidu) book = nilaiResidu;
      
      return {
        tahun: i.toString(),
        nilaiBuku: book,
        akumulasi: accum
      };
    });
  }, [asset, isSimulating, simulatedUmur, simulatedResidu]);

  const handleDownloadCSV = () => {
    const umurManfaat = isSimulating ? Number(simulatedUmur) || 0 : Number(asset?.umurManfaat) || 0;
    const hargaPembelian = Number(asset?.hargaPembelian) || 0;
    
    if (!asset || umurManfaat <= 0) return;

    const headers = ['Tahun Ke', 'Beban Depresiasi', 'Akumulasi Depresiasi', 'Nilai Buku'];
    const rows = Array.from({ length: umurManfaat + 1 }).map((_, i) => {
      const nilaiResidu = isSimulating ? Number(simulatedResidu) || 0 : Number(asset?.nilaiResidu) || 0;
      const annExp = (hargaPembelian - nilaiResidu) / umurManfaat;
      
      let accum = annExp * i;
      if (i >= umurManfaat) accum = hargaPembelian - nilaiResidu;
      else if (accum > (hargaPembelian - nilaiResidu)) accum = hargaPembelian - nilaiResidu;
      
      let book = hargaPembelian - accum;
      if (i >= umurManfaat) book = nilaiResidu;
      else if (book < nilaiResidu) book = nilaiResidu;
      
      let cost = annExp;
      if (i === 0) cost = 0;
      else if (i > umurManfaat) cost = 0;
      if (i === umurManfaat) {
         cost = hargaPembelian - (annExp * (i - 1));
      }
      return [
        i,
        i === 0 ? 0 : cost,
        accum,
        book
      ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + ["sep=,"].join("\n") + "\n"
      + headers.join(',') + "\n" 
      + rows.join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Jadwal_Penyusutan_${asset.noSeriFinal || asset.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download PNG - raw QR code only
  const downloadRawQRCode = () => {
    const canvas = document.getElementById("asset-qr-code-canvas") as HTMLCanvasElement | null;
    if (!canvas) return;
    const pngUrl = canvas.toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `QR_${asset.noSeriFinal}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  // Download high-resolution completed printable card/sticker label 600x240 as a composite canvas PNG
  const downloadLabelAsPNG = () => {
    const qrCanvas = document.getElementById("asset-qr-code-canvas") as HTMLCanvasElement | null;
    if (!qrCanvas) return;

    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = '#10b981'; // primary-500
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Header strip
    ctx.fillStyle = '#059669'; // primary-600
    ctx.fillRect(10, 10, canvas.width - 20, 42);

    // Header text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px "Inter", "Helvetica Neue", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('STIKER REKONSILIASI INVENTARIS - PAROKI PRINGWULUNG', canvas.width / 2, 36);

    // Draw the qr code canvas onto this combined sheet canvas
    ctx.drawImage(qrCanvas, 28, 70, 140, 140);

    // Label Details
    ctx.textAlign = 'left';

    // Title / Uraian
    ctx.fillStyle = '#0f172a'; // slate-900
    ctx.font = 'bold 16px "Inter", sans-serif';
    
    // Simple wrap text
    const text = asset.uraian || '';
    let words = text.split(' ');
    let line = '';
    let y = 92;
    const maxWidth = 380;
    const lineHeight = 20;

    for (let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + ' ';
      let metrics = ctx.measureText(testLine);
      let testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, 192, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 192, y);

    // Serial Code Label (large)
    y = Math.max(y + 26, 138);
    ctx.fillStyle = '#059669'; // primary-600
    ctx.font = 'bold 18px "JetBrains Mono", Courier, monospace';
    ctx.fillText(asset.noSeriFinal, 192, y);

    // Details/Properties
    y += 24;
    ctx.fillStyle = '#475569'; // slate-600
    ctx.font = 'bold 10px "Inter", sans-serif';
    ctx.fillText('LOKASI / RUANG PENEMPATAN:', 192, y);
    ctx.fillStyle = '#1e293b';
    ctx.font = '500 12px "Inter", sans-serif';
    const locationText = `${lMap[asset.letakRuang] || asset.letakRuang} (${tMap[asset.teritori] || asset.teritori})`;
    ctx.fillText(locationText, 192, y + 14);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 10px "Inter", sans-serif';
    ctx.fillText('KLASIFIKASI & BIDANG:', 392, y);
    ctx.fillStyle = '#1e293b';
    ctx.font = '500 12px "Inter", sans-serif';
    const catText = `${jMap[asset.jenisAset] || 'Aset'}`;
    const truncatedCat = catText.length > 20 ? catText.slice(0, 18) + '..' : catText;
    const bidangText = asset.bidang ? (bidangMap?.[asset.bidang] || asset.bidang) : `Beli: ${asset.tanggalPerolehan}`;
    const truncatedBidang = bidangText.length > 20 ? bidangText.slice(0, 18) + '..' : bidangText;
    ctx.fillText(`${truncatedCat} - ${truncatedBidang}`, 392, y + 14);

    const pngUrl = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `LABEL_${asset.noSeriFinal}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  // Popup Window print layout implementation
  const printLabel = () => {
    const qrCanvas = document.getElementById("asset-qr-code-canvas") as HTMLCanvasElement | null;
    if (!qrCanvas) return;
    const qrDataUrl = qrCanvas.toDataURL();

    const printWindow = window.open('', '_blank', 'width=750,height=550');
    if (!printWindow) {
      alert('Browser memblokir pop-up. Harap izinkan pop-up untuk mencetak label.');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Label Asset - ${asset.noSeriFinal}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@700&display=swap');
            body {
              margin: 0;
              padding: 40px;
              font-family: 'Inter', sans-serif;
              background: #f8fafc;
              color: #0f172a;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: calc(100vh - 80px);
            }
            .sticker-label {
              width: 580px;
              border: 3px solid #10b981;
              border-radius: 12px;
              overflow: hidden;
              background: #ffffff;
              box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.1);
            }
            .header {
              background: #059669;
              color: #ffffff;
              padding: 12px;
              text-align: center;
              font-size: 13px;
              font-weight: 750;
              text-transform: uppercase;
              letter-spacing: 0.08em;
            }
            .content {
              display: flex;
              padding: 24px;
              gap: 24px;
              align-items: center;
            }
            .qr-container {
              flex-shrink: 0;
              border: 2px solid #e2e8f0;
              padding: 10px;
              border-radius: 10px;
              background: #ffffff;
            }
            .qr-img {
              display: block;
              width: 130px;
              height: 130px;
            }
            .details {
              flex-grow: 1;
              display: flex;
              flex-direction: column;
              gap: 12px;
            }
            .asset-name {
              font-size: 18px;
              font-weight: 700;
              line-height: 1.3;
              margin: 0;
              color: #0f172a;
            }
            .serial-code {
              font-family: 'JetBrains Mono', monospace;
              font-size: 19px;
              color: #059669;
              font-weight: 700;
              margin: 0;
              letter-spacing: -0.02em;
            }
            .meta-grid {
              display: grid;
              grid-template-cols: 1fr 1fr;
              gap: 10px;
              border-top: 1px solid #f1f5f9;
              padding-top: 8px;
            }
            .meta-item {
              font-size: 11px;
              color: #334155;
            }
            .meta-label {
              font-weight: 700;
              text-transform: uppercase;
              font-size: 8px;
              color: #94a3b8;
              display: block;
              margin-bottom: 2px;
              letter-spacing: 0.05em;
            }
            @media print {
              body {
                padding: 0;
                margin: 0;
                background: #ffffff;
                height: auto;
              }
              .sticker-label {
                box-shadow: none;
                border: 2px solid #000000;
                page-break-inside: avoid;
              }
              .header {
                background: #000000 !important;
                color: #ffffff !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .serial-code {
                color: #000000 !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="sticker-label">
            <div class="header">Stiker Inventaris Aset Paroki</div>
            <div class="content">
              <div class="qr-container">
                <img class="qr-img" src="${qrDataUrl}" alt="QR" />
              </div>
              <div class="details">
                <div class="asset-name">${asset.uraian}</div>
                <div class="serial-code">${asset.noSeriFinal}</div>
                
                <div class="meta-grid">
                  <div class="meta-item">
                    <span class="meta-label">Lokasi Penempatan</span>
                    <strong>${lMap[asset.letakRuang] || asset.letakRuang}</strong><br/>
                    <span style="color: #64748b; font-size: 10px;">${tMap[asset.teritori] || asset.teritori}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Klasifikasi & Bidang</span>
                    <strong>${jMap[asset.jenisAset] || 'Aset'}</strong><br/>
                    <span style="color: #64748b; font-size: 10px;">${asset.bidang ? (bidangMap?.[asset.bidang] || asset.bidang) : `Beli: ${asset.tanggalPerolehan}`}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 350);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-fade-in-up">
        
        {/* Modal Header */}
        <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-start">
          <div className="space-y-1">
            <span className="bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-display">
              Informasi Umum Inventaris
            </span>
            <h3 className="text-base font-bold text-slate-800 leading-tight">{asset.uraian}</h3>
            <span className="font-mono text-xs text-slate-500 block font-semibold">{asset.noSeriFinal}</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-450 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg shrink-0 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-600">
          
          {/* Top visual QR barcode & key financials */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
            {/* Real QR Code Generator using qrcode.react */}
            <div className="bg-white p-3.5 rounded-xl shadow-sm border border-slate-200 shrink-0 text-center space-y-2 flex flex-col items-center">
              <div className="p-1.5 rounded-lg bg-white border border-slate-100 shadow-inner">
                <QRCodeCanvas
                  id="asset-qr-code-canvas"
                  value={generateQrValue(asset)}
                  size={100}
                  level="H"
                  includeMargin={false}
                />
              </div>
              
              <div className="flex flex-col gap-1 w-full max-w-[124px]">
                <button
                  type="button"
                  onClick={printLabel}
                  className="w-full flex items-center justify-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-[9px] py-1.5 px-2 rounded-lg uppercase tracking-wide transition cursor-pointer"
                  title="Cetak Label Stiker Fisik"
                >
                  <Printer className="w-3 h-3" />
                  Cetak Label
                </button>
                <button
                  type="button"
                  onClick={downloadLabelAsPNG}
                  className="w-full flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 font-bold text-[9px] py-1.5 px-2 border border-slate-200 rounded-lg uppercase tracking-wide transition cursor-pointer"
                  title="Unduh Stiker Format PNG"
                >
                  <Download className="w-3 h-3" />
                  Unduh Stiker
                </button>
              </div>

              <button
                type="button"
                onClick={downloadRawQRCode}
                className="text-[8px] text-indigo-600 font-semibold hover:underline block cursor-pointer pt-0.5"
              >
                Unduh QR Code Saja
              </button>
            </div>

            {/* Financial table metrics */}
            <div className="flex-1 space-y-3 w-full">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  {isAssetDepreciable(asset) ? 'Metrik Buku Penyusutan (Straight Line)' : 'Metrik Finansial (Non-Penyusutan)'}
                </span>
                {isAssetDepreciable(asset) && (
                  <button 
                    onClick={() => setIsSimulating(!isSimulating)}
                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide transition-colors ${isSimulating ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  >
                    {isSimulating ? 'Simulasi Aktif' : 'Simulasi Proyeksi'}
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-0.5">
                  <span className="text-slate-400 block font-semibold uppercase text-[9px]">Harga Perolehan</span>
                  <span className="font-mono text-xs font-bold text-slate-800">{formatRupiah(asset.hargaPembelian)}</span>
                  {asset.qty > 1 && (
                    <span className="block text-[10px] text-indigo-600 font-bold font-mono">
                      Total: {formatRupiah(asset.hargaPembelian * asset.qty)}
                    </span>
                  )}
                </div>
                {isAssetDepreciable(asset) && (
                  <div className="space-y-0.5">
                    <span className="text-slate-400 block font-semibold uppercase text-[9px]">Nilai Residu</span>
                    {isSimulating ? (
                      <input 
                        type="number"
                        value={simulatedResidu}
                        onChange={(e) => setSimulatedResidu(Number(e.target.value))}
                        className="font-mono text-xs font-bold text-slate-800 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 w-full focus:outline-none focus:border-amber-400"
                      />
                    ) : (
                      <span className="font-mono text-xs font-bold text-slate-800">{formatRupiah(0)}</span>
                    )}
                  </div>
                )}
              </div>
              
              {isSimulating && isAssetDepreciable(asset) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <div className="space-y-0.5">
                    <span className="text-slate-400 block font-semibold uppercase text-[9px]">Umur Manfaat (Tahun)</span>
                    <input 
                      type="number"
                      value={simulatedUmur}
                      onChange={(e) => setSimulatedUmur(Number(e.target.value))}
                      className="font-mono text-xs font-bold text-slate-800 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 w-full focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              )}

              {isAssetDepreciable(asset) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1.5 border-t border-slate-100/50">
                  <div className="space-y-0.5">
                    <span className="text-slate-400 block font-semibold uppercase text-[9px]">Penyusutan Tahunan</span>
                    <span className="font-mono text-xs font-semibold text-slate-700">{formatRupiah(deprValues.biayaPenyusutan)}/th</span>
                    {asset.qty > 1 && (
                      <span className="block text-[10px] text-indigo-650 font-bold font-mono">
                        Total: {formatRupiah(deprValues.biayaPenyusutan * asset.qty)}/th
                      </span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-slate-400 block font-semibold uppercase text-[9px]">Akumulasi</span>
                    <span className="font-mono text-xs font-semibold text-rose-600">{formatRupiah(deprValues.akumulasiPenyusutan)}</span>
                    {asset.qty > 1 && (
                      <span className="block text-[10px] text-rose-500 font-bold font-mono">
                        Total: {formatRupiah(deprValues.akumulasiPenyusutan * asset.qty)}
                      </span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-slate-400 block font-semibold uppercase text-[9px]">Masa Berjalan</span>
                    <span className="font-mono text-xs font-bold text-amber-600">{deprValues.umurBerjalanTahun} / {isSimulating ? simulatedUmur : asset.umurManfaat} tahun</span>
                  </div>
                </div>
              )}

              <div className="bg-indigo-950 text-indigo-100 p-2.5 rounded-lg flex flex-col gap-1 text-xs pt-2">
                <div className="flex justify-between items-center font-bold">
                  <span>Nilai Buku Saat Ini (Unit):</span>
                  <span className="text-primary-400 font-mono text-sm leading-none">{formatRupiah(deprValues.nilaiBuku)}</span>
                </div>
                {asset.qty > 1 && (
                  <div className="flex justify-between items-center font-bold pt-1.5 border-t border-indigo-900">
                    <span>Total Nilai Buku ({asset.qty} {asset.satuan}):</span>
                    <span className="text-primary-300 font-mono text-sm leading-none">{formatRupiah(deprValues.nilaiBuku * asset.qty)}</span>
                  </div>
                )}
              </div>

              {/* Grafik Penyusutan */}
              {isAssetDepreciable(asset) && Number(isSimulating ? simulatedUmur : asset.umurManfaat) > 0 && chartData.length > 0 && (
                <div className="pt-3 pb-2">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center justify-between">
                    <span>Proyeksi Garis Depresiasi {isSimulating && "(Simulasi)"}</span>
                  </div>
                  <div className="h-56 w-full border border-slate-100 rounded-lg p-3 bg-white shadow-sm">
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="tahun" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 9, fill: '#64748b' }}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 9, fill: '#64748b' }}
                          tickFormatter={(value) => {
                            if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}M`;
                            if (value >= 1000000) return `${(value / 1000000).toFixed(0)}Jt`;
                            if (value >= 1000) return `${(value / 1000).toFixed(0)}Rb`;
                            return value;
                          }}
                        />
                        <Tooltip 
                          formatter={(value: number) => formatRupiah(value)}
                          labelFormatter={(label) => `Tahun ke-${label}`}
                          contentStyle={{ fontSize: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px' }} iconType="circle" iconSize={6} />
                        <Line 
                          type="monotone" 
                          dataKey="nilaiBuku" 
                          name="Nilai Buku" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={{ r: 2.5, fill: '#3b82f6', strokeWidth: 0 }}
                          activeDot={{ r: 4, stroke: '#bfdbfe', strokeWidth: 3 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="akumulasi" 
                          name="Akumulasi Penyusutan" 
                          stroke="#f43f5e" 
                          strokeWidth={2}
                          dot={{ r: 2.5, fill: '#f43f5e', strokeWidth: 0 }}
                          activeDot={{ r: 4, stroke: '#fecdd3', strokeWidth: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              {/* Tabel Jadwal Penyusutan */}
              {isAssetDepreciable(asset) && Number(isSimulating ? simulatedUmur : asset.umurManfaat) > 0 && (
                <div className="pt-3">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                    <span>Jadwal Penyusutan Tahunan {isSimulating && "(Simulasi)"}</span>
                    <div className="flex gap-1.5">
                      <button 
                        onClick={handleDownloadCSV}
                        className="text-[8px] bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 px-2 py-0.5 rounded flex items-center gap-1 transition-colors font-mono"
                        title="Unduh Jadwal CSV"
                      >
                        <Download className="w-2.5 h-2.5" /> CSV
                      </button>
                      <span className="text-[8px] bg-slate-100 text-slate-400 px-1 py-0.5 rounded font-mono">Straight-Line</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded border border-slate-100">
                    <table className="w-full text-left text-[10px] whitespace-nowrap">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                        <tr>
                          <th className="px-2 py-1.5 text-center w-8">Tahun</th>
                          <th className="px-2 py-1.5 text-right">Beban Depresiasi</th>
                          <th className="px-2 py-1.5 text-right">Akumulasi</th>
                          <th className="px-2 py-1.5 text-right">Nilai Buku</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-mono text-[10px] bg-white">
                        {Array.from({ length: (Number(isSimulating ? simulatedUmur : asset.umurManfaat) || 0) + 1 }).map((_, i) => {
                          const umurManfaat = Number(isSimulating ? simulatedUmur : asset.umurManfaat) || 0;
                          const nilaiResidu = Number(isSimulating ? simulatedResidu : 0) || 0;
                          const hargaPembelian = Number(asset.hargaPembelian) || 0;
                          const isCurrentYear = i === Math.min(deprValues.umurBerjalanTahun, umurManfaat);
                          // Calculate projection for year i
                          const annExp = (hargaPembelian - nilaiResidu) / umurManfaat;
                          
                          let accum = annExp * i;
                          if (i >= umurManfaat) accum = hargaPembelian - nilaiResidu;
                          else if (accum > (hargaPembelian - nilaiResidu)) accum = hargaPembelian - nilaiResidu;
                          
                          let book = hargaPembelian - accum;
                          if (i >= umurManfaat) book = nilaiResidu;
                          else if (book < nilaiResidu) book = nilaiResidu;
                          
                          let cost = annExp;
                          if (i === 0) cost = 0;
                          else if (i > umurManfaat) cost = 0;
                          if (i === umurManfaat) {
                             cost = hargaPembelian - (annExp * (i - 1));
                          }
                          
                          return (
                            <tr key={i} className={isCurrentYear ? "bg-amber-50/60" : ""}>
                              <td className="px-2 py-1 text-center font-bold text-slate-600 relative">
                                {isCurrentYear && <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-amber-500"></span>}
                                {i}
                              </td>
                              <td className="px-2 py-1 text-right text-slate-500">{i === 0 ? '-' : formatRupiah(cost)}</td>
                              <td className="px-2 py-1 text-right text-rose-500">{formatRupiah(accum)}</td>
                              <td className="px-2 py-1 text-right font-semibold text-primary-600">{formatRupiah(book)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Level segments mapping metadata */}
          <div className="bg-white dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2.5">
            <span className="font-bold text-slate-700 uppercase tracking-wide block">Hierarki Segmentasi Lokasi & Fungsi</span>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
              {asset.bidang && (
                <div className="flex items-center gap-1.5 sm:col-span-2 bg-indigo-50/50 p-2 rounded-lg border border-indigo-100/50">
                  <Activity className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div>
                    <span className="text-indigo-400 text-[10px] block font-semibold uppercase leading-none">Bidang / Fungsi Terkoordinasi</span>
                    <span className="text-indigo-700 font-bold leading-normal">[{asset.bidang}] {bidangMap?.[asset.bidang] || asset.bidang}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-slate-400 text-[10px] block font-semibold uppercase leading-none">Kategori Aset</span>
                  <span className="text-slate-700 font-medium leading-normal">{asset.kategoriAset === 'bergerak' ? 'Barang Bergerak' : asset.kategoriAset === 'tidak_bergerak' ? 'Barang Tidak Bergerak' : 'Barang Bergerak'}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-slate-400 text-[10px] block font-semibold uppercase leading-none">Level 1 - Kategori Fungsi</span>
                  <span className="text-slate-700 font-medium leading-normal">[{asset.jenisAset}] {jMap[asset.jenisAset]}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-slate-400 text-[10px] block font-semibold uppercase leading-none">Level 5 - Penempatan Ruangan</span>
                  <span className="text-slate-700 font-medium leading-normal">[{asset.letakRuang}] {lMap[asset.letakRuang]}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-slate-400 text-[10px] block font-semibold uppercase leading-none">Level 3 - Letak Teritori</span>
                  <span className="text-slate-700 font-medium leading-normal">[{asset.teritori}] {tMap[asset.teritori]}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-slate-400 text-[10px] block font-semibold uppercase leading-none">Level 4 - Peruntukan Gedung</span>
                  <span className="text-slate-700 font-medium leading-normal">[{asset.peruntukan}] {pMap[asset.peruntukan]}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-slate-400 text-[10px] block font-semibold uppercase leading-none">Level 7 - Nama Identitas Barang</span>
                  <span className="text-slate-700 font-medium leading-normal">[{asset.kodeNamaBarang}] {kMap[asset.kodeNamaBarang] || 'Tidak Diketahui / Lainnya'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Non-Depreciable and Property Specific Attributes */}
          {(asset.jenisAset === '100' || asset.jenisAset === '101') && (
            <div className="bg-amber-50/50 dark:bg-slate-800/50 p-4 rounded-xl border border-amber-100 dark:border-slate-700/50 space-y-3">
              <span className="font-bold text-amber-700 dark:text-amber-500/90 uppercase tracking-wider block text-xs">Atribut Properti & Lahan</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs">
                {asset.jenisAset === '100' && (
                  <>
                    <div className="space-y-1">
                      <span className="text-amber-600/70 dark:text-slate-400 text-[10px] block font-semibold uppercase tracking-wider">Luas Tanah (m²)</span>
                      <div className="text-amber-900 dark:text-slate-200 font-medium">{asset.landArea ? `${asset.landArea} m²` : '-'}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-amber-600/70 dark:text-slate-400 text-[10px] block font-semibold uppercase tracking-wider">Nomor Sertifikat</span>
                      <div className="text-amber-900 dark:text-slate-200 font-medium">{asset.certificateNumber || '-'}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-amber-600/70 dark:text-slate-400 text-[10px] block font-semibold uppercase tracking-wider">Jenis Hak</span>
                      <div className="text-amber-900 dark:text-slate-200 font-medium">{asset.propertyRights || '-'}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-amber-600/70 dark:text-slate-400 text-[10px] block font-semibold uppercase tracking-wider">Lokasi</span>
                      <div className="text-amber-900 dark:text-slate-200 font-medium">{asset.location || '-'}</div>
                    </div>
                  </>
                )}
                {asset.jenisAset === '101' && (
                  <>
                    <div className="space-y-1">
                      <span className="text-amber-600/70 dark:text-slate-400 text-[10px] block font-semibold uppercase tracking-wider">Luas Bangunan (m²)</span>
                      <div className="text-amber-900 dark:text-slate-200 font-medium">{asset.buildingArea ? `${asset.buildingArea} m²` : '-'}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-amber-600/70 dark:text-slate-400 text-[10px] block font-semibold uppercase tracking-wider">Jumlah Lantai</span>
                      <div className="text-amber-900 dark:text-slate-200 font-medium">{asset.totalFloors || '-'}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-amber-600/70 dark:text-slate-400 text-[10px] block font-semibold uppercase tracking-wider">Tahun Dibangun</span>
                      <div className="text-amber-900 dark:text-slate-200 font-medium">{asset.buildYear || '-'}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-amber-600/70 dark:text-slate-400 text-[10px] block font-semibold uppercase tracking-wider">No. PBG / IMB</span>
                      <div className="text-amber-900 dark:text-slate-200 font-medium">{asset.buildingPermit || '-'}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Tabular Lists summary logs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Maintenance timelines */}
            <div className="bg-slate-50/50 dark:bg-slate-900/40 p-4 border border-slate-100 dark:border-slate-800 rounded-xl space-y-3">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1 pb-1 border-b">
                <Settings className="w-4 h-4 text-indigo-500 shrink-0" />
                Pemeliharaan ({asset.maintenanceLogs?.length || 0})
              </div>

              {!asset.maintenanceLogs || asset.maintenanceLogs.length === 0 ? (
                <p className="text-slate-400 text-[11px] text-center py-4">Belum ada log pemeliharaan terdaftar.</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {asset.maintenanceLogs.map(log => (
                    <div key={log.id} className="bg-white dark:bg-slate-800/50 p-2 rounded border border-slate-100 dark:border-slate-700 space-y-0.5 text-[11px]">
                      <div className="flex justify-between font-bold text-slate-700">
                        <span>{log.vendor}</span>
                        <span className="text-slate-400 font-mono font-medium">{log.tanggalServis}</span>
                      </div>
                      <p className="text-slate-600 leading-tight block truncate" title={log.deskripsi}>{log.deskripsi}</p>
                      <div className="text-[10px] text-slate-400 font-mono">Biaya: {formatRupiah(log.biaya)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mutation timelines */}
            <div className="bg-slate-50/50 dark:bg-slate-900/40 p-4 border border-slate-100 dark:border-slate-800 rounded-xl space-y-3">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1 pb-1 border-b">
                <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                Riwayat Mutasi ({asset.mutations?.length || 0})
              </div>

              {!asset.mutations || asset.mutations.length === 0 ? (
                <p className="text-slate-400 text-[11px] text-center py-4">Masih di pos original (tidak ada perpindahan).</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {asset.mutations.map(mut => (
                    <div key={mut.id} className="bg-white dark:bg-slate-800/50 p-2 rounded border border-slate-100 dark:border-slate-700 space-y-0.5 text-[11px]">
                      <div className="flex items-center justify-between font-bold text-slate-700">
                        <span>{lMap[mut.ruangAsal] || `Ruang ${mut.ruangAsal}`} → {lMap[mut.ruangTujuan] || `Ruang ${mut.ruangTujuan}`}</span>
                        <span className="text-slate-400 font-mono font-medium">{mut.tanggalMutasi}</span>
                      </div>
                      {mut.keterangan && <p className="text-slate-500 italic block truncate">"{mut.keterangan}"</p>}
                      <div className="text-[10px] text-slate-450 font-mono">PIC: {mut.picName}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Attached files summary */}
          <div className="bg-slate-50/40 dark:bg-slate-900/40 p-4 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2.5">
            <span className="font-bold text-slate-700 uppercase tracking-wide block flex items-center gap-1 text-xs">
              <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
              Arsip Dokumen Pelengkap ({asset.documents?.length || 0})
            </span>

            {!asset.documents || asset.documents.length === 0 ? (
              <p className="text-slate-400 text-[11px] text-center py-2">Tidak ada berkas terlampir.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                {asset.documents.map(doc => (
                  <div key={doc.id} className="p-2 bg-white dark:bg-slate-800/50 rounded border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <span className="font-bold text-slate-700 truncate" title={doc.namaDokumen}>{doc.namaDokumen}</span>
                    <span className="text-[9px] font-mono text-slate-400 shrink-0 select-none font-bold">PDF / ATTACH</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* History Logs */}
          <div className="bg-slate-50/40 dark:bg-slate-900/40 p-4 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2.5">
            <span className="font-bold text-slate-700 uppercase tracking-wide block flex items-center gap-1 text-xs">
              <Activity className="w-4 h-4 text-indigo-500 shrink-0" />
              Riwayat Perubahan Aset ({asset.historyLogs?.length || 0})
            </span>

            {!asset.historyLogs || asset.historyLogs.length === 0 ? (
              <p className="text-slate-400 text-[11px] text-center py-2">Belum ada riwayat perubahan yang tercatat.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {asset.historyLogs.map(log => (
                  <div key={log.id} className="p-3 bg-white dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700 space-y-1.5 text-[11px]">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-white ${log.action === 'CREATE' ? 'bg-emerald-500' : log.action === 'UPDATE' ? 'bg-blue-500' : log.action === 'MUTASI' ? 'bg-amber-500' : log.action === 'MAINTENANCE' ? 'bg-purple-500' : 'bg-rose-500'}`}>
                          {log.action}
                        </span>
                        <span className="font-bold text-slate-700">Oleh: {log.userName}</span>
                      </div>
                      <span className="text-slate-400 font-mono text-[10px]">{new Date(log.timestamp).toLocaleString('id-ID')}</span>
                    </div>
                    <p className="text-slate-600 leading-snug">{log.details}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 shrink-0">
          <button 
            type="button" 
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-6 rounded-lg transition"
          >
            Selesai
          </button>
        </div>

      </div>
    </div>
  );
}
