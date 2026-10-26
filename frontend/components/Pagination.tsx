'use client';

import { useState } from 'react';

export const PAGE_SIZE = 20;

/**
 * Splits an already filtered list into pages, in the browser (the admin lists filter and count
 * on the whole list, so pagination happens after filtering).
 *
 * `resetKey`: anything that changes the list (search, tab, filters…). When it changes, the list
 * goes back to page 1. Deleting the last item of the last page moves back one page by itself.
 */
export function usePagination<T>(items: T[], resetKey = '', pageSize = PAGE_SIZE) {
  const [state, setState] = useState({ page: 1, key: resetKey });
  const requested = state.key === resetKey ? state.page : 1;
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(requested, pageCount);
  const start = (page - 1) * pageSize;

  return {
    page,
    pageCount,
    pageSize,
    total: items.length,
    pageItems: items.slice(start, start + pageSize),
    // Position of the first item of the page in the whole list (for row numbering / animation delays)
    offset: start,
    setPage: (p: number) => setState({ page: Math.max(1, Math.min(p, pageCount)), key: resetKey }),
  };
}

// 1 … 4 5 [6] 7 8 … 20
function pageNumbers(page: number, count: number): (number | '…')[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const around = [page - 1, page, page + 1].filter((p) => p > 1 && p < count);
  const out: (number | '…')[] = [1];
  if (around[0] > 2) out.push('…');
  out.push(...around);
  if (around[around.length - 1] < count - 1) out.push('…');
  out.push(count);
  return out;
}

const btn =
  'flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40';

export function Pagination({
  page, pageCount, total, pageSize, setPage, label = 'éléments', className = '',
}: {
  page: number; pageCount: number; total: number; pageSize: number;
  setPage: (p: number) => void; label?: string; className?: string;
}) {
  if (pageCount <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const go = (p: number, e: React.MouseEvent<HTMLButtonElement>) => {
    setPage(p);
    // Back to the top of this list (its container), not of the page: a page can hold several lists
    e.currentTarget.closest('nav')?.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav
      aria-label="Pagination"
      className={`mt-4 flex flex-wrap items-center justify-between gap-3 text-sm ${className}`}
    >
      <span className="text-[var(--ink-soft)]">
        Affichage <span className="font-mono-num text-[var(--ink)]">{from}–{to}</span> sur{' '}
        <span className="font-mono-num text-[var(--ink)]">{total}</span> {label}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className={`${btn} border border-[var(--line)] bg-[var(--surface)] hover:border-[var(--accent-secondary)] hover:text-[var(--accent-secondary)]`}
          onClick={(e) => go(page - 1, e)}
          disabled={page === 1}
          aria-label="Page précédente"
        >
          ←
        </button>
        {pageNumbers(page, pageCount).map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="px-1 text-[var(--ink-soft)]">…</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={(e) => go(p, e)}
              aria-current={p === page ? 'page' : undefined}
              className={`${btn} font-mono-num ${
                p === page ? 'text-white' : 'text-[var(--ink-soft)] hover:bg-[var(--line)]/60 hover:text-[var(--ink)]'
              }`}
              style={p === page ? { backgroundColor: 'var(--accent-primary)' } : undefined}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          className={`${btn} border border-[var(--line)] bg-[var(--surface)] hover:border-[var(--accent-secondary)] hover:text-[var(--accent-secondary)]`}
          onClick={(e) => go(page + 1, e)}
          disabled={page === pageCount}
          aria-label="Page suivante"
        >
          →
        </button>
      </div>
    </nav>
  );
}
