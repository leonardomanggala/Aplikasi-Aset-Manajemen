import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TablePaginationProps {
  page: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

/** Compact, shared pagination footer for long data tables. */
export default function TablePagination({
  page,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50]
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const activePage = Math.min(Math.max(1, page), totalPages);
  const start = totalItems === 0 ? 0 : (activePage - 1) * pageSize + 1;
  const end = Math.min(activePage * pageSize, totalItems);

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)
    .filter(pageNumber => pageNumber === 1 || pageNumber === totalPages || Math.abs(pageNumber - activePage) <= 1);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-500">
      <div className="flex items-center gap-3">
        <span>Menampilkan {start}-{end} dari {totalItems.toLocaleString('id-ID')} data</span>
        {onPageSizeChange && (
          <label className="inline-flex items-center gap-1.5">
            <span className="hidden sm:inline">Baris:</span>
            <select
              value={pageSize}
              onChange={event => onPageSizeChange(Number(event.target.value))}
              className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[11px] text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
              aria-label="Jumlah baris per halaman"
            >
              {pageSizeOptions.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        )}
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-1">
        <button
          type="button"
          onClick={() => onPageChange(activePage - 1)}
          disabled={activePage <= 1}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Sebelumnya
        </button>
        <div className="hidden sm:flex items-center gap-1 px-1">
          {pages.map((pageNumber, index) => {
            const previous = pages[index - 1];
            const hasGap = previous && pageNumber - previous > 1;
            return (
              <React.Fragment key={pageNumber}>
                {hasGap && <span className="px-1 text-slate-400">…</span>}
                <button
                  type="button"
                  onClick={() => onPageChange(pageNumber)}
                  className={`min-w-7 rounded-md px-2 py-1.5 font-semibold ${pageNumber === activePage ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                  aria-current={pageNumber === activePage ? 'page' : undefined}
                >
                  {pageNumber}
                </button>
              </React.Fragment>
            );
          })}
        </div>
        <span className="sm:hidden px-2 font-semibold text-slate-600">Halaman {activePage}/{totalPages}</span>
        <button
          type="button"
          onClick={() => onPageChange(activePage + 1)}
          disabled={activePage >= totalPages}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Berikutnya <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
