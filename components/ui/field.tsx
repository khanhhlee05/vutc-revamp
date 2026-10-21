import { cn } from "@/lib/utils";

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn("flex items-center gap-1 text-sm font-medium leading-none text-foreground select-none", className)}
      {...props}
    />
  );
}

/**
 * Label, control, hint, and error stacked together. Pass the control's id as
 * `name`; the control should set aria-describedby={describedBy(name, error, hint)}
 * and aria-invalid when there is an error.
 */
export function Field({
  label,
  name,
  error,
  hint,
  optional,
  className,
  children,
}: {
  label: React.ReactNode;
  name: string;
  error?: string;
  hint?: React.ReactNode;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div data-slot="field" className={cn("space-y-1.5", className)}>
      <Label htmlFor={name}>
        {label}
        {optional ? <span className="font-normal text-muted-foreground">(optional)</span> : null}
      </Label>
      {children}
      {hint && !error ? (
        <p id={`${name}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? <FieldError id={`${name}-error`}>{error}</FieldError> : null}
    </div>
  );
}

export function FieldError({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-xs font-medium text-destructive", className)} {...props} />;
}

/** aria-describedby value matching the ids Field renders. */
export function describedBy(name: string, error?: string, hint?: unknown): string | undefined {
  if (error) return `${name}-error`;
  if (hint) return `${name}-hint`;
  return undefined;
}

/** A titled group of fields inside a form. */
export function FormSection({
  title,
  description,
  className,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className={cn("space-y-4", className)}>
      <div className="space-y-1">
        <legend className="text-base font-semibold">{title}</legend>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </fieldset>
  );
}
