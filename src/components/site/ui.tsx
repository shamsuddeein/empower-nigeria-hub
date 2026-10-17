import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export const btn = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold text-center text-balance break-words transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "bg-action text-action-foreground hover:bg-action-hover shadow-xs",
        secondary: "border border-navy text-navy bg-surface hover:bg-accent",
        ghost: "text-navy hover:bg-accent",
        navy: "bg-navy text-navy-foreground hover:opacity-90 shadow-xs",
        onNavy: "border border-navy-foreground/60 text-navy-foreground hover:bg-navy-foreground/10",
        onAction: "bg-surface text-action hover:bg-action-soft",
        danger: "bg-destructive text-destructive-foreground hover:opacity-90",
      },
      size: {
        sm: "min-h-[44px] px-3.5 py-2 text-sm leading-snug",
        md: "min-h-[48px] h-12 px-4 py-2.5 text-base leading-snug",
        lg: "min-h-[52px] h-14 px-5 py-3 text-lg leading-snug",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);
export type BtnProps = VariantProps<typeof btn>;

export const Button = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & BtnProps>(
  ({ className, variant, size, ...p }, ref) => <button ref={ref} className={cn(btn({ variant, size }), className)} {...p} />,
);
Button.displayName = "Button";

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("container-site", className)}>{children}</div>;
}

export function Card({
  className,
  children,
  highlight = false,
}: {
  className?: string;
  children: ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-surface transition-all",
        highlight ? "border-2 border-navy shadow-sm" : "border-border shadow-xs",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("p-4 sm:p-6 border-b border-border/60", className)}>{children}</div>;
}

export function CardTitle({ className, children }: { className?: string; children: ReactNode }) {
  return <h3 className={cn("font-display text-xl font-bold text-navy", className)}>{children}</h3>;
}

export function CardDescription({ className, children }: { className?: string; children: ReactNode }) {
  return <p className={cn("mt-1.5 text-sm text-muted-foreground leading-relaxed", className)}>{children}</p>;
}

export function CardContent({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("p-4 sm:p-6", className)}>{children}</div>;
}

export function CardFooter({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("p-4 sm:p-6 border-t border-border/60 bg-surface/50 rounded-b-lg", className)}>{children}</div>;
}

export function Section({ className, children, id, tone = "plain" }: { className?: string; children: ReactNode; id?: string; tone?: "plain" | "surface" | "navy" | "action" }) {
  const tones = {
    plain: "",
    surface: "bg-surface border-y",
    navy: "bg-navy text-navy-foreground",
    action: "bg-action text-action-foreground",
  };
  return (
    <section id={id} className={cn("py-12 md:py-20 scroll-mt-24", tones[tone], className)}>
      <Container>{children}</Container>
    </section>
  );
}

export function PageHeader({ eyebrow, title, children, actions }: { eyebrow?: string; title: ReactNode; children?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="border-b bg-surface">
      <Container className="py-10 md:py-16">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="max-w-3xl text-3xl font-extrabold md:text-5xl">{title}</h1>
        {children && <div className="mt-4 max-w-2xl text-lg text-muted-foreground">{children}</div>}
        {actions && <div className="mt-6 flex flex-wrap gap-3">{actions}</div>}
      </Container>
    </header>
  );
}

/** Labeled placeholder where a real photo will go. Pass src to show a real image. */
export function Photo({ label, src, className, ratio = "aspect-[4/3]", eager }: { label: string; src?: string | null | undefined; className?: string; ratio?: string; eager?: boolean }) {
  if (src)
    return (
      <div className={cn("overflow-hidden rounded-lg bg-muted", ratio, className)}>
        <img src={src} alt={label} loading={eager ? "eager" : "lazy"} decoding="async" width={800} height={600} className="size-full object-cover" />
      </div>
    );
  return (
    <div role="img" aria-label={label} className={cn("flex items-end rounded-lg border border-dashed border-input bg-muted p-4", ratio, className)}>
      <span className="text-sm font-medium text-muted-foreground">Photo: {label}</span>
    </div>
  );
}

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "good" | "warn" | "bad" | "navy"; className?: string }) {
  const t = {
    neutral: "bg-muted text-foreground",
    good: "bg-action-soft text-action-hover",
    warn: "bg-warning-soft text-warning",
    bad: "bg-destructive/10 text-destructive",
    navy: "bg-accent text-navy",
  };
  return <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold max-w-full text-balance break-words", t[tone], className)}>{children}</span>;
}

export const inputCls =
  "w-full rounded-lg border border-input bg-surface px-3.5 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring aria-[invalid=true]:border-destructive min-h-[48px]";

type FieldBase = { label: string; error?: string | undefined; hint?: string | undefined; optional?: boolean | undefined };

function FieldWrap({ id, label, error, hint, optional, children }: FieldBase & { id: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-foreground">
        {label} {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
      </label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="text-sm text-muted-foreground">{hint}</p>}
      {error && <p id={`${id}-err`} className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
}

export function Input({ label, error, hint, optional, className, id: explicitId, ...p }: FieldBase & React.InputHTMLAttributes<HTMLInputElement>) {
  const genId = useId();
  const id = explicitId ?? genId;
  return (
    <FieldWrap id={id} label={label} error={error} hint={hint} optional={optional}>
      <input id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined} className={cn(inputCls, "h-12", className)} {...p} />
    </FieldWrap>
  );
}

export function Select({ label, error, hint, optional, children, className, id: explicitId, ...p }: FieldBase & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const genId = useId();
  const id = explicitId ?? genId;
  return (
    <FieldWrap id={id} label={label} error={error} hint={hint} optional={optional}>
      <select id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} className={cn(inputCls, "h-12", className)} {...p}>
        {children}
      </select>
    </FieldWrap>
  );
}

export function Textarea({ label, error, hint, optional, className, id: explicitId, ...p }: FieldBase & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const genId = useId();
  const id = explicitId ?? genId;
  return (
    <FieldWrap id={id} label={label} error={error} hint={hint} optional={optional}>
      <textarea id={id} rows={4} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} className={cn(inputCls, "py-3", className)} {...p} />
    </FieldWrap>
  );
}

export function Checkbox({ label, error, ...p }: { label: ReactNode; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="flex min-h-12 cursor-pointer items-start gap-3 py-2 text-base">
        <input id={id} type="checkbox" className="mt-1 size-5 shrink-0 accent-[var(--action)]" aria-invalid={!!error} {...p} />
        <span>{label}</span>
      </label>
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm font-medium text-destructive">
      {message}
    </p>
  );
}
