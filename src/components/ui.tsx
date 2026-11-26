import type { ReactNode } from 'react';

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function Button({
  children,
  tone = 'olive',
  type = 'button',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'olive' | 'clay' | 'ghost' | 'paper' }) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 text-base font-semibold transition active:scale-[0.99] disabled:opacity-50',
        tone === 'olive' && 'bg-olive text-paper hover:bg-olive-2',
        tone === 'clay' && 'bg-clay text-white hover:brightness-110',
        tone === 'ghost' && 'border border-line bg-card text-ink hover:bg-sand',
        tone === 'paper' && 'bg-paper text-olive',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement> & { tone?: 'warn' | 'bad' }) {
  const { tone, className, ...rest } = props;
  return (
    <input
      className={cx(
        'min-h-12 w-full rounded-xl border px-3 text-base outline-none focus:border-olive-2 focus:ring-2 focus:ring-olive/20',
        tone === 'bad' && 'border-bad bg-bad-bg',
        tone === 'warn' && 'border-clay bg-warn-bg',
        !tone && 'border-line bg-card',
        className,
      )}
      {...rest}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { tone?: 'warn' | 'bad' }) {
  const { tone, className, ...rest } = props;
  return (
    <textarea
      className={cx(
        'min-h-24 w-full rounded-xl border px-3 py-2 text-base outline-none focus:border-olive-2 focus:ring-2 focus:ring-olive/20',
        tone === 'bad' && 'border-bad bg-bad-bg',
        tone === 'warn' && 'border-clay bg-warn-bg',
        !tone && 'border-line bg-card',
        className,
      )}
      {...rest}
    />
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold">{label}</span>
        {hint ? <span className="text-right text-xs font-semibold text-warn">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

export function Dialog({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/45 p-3 min-[800px]:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[92dvh] w-full max-w-lg overflow-auto rounded-3xl bg-card p-4 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="font-display text-2xl leading-tight">{title}</h2>
          <button type="button" className="min-h-10 rounded-full px-3 text-sm font-semibold text-muted" onClick={onClose}>
            Kapat
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
