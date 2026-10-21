import { AudioLines } from "lucide-react";
import { cn } from "@/lib/utils";

/** Placeholder mark until VUTC has an official logo file. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-foreground shadow-xs", className)}
    >
      <AudioLines className="size-4.5" strokeWidth={2.25} />
    </span>
  );
}
