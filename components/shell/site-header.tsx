import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { BrandMark } from "./brand";
import { SiteMobileNav, SiteNavLinks } from "./site-nav";
import { ThemeToggle } from "./theme-toggle";

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-40 border-b bg-card/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <BrandMark />
          <span className="font-semibold tracking-tight">
            Villanova <span className="hidden sm:inline">University </span>Tech Crew
          </span>
        </Link>
        <SiteNavLinks className="hidden md:flex" />
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
            <Link href={user ? "/dashboard" : "/login"}>{user ? "Dashboard" : "Staff login"}</Link>
          </Button>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/request">Request a quote</Link>
          </Button>
          <SiteMobileNav signedIn={Boolean(user)} />
        </div>
      </div>
    </header>
  );
}
