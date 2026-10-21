"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { activeHref, SITE_LINKS } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { BrandMark } from "./brand";

/** Inline links in the public header, with the current page highlighted. */
export function SiteNavLinks({ className }: { className?: string }) {
  const current = activeHref(
    usePathname(),
    SITE_LINKS.map((l) => l.href),
  );
  return (
    <nav aria-label="Main" className={cn("items-center gap-1", className)}>
      {SITE_LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={current === l.href ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150",
            current === l.href ? "text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

/** Slide-out menu for the public site on small screens. */
export function SiteMobileNav({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const current = activeHref(
    usePathname(),
    SITE_LINKS.map((l) => l.href),
  );
  const close = () => setOpen(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden">
        <Menu className="size-5" />
        <span className="sr-only">Open menu</span>
      </SheetTrigger>
      <SheetContent side="right" className="bg-card">
        <SheetTitle className="flex h-16 items-center gap-2.5 border-b px-5 text-sm font-semibold">
          <BrandMark className="size-7" /> Villanova Tech Crew
        </SheetTitle>
        <nav aria-label="Main" className="flex flex-col gap-1 p-3">
          {[{ href: "/", label: "Home" }, ...SITE_LINKS].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={close}
              aria-current={current === l.href || (l.href === "/" && !current) ? "page" : undefined}
              className="rounded-md px-3 py-2.5 text-[15px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground aria-[current=page]:bg-accent aria-[current=page]:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-2 border-t p-4">
          <Button asChild className="w-full" size="lg">
            <Link href="/request" onClick={close}>
              Request a quote
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full" size="lg">
            <Link href={signedIn ? "/dashboard" : "/login"} onClick={close}>
              {signedIn ? "Crew dashboard" : "Staff login"}
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
