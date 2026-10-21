import Link from "next/link";
import { BrandMark } from "@/components/shell/brand";

const COLUMNS = [
  {
    title: "Clients",
    links: [
      { href: "/request", label: "Request a quote" },
      { href: "/policies", label: "Client policies" },
      { href: "/faqs", label: "FAQs" },
      { href: "/calendar", label: "Event calendar" },
    ],
  },
  {
    title: "Crew",
    links: [
      { href: "/about", label: "About the crew" },
      { href: "/login", label: "Staff login" },
    ],
  },
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 font-semibold">
            <BrandMark /> Villanova University Tech Crew
          </div>
          <p className="max-w-xs text-sm text-muted-foreground">
            Student-run audio, lighting, and video production for Villanova campus events.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title} className="space-y-3">
            <h2 className="text-sm font-semibold">{col.title}</h2>
            <ul className="space-y-2 text-sm">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-muted-foreground transition-colors hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Contact</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <span className="block text-xs text-muted-foreground">Events</span>
              <a href="mailto:events@vutc.com" className="transition-colors hover:text-primary">
                events@vutc.com
              </a>
            </li>
            <li>
              <span className="block text-xs text-muted-foreground">Joining the crew</span>
              <a href="mailto:contact@vutc.com" className="transition-colors hover:text-primary">
                contact@vutc.com
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted-foreground sm:px-6">
          &copy; 2003&ndash;{year} Villanova University Tech Crew
        </p>
      </div>
    </footer>
  );
}
