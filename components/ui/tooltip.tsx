"use client";

import { Tooltip as Primitive } from "radix-ui";
import { cn } from "@/lib/utils";

export const TooltipProvider = Primitive.Provider;

export function Tooltip({
  content,
  side = "right",
  disabled,
  children,
}: {
  content: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  disabled?: boolean;
  children: React.ReactNode;
}) {
  if (disabled) return children;
  return (
    <Primitive.Root>
      <Primitive.Trigger asChild>{children}</Primitive.Trigger>
      <Primitive.Portal>
        <Primitive.Content
          side={side}
          sideOffset={8}
          className={cn(
            "z-50 rounded-md bg-foreground px-2.5 py-1 text-xs font-medium text-background shadow-md",
            "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          )}
        >
          {content}
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
