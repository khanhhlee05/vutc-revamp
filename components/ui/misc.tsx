import { cn, initials } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="skeleton" aria-hidden className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}

export function Separator({ className, ...props }: React.ComponentProps<"hr">) {
  return <hr className={cn("border-t", className)} {...props} />;
}

/** Title row at the top of a page, with optional description and actions. */
export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0 space-y-1">
        {eyebrow ? <div className="text-sm text-muted-foreground">{eyebrow}</div> : null}
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description ? <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** Shown in place of a list or table that has nothing in it. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center", className)}>
      {Icon ? (
        <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-muted">
          <Icon className="size-5 text-muted-foreground" />
        </div>
      ) : null}
      <p className="text-sm font-medium">{title}</p>
      {description ? <p className="max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const letters = initials(name);
  return (
    <span
      aria-hidden
      className={cn("inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-brand-foreground", className)}
    >
      {letters}
    </span>
  );
}

/** Small number tile for dashboards. */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border bg-card p-4 shadow-xs", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
      </div>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
