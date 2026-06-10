"use client";

import * as React from "react";

export function cx(...a: Array<string | false | null | undefined>): string {
  return a.filter(Boolean).join(" ");
}

export function Avatar({ initials, color = "#3E5C76", size = 36, ring = false, photo }: { initials: string; color?: string; size?: number; ring?: boolean; photo?: string | null }) {
  if (photo) {
    return (
      <img
        src={photo}
        alt={initials}
        className={cx("object-cover shrink-0", ring && "ring-2 ring-white shadow-sm")}
        style={{ width: size, height: size, borderRadius: size / 3 }}
      />
    );
  }
  return (
    <div
      className={cx("shrink-0 flex items-center justify-center font-semibold text-white", ring && "ring-2 ring-white shadow-sm")}
      style={{ width: size, height: size, borderRadius: size / 3, background: color, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}

type Tone = "neutral" | "good" | "warn" | "bad" | "info";
const pillMap: Record<Tone, string> = {
  neutral: "bg-[#F1F1EE] text-muted",
  good: "bg-goodSoft text-good",
  warn: "bg-warnSoft text-warn",
  bad: "bg-badSoft text-bad",
  info: "bg-accentSoft text-accent",
};
export function Pill({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-none", pillMap[tone])}>{children}</span>;
}

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";
const sizeMap: Record<Size, string> = { sm: "text-[13px] px-3 h-8", md: "text-sm px-4 h-9", lg: "text-sm px-5 h-11" };
const variantMap: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-black",
  secondary: "bg-white text-ink border border-line hover:bg-[#FAFAF8]",
  ghost: "text-accent hover:bg-accentSoft",
  danger: "bg-white text-bad border border-[#FAD1D6] hover:bg-badSoft",
};
export function Btn({ children, variant = "primary", size = "md", onClick, className, type = "button" }: { children: React.ReactNode; variant?: Variant; size?: Size; onClick?: () => void; className?: string; type?: "button" | "submit" }) {
  return (
    <button type={type} onClick={onClick} className={cx("inline-flex items-center justify-center gap-1.5 font-medium rounded-[10px] transition-colors select-none", sizeMap[size], variantMap[variant], className)}>
      {children}
    </button>
  );
}

export function Card({ children, className, pad = true }: { children: React.ReactNode; className?: string; pad?: boolean }) {
  return <div className={cx("bg-surface border border-line rounded-xl2", pad && "p-4 sm:p-5", className)}>{children}</div>;
}

export function InfoDot({ text }: { text: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        aria-label="What is this?"
        className="w-4 h-4 rounded-full border border-line text-faint text-[10px] leading-none flex items-center justify-center hover:text-ink hover:border-faint"
      >
        ?
      </button>
      {open && (
        <span className="absolute z-40 left-1/2 -translate-x-1/2 top-6 w-56 normal-case tracking-normal font-normal bg-ink text-white text-[12px] leading-snug rounded-[8px] p-2.5 shadow-lg">
          {text}
        </span>
      )}
    </span>
  );
}

export function SectionTitle({ children, action, info }: { children: React.ReactNode; action?: React.ReactNode; info?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-[13px] font-semibold uppercase tracking-wide text-faint flex items-center gap-1.5">
        {children}
        {info && <InfoDot text={info} />}
      </h3>
      {action}
    </div>
  );
}

export function ScoreRing({ score, size = 44, stroke = 4 }: { score: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const band = score >= 80 ? "#15803D" : score >= 60 ? "#B45309" : "#BE123C";
  const off = c * (1 - score / 100);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#EDEDEA" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={band} strokeWidth={stroke} fill="none" strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-semibold" style={{ fontSize: size * 0.3, color: band }}>
        {score}
      </div>
    </div>
  );
}

export function Segmented<T extends string>({ options, value, onChange, size = "md" }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; size?: "sm" | "md" }) {
  return (
    <div className={cx("inline-flex bg-[#EFEFEC] rounded-[10px] p-0.5", size === "sm" && "text-[13px]")}>
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)} className={cx("px-3 rounded-[8px] font-medium transition-colors", size === "sm" ? "h-7" : "h-8 text-sm", value === o.value ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ on, onClick }: { on: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={cx("w-10 h-6 rounded-full transition-colors relative shrink-0", on ? "bg-good" : "bg-[#D8D8D3]")}>
      <span className={cx("absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all", on ? "left-[18px]" : "left-0.5")} />
    </button>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-center text-[13px] text-faint py-8 border border-dashed border-line rounded-[12px]">{children}</div>;
}

export function Star({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill={filled ? "#E0A100" : "none"} stroke={filled ? "#E0A100" : "#C9C9C4"} strokeWidth={1.5}>
      <path d="M12 3l2.6 5.7 6.2.6-4.7 4.1 1.4 6.1L12 16.9 6.5 19.6l1.4-6.1L3.2 9.3l6.2-.6z" />
    </svg>
  );
}
