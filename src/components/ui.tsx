import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import type { Belt } from '../types';
import { beltOf } from '../data/labels';

type Variant = 'brass' | 'steel' | 'ghost' | 'danger' | 'ok' | 'outline';

/* iOS button styles: filled (brass = tint), tinted grey (steel), plain (ghost). */
const VARIANTS: Record<Variant, string> = {
  brass: 'bg-brass-500 text-white font-semibold hover:brightness-110',
  steel: 'bg-fill text-brass-400 font-semibold hover:bg-fill-strong',
  ghost: 'bg-transparent text-brass-400 font-medium hover:bg-fill',
  danger: 'bg-bad/12 text-red-300 font-semibold hover:bg-bad/20',
  ok: 'bg-ok/15 text-emerald-300 font-semibold hover:bg-ok/25',
  outline: 'bg-fill text-slate-100 font-semibold hover:bg-fill-strong',
};

export function Button({
  variant = 'steel',
  size = 'md',
  icon,
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg'; icon?: IconName }) {
  const sizes = {
    sm: 'min-h-8 px-3.5 py-1.5 text-[15px] rounded-full gap-1.5',
    md: 'min-h-11 px-4 py-2.5 text-[16px] rounded-xl gap-2',
    lg: 'min-h-[50px] px-5 py-3.5 text-[17px] rounded-[14px] gap-2',
  };
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center transition active:opacity-60 disabled:opacity-40 disabled:pointer-events-none ${VARIANTS[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 18} />}
      {children}
    </button>
  );
}

export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div className={`card ${onClick ? 'cursor-pointer transition active:opacity-70' : ''} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}

/** iOS "title 2" section heading (as in Health / Fitness). */
export function SectionTitle({ children, action, sub }: { children: ReactNode; action?: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-2.5 mt-7 flex items-end justify-between gap-3 px-1 first:mt-0">
      <div className="min-w-0">
        <h2 className="font-display text-[22px] font-bold leading-tight text-slate-50">{children}</h2>
        {sub && <p className="mt-0.5 text-[13px] text-slate-400">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/** iOS grouped-list header: small grey caps above an inset group. */
export function GroupLabel({ children }: { children: ReactNode }) {
  return <div className="mb-1.5 mt-6 px-4 text-[13px] uppercase tracking-wide text-slate-400">{children}</div>;
}

/** iOS segmented control. */
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
    <div className={`relative flex rounded-[9px] bg-fill p-0.5 ${className}`}>
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={`relative z-10 flex flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-[7px] ${size === 'sm' ? 'px-2 py-1 text-[12px]' : 'px-3 py-1.5 text-[13px]'} transition ${
              active ? 'font-semibold text-slate-50' : 'font-medium text-slate-100'
            }`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${options.map((x) => x.id).join('')}`}
                className="absolute inset-0 -z-10 rounded-[7px] bg-seg shadow-[0_3px_8px_rgba(0,0,0,0.12),0_3px_1px_rgba(0,0,0,0.04)]"
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
      className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[14px] transition ${
        active ? 'bg-brass-500 font-semibold text-white' : 'bg-fill font-medium text-slate-100 hover:bg-fill-strong'
      }`}
      style={color && active ? { background: color } : undefined}
    >
      {children}
    </button>
  );
}

export function BeltBadge({ belt, size = 'md', showLabel = true }: { belt: Belt; size?: 'sm' | 'md'; showLabel?: boolean }) {
  const b = beltOf(belt);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'}`}
      style={{ background: b.color, color: b.text, boxShadow: belt === 'white' || belt === 'black' ? 'inset 0 0 0 1px rgba(120,120,128,0.35)' : undefined }}
      title={`${b.label} pás`}
    >
      <svg width={size === 'sm' ? 10 : 12} height={size === 'sm' ? 10 : 12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <path d="M2 12h20M9 12l-3 8M15 12l3 8" />
      </svg>
      {showLabel && b.label}
    </span>
  );
}

/** iOS-style bottom sheet with grabber. */
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
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          // stop catching taps the moment the sheet starts closing, even if the exit animation never reports completion
          exit={{ opacity: 0, pointerEvents: 'none' }}
        >
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={`relative flex w-full max-w-lg flex-col overflow-hidden rounded-t-[14px] bg-ink-950 shadow-2xl sm:rounded-[14px] ${tall ? 'h-[94dvh]' : 'max-h-[94dvh]'}`}
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 38 }}
          >
            <div className="mx-auto mt-1.5 h-[5px] w-9 rounded-full bg-fill-strong sm:hidden" />
            <div className="relative flex items-center justify-center px-14 pb-2 pt-2.5">
              <div className="truncate text-[17px] font-semibold text-slate-50">{title}</div>
              <button onClick={onClose} className="absolute right-3 top-1.5 rounded-full bg-fill p-1.5 text-slate-400 hover:bg-fill-strong" aria-label="Zavřít">
                <Icon name="x" size={18} strokeWidth={2.6} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3">{children}</div>
            {footer && <div className="border-t border-sep bg-ink-950 px-4 py-3 pb-[calc(0.75rem+var(--safe-bottom))]">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block px-1 text-[13px] text-slate-400">{label}</span>
      {children}
      {hint && <span className="mt-1 block px-1 text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

/** iOS switch. */
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors ${checked ? 'bg-ok' : 'bg-fill-strong'}`}
    >
      <motion.span
        className="absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.15),0_1px_1px_rgba(0,0,0,0.16)]"
        animate={{ left: checked ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 600, damping: 35 }}
      />
    </button>
  );
}

export function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; desc?: ReactNode }) {
  return (
    <div className="flex w-full items-center justify-between gap-4 py-2.5 text-left" onClick={() => onChange(!checked)}>
      <span>
        <span className="block text-[16px] text-slate-50">{label}</span>
        {desc && <span className="block text-[13px] text-slate-400">{desc}</span>}
      </span>
      <span onClick={(e) => e.stopPropagation()}>
        <Switch checked={checked} onChange={onChange} label={typeof label === 'string' ? label : undefined} />
      </span>
    </div>
  );
}

/** Coloured rounded-square icon, as in iOS Settings. */
export function IconTile({ icon, color, size = 30 }: { icon: IconName; color: string; size?: number }) {
  return (
    <span className="flex shrink-0 items-center justify-center text-white" style={{ background: color, width: size, height: size, borderRadius: size * 0.26 }}>
      <Icon name={icon} size={Math.round(size * 0.58)} strokeWidth={2.3} />
    </span>
  );
}

/** Inset grouped list (white rounded group with hairline separators). */
export function ListGroup({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card overflow-hidden ${className}`}>{children}</div>;
}

