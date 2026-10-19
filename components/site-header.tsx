import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/session";
import { SignOutButton } from "./sign-out-button";

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/request", label: "Request a Quote" },
  { href: "/calendar", label: "Calendar" },
  { href: "/about", label: "About" },
  { href: "/faqs", label: "FAQs" },
  { href: "/policies", label: "Policies" },
];

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="bg-brand text-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
        <Link href="/" className="font-semibold text-lg tracking-tight">
          Villanova University Tech Crew
        </Link>
        <nav className="flex flex-wrap gap-4 text-sm">
          {publicLinks.map((l) => (
            <Link key={l.href} href={l.href} className="hover:underline">
              {l.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link href="/dashboard" className="hover:underline">
                Dashboard
              </Link>
              <Link href="/events" className="hover:underline">
                Sign Up
              </Link>
              {can(user, "event_mgmt") && (
                <Link href="/manage/events" className="hover:underline">
                  Manage
                </Link>
              )}
            </>
          ) : null}
        </nav>
        <div className="ml-auto text-sm flex items-center gap-3">
          {user ? (
            <>
              <span className="opacity-90">{user.name}</span>
              <SignOutButton />
            </>
          ) : (
            <Link href="/login" className="hover:underline">
              Staff Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
