import { Asset } from '../types';

export type AssetValidationSeverity = 'error' | 'warning';

export interface AssetValidationIssue {
  field: string;
  message: string;
  severity: AssetValidationSeverity;
}

export function validateAsset(asset: Partial<Asset>, existingAssets: Asset[] = [], editingId?: string): AssetValidationIssue[] {
  const issues: AssetValidationIssue[] = [];
  if (!String(asset.uraian || '').trim()) issues.push({ field: 'uraian', message: 'Nama atau uraian aset wajib diisi.', severity: 'error' });
  if (!String(asset.jenisAset || '').trim()) issues.push({ field: 'jenisAset', message: 'Jenis aset wajib dipilih.', severity: 'error' });
  if (!String(asset.letakRuang || '').trim()) issues.push({ field: 'letakRuang', message: 'Letak ruang wajib dipilih.', severity: 'error' });
  if (!String(asset.kodeNamaBarang || '').trim()) issues.push({ field: 'kodeNamaBarang', message: 'Kode nama barang wajib diisi.', severity: 'error' });

  const qty = Number(asset.qty);
  if (!Number.isFinite(qty) || qty <= 0) issues.push({ field: 'qty', message: 'Jumlah aset harus lebih besar dari 0.', severity: 'error' });
  const price = Number(asset.hargaPembelian);
  if (!Number.isFinite(price) || price < 0) issues.push({ field: 'hargaPembelian', message: 'Nilai perolehan tidak boleh negatif.', severity: 'error' });
  const year = Number(asset.tahun);
  if (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear() + 1) issues.push({ field: 'tahun', message: 'Tahun perolehan tidak berada dalam rentang yang wajar.', severity: 'error' });

  const serial = String(asset.noSeriFinal || '').trim();
  if (serial && serial.split('-').length !== 7) issues.push({ field: 'noSeriFinal', message: 'Nomor seri sebaiknya mengikuti 7 bagian kode standar.', severity: 'warning' });
  if (serial && existingAssets.some(item => item.id !== editingId && item.noSeriFinal === serial)) issues.push({ field: 'noSeriFinal', message: `Nomor seri ${serial} sudah digunakan oleh aset lain.`, severity: 'error' });
  if (Number(asset.nilaiBuku) > price && price >= 0) issues.push({ field: 'nilaiBuku', message: 'Nilai buku lebih besar dari nilai perolehan.', severity: 'warning' });
  return issues;
}

export function summarizeValidation(issues: AssetValidationIssue[]): string {
  return issues.map(issue => `${issue.severity === 'error' ? 'Error' : 'Peringatan'}: ${issue.message}`).join(' ');
}
