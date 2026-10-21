import { cva, type VariantProps } from "class-variance-authority";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const alertVariants = cva("flex gap-3 rounded-lg border px-4 py-3 text-sm [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0", {
  variants: {
    variant: {
      info: "border-info-border bg-info-soft [&>svg]:text-info",
      success: "border-success-border bg-success-soft [&>svg]:text-success",
      warning: "border-warning-border bg-warning-soft [&>svg]:text-warning",
      danger: "border-danger-border bg-danger-soft [&>svg]:text-destructive",
    },
  },
  defaultVariants: { variant: "info" },
});

const ICONS = { info: Info, success: CircleCheck, warning: TriangleAlert, danger: CircleAlert };

/**
 * Inline message box. Uses role="alert" for danger so screen readers announce
 * it, and role="status" for the rest.
 */
export function Alert({
  variant = "info",
  title,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & VariantProps<typeof alertVariants> & { title?: React.ReactNode }) {
  const Icon = ICONS[variant ?? "info"];
  return (
    <div role={variant === "danger" ? "alert" : "status"} className={cn(alertVariants({ variant }), className)} {...props}>
      <Icon aria-hidden />
      <div className="min-w-0 space-y-0.5">
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? <div className={title ? "text-foreground/80" : undefined}>{children}</div> : null}
      </div>
    </div>
  );
}
