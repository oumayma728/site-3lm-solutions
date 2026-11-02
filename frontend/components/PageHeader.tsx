// PageHeader.tsx
interface PageHeaderProps { eyebrow: string; title: string; action?: React.ReactNode; }
export default function PageHeader({ eyebrow, title, action }: PageHeaderProps) {
  return (
    // Wraps on phones: the action buttons go under the title instead of overflowing
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--accent-secondary)' }}>{eyebrow}</p>
        <h1 className="font-display text-2xl sm:text-3xl break-words">{title}</h1>
      </div>
      {action}
    </div>
  );
}
