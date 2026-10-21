import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";

export function Breadcrumbs({ items, className }: { items: { label: React.ReactNode; href?: string }[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1.5">
              {item.href && !last ? (
                <Link href={item.href} className="transition-colors hover:text-foreground">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={last ? "text-foreground" : undefined}>
                  {item.label}
                </span>
              )}
              {!last ? <ChevronRight className="size-3.5" aria-hidden /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Previous / next pagination driven by the URL. `hrefFor` builds the link for a
 * page number so the caller keeps its other search params.
 */
export function Pagination({
  page,
  pageCount,
  hrefFor,
  className,
}: {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
  className?: string;
}) {
  if (pageCount <= 1) return null;
  const prev = page > 1;
  const next = page < pageCount;
  const btn = buttonVariants({ variant: "outline", size: "sm" });
  return (
    <nav aria-label="Pagination" className={cn("flex items-center justify-between gap-2", className)}>
      <p className="text-sm text-muted-foreground">
        Page {page} of {pageCount}
      </p>
      <div className="flex gap-2">
        {prev ? (
          <Link href={hrefFor(page - 1)} className={btn}>
            <ChevronLeft /> Previous
          </Link>
        ) : (
          <span className={cn(btn, "pointer-events-none opacity-50")} aria-disabled>
            <ChevronLeft /> Previous
          </span>
        )}
        {next ? (
          <Link href={hrefFor(page + 1)} className={btn}>
            Next <ChevronRight />
          </Link>
        ) : (
          <span className={cn(btn, "pointer-events-none opacity-50")} aria-disabled>
            Next <ChevronRight />
          </span>
        )}
      </div>
    </nav>
  );
}
