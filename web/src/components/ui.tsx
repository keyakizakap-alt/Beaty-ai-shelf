import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 min-h-11 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap";
const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink hover:opacity-90",
  secondary: "border border-line-strong bg-surface text-ink hover:bg-surface-muted",
  ghost: "text-ink-2 hover:bg-surface-muted",
  danger: "border border-danger text-danger hover:bg-danger-soft",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function PageHeader({ title, lead, action }: { title: string; lead?: ReactNode; action?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-wide sm:text-3xl">{title}</h1>
        {lead && <p className="mt-2 max-w-2xl text-sm text-ink-2">{lead}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export function Section({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-base font-bold">{title}</h2>
      {description && <p className="mt-1 text-sm text-ink-3">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-ink-3">{hint}</p>}
    </div>
  );
}

export const inputClass =
  "w-full rounded-lg border border-line-strong bg-surface px-3 min-h-11 text-base text-ink placeholder:text-ink-3 focus:border-accent";

export const textareaClass =
  "w-full rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-base leading-relaxed text-ink placeholder:text-ink-3 focus:border-accent";

export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "danger"; children: ReactNode }) {
  const tones = {
    info: "bg-info-soft text-ink border-info/30",
    warn: "bg-warn-soft text-ink border-warn/30",
    danger: "bg-danger-soft text-ink border-danger/30",
  };
  return <div className={`rounded-lg border px-4 py-3 text-sm leading-relaxed ${tones[tone]}`}>{children}</div>;
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line-strong px-6 py-10 text-center">
      <p className="font-medium">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-sm text-ink-3">{children}</div>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-10 rounded-full border px-4 text-sm transition-colors ${
        selected ? "border-accent bg-accent-soft text-ink font-medium" : "border-line-strong bg-surface text-ink-2 hover:bg-surface-muted"
      }`}
    >
      {children}
    </button>
  );
}

export function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}
