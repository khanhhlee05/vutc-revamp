"use client";

import Link from "next/link";
import { Tabs as Primitive } from "radix-ui";
import { cn } from "@/lib/utils";

/** In-page tabs that switch content without changing the URL. */
export const Tabs = Primitive.Root;

export function TabsList({ className, ...props }: React.ComponentProps<typeof Primitive.List>) {
  return <Primitive.List className={cn("flex gap-1 overflow-x-auto border-b", className)} {...props} />;
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof Primitive.Trigger>) {
  return (
    <Primitive.Trigger
      className={cn(
        "-mb-px shrink-0 border-b-2 border-transparent px-3 pb-2.5 pt-1 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export const TabsContent = Primitive.Content;

/**
 * Tabs where each tab is its own page. Server pages pass `active`, so this
 * needs no client state.
 */
export function LinkTabs({
  tabs,
  active,
  className,
}: {
  tabs: readonly { key: string; href: string; label: React.ReactNode }[];
  active: string;
  className?: string;
}) {
  return (
    <nav className={cn("flex gap-1 overflow-x-auto border-b", className)}>
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={active === t.key ? "page" : undefined}
          className={cn(
            "-mb-px shrink-0 border-b-2 px-3 pb-2.5 pt-1 text-sm font-medium transition-colors duration-150",
            active === t.key
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
