import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import type { Belt } from '../types';
import { beltOf } from '../data/labels';

type Variant = 'brass' | 'steel' | 'ghost' | 'danger' | 'ok' | 'outline';

const VARIANTS: Record<Variant, string> = {
  brass:
    'bg-gradient-to-br from-brass-400 via-brass-500 to-coral-500 text-ink-950 font-bold shadow-[0_10px_24px_-10px_rgba(255,143,31,0.75)] hover:brightness-105',
  steel: 'bg-white/[0.07] text-slate-100 font-semibold border border-white/[0.08] hover:bg-white/[0.11]',
  ghost: 'bg-transparent text-steel-300 font-semibold hover:bg-white/[0.06]',
  danger: 'bg-bad/15 text-rose-200 font-semibold border border-bad/30 hover:bg-bad/25',
  ok: 'bg-ok/15 text-emerald-200 font-semibold border border-ok/30 hover:bg-ok/25',
  outline: 'bg-transparent border border-white/[0.12] text-slate-200 font-semibold hover:border-brass-400 hover:text-brass-300',
};

export function Button({
  variant = 'steel',
  size = 'md',
  icon,
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg'; icon?: IconName }) {
  const sizes = { sm: 'px-3.5 py-1.5 text-sm rounded-full gap-1.5', md: 'px-4.5 py-2.5 text-[0.95rem] rounded-2xl gap-2', lg: 'px-5 py-3.5 text-base rounded-[1.4rem] gap-2' };
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center transition active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none ${VARIANTS[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 18} />}
      {children}
    </button>
  );
}

export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div className={`card ${onClick ? 'cursor-pointer transition hover:border-white/15 active:scale-[0.99]' : ''} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, action, sub }: { children: ReactNode; action?: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-3 mt-8 flex items-end justify-between gap-3 px-1 first:mt-0">
      <div className="min-w-0">
        <h2 className="font-display text-[1.2rem] font-semibold leading-tight text-slate-50">{children}</h2>
        {sub && <p className="mt-0.5 text-[0.8rem] text-slate-400">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className = '',
  size = 'md',
}: {
  value: T;
  options: { id: T; label: ReactNode }[];
  onChange: (v: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div className={`relative flex rounded-2xl border border-white/[0.06] bg-black/25 p-1 ${className}`}>
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={`relative z-10 flex-1 whitespace-nowrap rounded-xl ${size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-2 text-sm'} font-bold transition ${
              active ? 'text-ink-950' : 'text-steel-400 hover:text-slate-200'
            }`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${options.map((x) => x.id).join('')}`}
                className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-brass-400 to-brass-600 shadow-[0_6px_16px_-8px_rgba(255,143,31,0.8)]"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Chip({
  active,
  children,
  onClick,
  color,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[0.8rem] font-bold transition ${
        active ? 'border-brass-400/70 bg-brass-400/15 text-brass-300' : 'border-white/[0.08] bg-white/[0.04] text-steel-400 hover:text-slate-200'
      }`}
      style={color && active ? { borderColor: color, color } : undefined}
    >
      {children}
    </button>
  );
}

export function BeltBadge({ belt, size = 'md', showLabel = true }: { belt: Belt; size?: 'sm' | 'md'; showLabel?: boolean }) {
  const b = beltOf(belt);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}
      style={{ background: b.color, color: b.text, boxShadow: belt === 'black' ? 'inset 0 0 0 1px #475569' : undefined }}
      title={`${b.label} pás`}
    >
      <svg width={size === 'sm' ? 10 : 12} height={size === 'sm' ? 10 : 12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <path d="M2 12h20M9 12l-3 8M15 12l3 8" />
      </svg>
      {showLabel && b.label}
    </span>
  );
}

export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  tall,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  tall?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={`relative flex w-full max-w-lg flex-col overflow-hidden rounded-t-[2rem] border border-white/[0.08] bg-gradient-to-b from-ink-850 to-ink-900 shadow-2xl sm:rounded-[2rem] ${tall ? 'h-[92dvh]' : 'max-h-[92dvh]'}`}
            initial={{ y: 60, opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
          >
            <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-white/15 sm:hidden" />
            <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-2.5">
              <div className="font-display text-lg font-semibold text-slate-50">{title}</div>
              <button onClick={onClose} className="rounded-full bg-white/[0.06] p-1.5 text-steel-400 hover:bg-white/10 hover:text-white" aria-label="Zavřít">
                <Icon name="x" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
            {footer && <div className="border-t border-white/[0.06] bg-black/20 px-5 py-3 pb-[calc(0.75rem+var(--safe-bottom))]">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1.5 block text-[0.8rem] font-bold text-slate-300">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; desc?: ReactNode }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-4 py-2.5 text-left">
      <span>
        <span className="block text-[0.95rem] font-semibold text-slate-100">{label}</span>
        {desc && <span className="block text-xs text-slate-500">{desc}</span>}
      </span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-gradient-to-r from-brass-400 to-brass-600' : 'bg-white/[0.12]'}`}>
        <motion.span
          className="absolute top-1 h-5 w-5 rounded-full bg-white shadow"
          animate={{ left: checked ? 24 : 4 }}
          transition={{ type: 'spring', stiffness: 600, damping: 35 }}
        />
      </span>
    </button>
  );
}

export function Stat({ label, value, sub, accent = 'text-slate-100' }: { label: string; value: ReactNode; sub?: ReactNode; accent?: string }) {
  return (
    <div className="card px-4 py-3.5">
      <div className="text-[0.8rem] font-semibold text-slate-400">{label}</div>
      <div className={`mt-0.5 font-mono text-[1.4rem] font-extrabold leading-tight ${accent}`}>{value}</div>
      {sub && <div className="mt-0.5 truncate text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

export function Empty({ icon, title, children }: { icon: IconName; title: string; children?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-10 text-center">
      <div className="mb-3 rounded-full bg-white/[0.06] p-4 text-brass-300">
        <Icon name={icon} size={28} />
      </div>
      <div className="font-display text-lg font-semibold text-slate-100">{title}</div>
      {children && <div className="mt-1 text-sm text-slate-400">{children}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, right }: { title: ReactNode; subtitle?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3 px-1">
      <div className="min-w-0">
        <h1 className="font-display text-[2rem] font-semibold leading-tight text-slate-50">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function ProgressBar({ value, max = 1, color = 'bg-brass-500' }: { value: number; max?: number; color?: string }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1e-9, max)) * 100));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.07]">
      <motion.div className={`h-full rounded-full ${color}`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} />
    </div>
  );
}
