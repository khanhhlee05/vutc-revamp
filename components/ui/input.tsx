import { cn } from "@/lib/utils";

/** Shared look for text-like controls: input, textarea, and native select. */
export const controlClass =
  "w-full min-w-0 rounded-md border border-input bg-card px-3 text-sm text-foreground shadow-xs transition-[color,box-shadow,border-color] duration-150 outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/20";

export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  if (type === "file") {
    return (
      <input
        type="file"
        data-slot="input"
        className={cn(
          "block w-full text-sm text-muted-foreground file:mr-3 file:h-9 file:cursor-pointer file:rounded-md file:border file:border-input file:bg-card file:px-3 file:text-sm file:font-medium file:text-foreground hover:file:bg-accent",
          className,
        )}
        {...props}
      />
    );
  }
  return <input type={type} data-slot="input" className={cn(controlClass, "h-9 py-1", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea data-slot="textarea" className={cn(controlClass, "min-h-24 py-2 leading-relaxed", className)} {...props} />;
}

/**
 * Native select, styled. Native keeps FormData, keyboard, and mobile pickers
 * working without extra code, which matters for server action forms.
 */
export function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        controlClass,
        "h-9 cursor-pointer appearance-none bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")] bg-[length:16px] bg-[right_0.6rem_center] bg-no-repeat pr-9",
        className,
      )}
      {...props}
    />
  );
}

export function Checkbox({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  return (
    <input
      type="checkbox"
      data-slot="checkbox"
      className={cn("size-4 shrink-0 cursor-pointer rounded border-input disabled:cursor-not-allowed disabled:opacity-50", className)}
      {...props}
    />
  );
}
