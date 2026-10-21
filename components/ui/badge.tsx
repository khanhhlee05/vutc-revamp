import { cva, type VariantProps } from "class-variance-authority";
import type { EventStatus } from "@/db/schema";
import { STATUS_LABELS } from "@/lib/events/status";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium [&_svg]:size-3",
  {
    variants: {
      variant: {
        neutral: "border-border bg-muted text-muted-foreground",
        primary: "border-transparent bg-primary text-primary-foreground",
        info: "border-info-border bg-info-soft text-info",
        success: "border-success-border bg-success-soft text-success",
        warning: "border-warning-border bg-warning-soft text-warning",
        danger: "border-danger-border bg-danger-soft text-destructive",
        brand: "border-transparent bg-brand text-brand-foreground",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

const STATUS_VARIANT: Record<EventStatus, BadgeVariant> = {
  requested: "info",
  confirmed: "primary",
  open: "success",
  completed: "neutral",
  payroll_created: "warning",
  billed: "warning",
  paid: "success",
  cancelled: "danger",
  archived: "neutral",
};

/** Event lifecycle status with a consistent color for each stage. */
export function StatusBadge({ status, className }: { status: EventStatus; className?: string }) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className={className}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {STATUS_LABELS[status]}
    </Badge>
  );
}
