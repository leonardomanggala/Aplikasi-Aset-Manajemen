import React, { useMemo, useState } from 'react';
import { Search, Sparkles, X, ArrowRight, AlertTriangle } from 'lucide-react';
import { Asset, formatRupiah } from '../types';

interface AssetAssistantProps {
  assets: Asset[];
  jenisAsetMap: Record<string, string>;
  letakRuangMap: Record<string, string>;
  bidangMap: Record<string, string>;
  onSelectAsset: (asset: Asset) => void;
  onClose: () => void;
}

const STOP_WORDS = new Set(['tampilkan', 'tunjukkan', 'cari', 'lihat', 'semua', 'aset', 'barang', 'yang', 'dan', 'di', 'pada', 'dengan', 'untuk', 'dari', 'tahun']);

const normalize = (value: unknown) => String(value ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function AssetAssistant({ assets, jenisAsetMap, letakRuangMap, bidangMap, onSelectAsset, onClose }: AssetAssistantProps) {
  const [query, setQuery] = useState('');

  const result = useMemo(() => {
    const normalizedQuery = normalize(query.trim());
    if (!normalizedQuery) return { assets, filters: [] as string[], note: 'Ketik pertanyaan atau kata kunci aset.' };

    const year = normalizedQuery.match(/\b(19|20)\d{2}\b/)?.[0];
    const condition = normalizedQuery.includes('rusak berat') ? 'RUSAK_BERAT' : normalizedQuery.includes('rusak ringan') ? 'RUSAK_RINGAN' : normalizedQuery.includes('baik') ? 'BAIK' : undefined;
    const filters: string[] = [];
    if (year) filters.push(`Tahun ${year}`);
    if (condition) filters.push(condition === 'BAIK' ? 'Kondisi baik' : condition === 'RUSAK_RINGAN' ? 'Rusak ringan' : 'Rusak berat');

    const terms = normalizedQuery.split(/\s+/).filter(term => term.length > 1 && !STOP_WORDS.has(term) && term !== year && !['rusak', 'ringan', 'berat', 'baik'].includes(term));
    const filtered = assets.filter(asset => {
      const searchable = normalize([
        asset.uraian, asset.noSeriFinal, asset.jenisAset, jenisAsetMap[asset.jenisAset],
        asset.letakRuang, letakRuangMap[asset.letakRuang], asset.bidang, bidangMap[asset.bidang || ''],
        asset.tahun, asset.kondisiBarang
      ].join(' '));
      return (!year || String(asset.tahun) === year) && (!condition || asset.kondisiBarang === condition) && terms.every(term => searchable.includes(term));
    });

    if (terms.length > 0) filters.push(...terms.map(term => `"${term}"`));
    return { assets: filtered, filters, note: filtered.length ? `${filtered.length} aset ditemukan.` : 'Tidak ada aset yang cocok. Coba kata kunci yang lebih umum.' };
  }, [assets, bidangMap, jenisAsetMap, letakRuangMap, query]);

  const suggestions = ['CCTV di Gudang', 'aset rusak', 'aset tahun 2020', 'elektronik'];
  const totalValue = result.assets.reduce((sum, asset) => sum + (Number(asset.nilaiBuku) || 0) * (Number(asset.qty) || 1), 0);

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-slate-950/50 p-4 pt-20 backdrop-blur-sm" onClick={onClose}>
      <section className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900" onClick={event => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white"><Sparkles className="h-5 w-5" /></div>
            <div><h2 className="text-base font-bold text-slate-900 dark:text-white">AI Assistant Aset</h2><p className="text-xs text-slate-500 dark:text-slate-400">Pencarian cerdas berbasis data aplikasi</p></div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800" aria-label="Tutup"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-primary-500" />
            <input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Contoh: tampilkan CCTV di Gudang tahun 2020" className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 outline-none ring-primary-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white" />
          </div>
          {!query && <div className="mt-3 flex flex-wrap gap-2">{suggestions.map(suggestion => <button key={suggestion} type="button" onClick={() => setQuery(suggestion)} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">{suggestion}</button>)}</div>}
          <div className="mt-5 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300"><span>{result.note}</span>{result.assets.length > 0 && <span className="font-semibold text-primary-600 dark:text-primary-400">Nilai buku: {formatRupiah(totalValue)}</span>}</div>
          {result.filters.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{result.filters.map(filter => <span key={filter} className="rounded-md bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700 dark:bg-primary-950/40 dark:text-primary-300">{filter}</span>)}</div>}
          {result.assets.length > 0 && <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">{result.assets.slice(0, 30).map(asset => <button key={asset.id} type="button" onClick={() => { onSelectAsset(asset); onClose(); }} className="group flex w-full items-center justify-between rounded-xl border border-slate-200 p-3 text-left transition hover:border-primary-300 hover:bg-primary-50 dark:border-slate-700 dark:hover:bg-slate-800"><div className="min-w-0"><div className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{asset.uraian}</div><div className="mt-1 truncate font-mono text-xs text-slate-500 dark:text-slate-400">{asset.noSeriFinal} · {asset.kondisiBarang}</div></div><ArrowRight className="h-4 w-4 shrink-0 text-primary-500 opacity-0 transition group-hover:opacity-100" /></button>)}</div>}
          {result.assets.length > 30 && <p className="mt-3 text-center text-xs text-slate-500">Menampilkan 30 dari {result.assets.length} aset. Gunakan filter tambahan untuk mempersempit hasil.</p>}
          {query && result.assets.length === 0 && <div className="mt-5 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-200"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />Coba gunakan nama barang, ruangan, bidang, nomor seri, kondisi, atau tahun perolehan.</div>}
        </div>
      </section>
    </div>
  );
}