export function ListRow({
  icon,
  color,
  title,
  sub,
  value,
  onClick,
  chevron = !!onClick,
  children,
  last,
}: {
  icon?: IconName;
  color?: string;
  title: ReactNode;
  sub?: ReactNode;
  value?: ReactNode;
  onClick?: () => void;
  chevron?: boolean;
  children?: ReactNode;
  last?: boolean;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`relative flex min-h-11 w-full items-center gap-3 px-4 py-2 text-left ${onClick ? 'transition active:bg-fill' : ''}`}
    >
      {icon && color && <IconTile icon={icon} color={color} />}
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] leading-snug text-slate-50">{title}</span>
        {sub && <span className="block text-[13px] leading-snug text-slate-400">{sub}</span>}
      </span>
      {value != null && <span className="shrink-0 text-[16px] text-slate-400">{value}</span>}
      {children}
      {chevron && <Icon name="chevronRight" size={16} strokeWidth={2.6} className="shrink-0 text-slate-600" />}
      {!last && <span className={`absolute bottom-0 right-0 h-px bg-sep ${icon ? 'left-[58px]' : 'left-4'}`} />}
    </Tag>
  );
}

export function Stat({ label, value, sub, accent = 'text-slate-50' }: { label: string; value: ReactNode; sub?: ReactNode; accent?: string }) {
  return (
    <div className="card px-3.5 py-3">
      <div className="text-[13px] font-medium text-slate-400">{label}</div>
      <div className={`mt-0.5 font-mono text-[22px] font-semibold leading-tight ${accent}`}>{value}</div>
      {sub && <div className="mt-0.5 truncate text-[12px] text-slate-500">{sub}</div>}
    </div>
  );
}

export function Empty({ icon, title, children }: { icon: IconName; title: string; children?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-10 text-center">
      <div className="mb-3 rounded-full bg-fill p-4 text-slate-500">
        <Icon name={icon} size={30} />
      </div>
      <div className="text-[17px] font-semibold text-slate-50">{title}</div>
      {children && <div className="mt-1 text-[15px] text-slate-400">{children}</div>}
    </div>
  );
}

/** iOS large title. */
export function PageHeader({ title, subtitle, right }: { title: ReactNode; subtitle?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3 px-1">
      <div className="min-w-0">
        <h1 className="font-display text-[34px] font-bold leading-[1.15] text-slate-50">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[15px] text-slate-400">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function ProgressBar({ value, max = 1, color = 'bg-brass-500' }: { value: number; max?: number; color?: string }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1e-9, max)) * 100));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-fill">
      <motion.div className={`h-full rounded-full ${color}`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} />
    </div>
  );
}

/** Concentric activity rings (Apple Fitness style). values are 0..1. */
export function Rings({ rings, size = 120 }: { rings: { value: number; color: string; label: string }[]; size?: number }) {
  const stroke = size * 0.105;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={rings.map((r) => `${r.label} ${Math.round(r.value * 100)} %`).join(', ')}>
      {rings.map((r, i) => {
        const rad = size / 2 - stroke / 2 - i * (stroke + 2);
        const c = 2 * Math.PI * rad;
        const v = Math.max(0, Math.min(1, r.value));
        return (
          <g key={r.label} transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            <circle cx={size / 2} cy={size / 2} r={rad} fill="none" stroke={r.color} strokeOpacity={0.2} strokeWidth={stroke} />
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={rad}
              fill="none"
              stroke={r.color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={c}
              initial={{ strokeDashoffset: c }}
              animate={{ strokeDashoffset: c * (1 - v) }}
              transition={{ duration: 1, ease: 'easeOut', delay: i * 0.1 }}
            />
          </g>
        );
      })}
    </svg>
  );
}

/** Grouped-list row backed by a native <select> (iOS shows its wheel picker). */
export function SelectRow({
  icon,
  color,
  title,
  value,
  onChange,
  options,
  placeholder = '—',
  last,
}: {
  icon: IconName;
  color: string;
  title: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  last?: boolean;
}) {
  const current = options.find((o) => o.value === value)?.label ?? placeholder;
  return (
    <label className="relative flex min-h-11 w-full cursor-pointer items-center gap-3 px-4 py-2 transition active:bg-fill">
      <IconTile icon={icon} color={color} />
      <span className="shrink-0 text-[16px] text-slate-50">{title}</span>
      <span className="min-w-0 flex-1 truncate text-right text-[16px] text-slate-400">{current}</span>
      <Icon name="chevronDown" size={15} strokeWidth={2.6} className="shrink-0 text-slate-600" />
      <select aria-label={title} className="absolute inset-0 cursor-pointer opacity-0" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {!last && <span className="absolute bottom-0 left-[58px] right-0 h-px bg-sep" />}
    </label>
  );
}
