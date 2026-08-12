import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * Reusable Pagination Component
 * Supports page selection, range indicators, smart ellipsis, and items-per-page selection.
 */
export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalItems = 0,
  itemsPerPage = 10,
  onItemsPerPageChange,
  pageSizeOptions = [5, 10, 20, 50]
}) {
  if (totalPages <= 1 && totalItems <= itemsPerPage && !onItemsPerPageChange) {
    return null; // No pagination needed if 1 page or less and no page size selector
  }

  const safeCurrentPage = Math.max(1, Math.min(currentPage, Math.max(1, totalPages)));

  // Compute item index ranges
  const startItem = totalItems > 0 ? (safeCurrentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = totalItems > 0 ? Math.min(safeCurrentPage * itemsPerPage, totalItems) : 0;

  // Generate page numbers with smart ellipsis logic
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, safeCurrentPage - 1);
      let end = Math.min(totalPages - 1, safeCurrentPage + 1);

      if (safeCurrentPage <= 3) {
        end = 4;
      } else if (safeCurrentPage >= totalPages - 2) {
        start = totalPages - 3;
      }

      if (start > 2) pages.push('ellipsis-1');

      for (let i = start; i <= end; i++) pages.push(i);

      if (end < totalPages - 1) pages.push('ellipsis-2');

      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-4 px-2 select-none">
      {/* Left: Info & Items Per Page */}
      <div className="flex items-center gap-4 text-xs text-slate-500 font-bold">
        {totalItems > 0 ? (
          <span>
            Showing <span className="font-black text-slate-800">{startItem}</span> to{' '}
            <span className="font-black text-slate-800">{endItem}</span> of{' '}
            <span className="font-black text-slate-800">{totalItems}</span> entries
          </span>
        ) : (
          <span>Page <span className="font-black text-slate-800">{safeCurrentPage}</span> of <span className="font-black text-slate-800">{Math.max(1, totalPages)}</span></span>
        )}

        {onItemsPerPageChange && (
          <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-4">
            <span className="text-[11px] text-slate-400 uppercase font-black tracking-wider">Per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-2 py-1 text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={safeCurrentPage === 1}
          title="First Page"
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous Page */}
        <button
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage === 1}
          title="Previous Page"
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page Buttons */}
        <div className="flex items-center gap-1 px-1">
          {pages.map((p, idx) => {
            if (typeof p === 'string') {
              return (
                <span key={idx} className="px-2 py-1 text-xs text-slate-400 font-bold select-none">
                  ...
                </span>
              );
            }
            const isActive = p === safeCurrentPage;
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage >= totalPages}
          title="Next Page"
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last Page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={safeCurrentPage >= totalPages}
          title="Last Page"
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
