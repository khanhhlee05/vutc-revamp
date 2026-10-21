"use client";

import { X } from "lucide-react";
import { Dialog as Primitive } from "radix-ui";
import { cn } from "@/lib/utils";

/** Side drawer, used for navigation on small screens. */
export const Sheet = Primitive.Root;
export const SheetTrigger = Primitive.Trigger;
export const SheetClose = Primitive.Close;
export const SheetTitle = Primitive.Title;

export function SheetContent({
  side = "left",
  className,
  children,
  ...props
}: React.ComponentProps<typeof Primitive.Content> & { side?: "left" | "right" }) {
  return (
    <Primitive.Portal>
      <Primitive.Overlay className="fixed inset-0 z-50 bg-slate-950/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <Primitive.Content
        aria-describedby={undefined}
        className={cn(
          "fixed inset-y-0 z-50 flex w-72 max-w-[85vw] flex-col bg-sidebar shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out",
          side === "left"
            ? "left-0 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left"
            : "right-0 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
          className,
        )}
        {...props}
      >
        {children}
        <Primitive.Close className="absolute top-4 right-4 rounded-sm text-muted-foreground transition-colors hover:text-foreground">
          <X className="size-5" />
          <span className="sr-only">Close menu</span>
        </Primitive.Close>
      </Primitive.Content>
    </Primitive.Portal>
  );
}
