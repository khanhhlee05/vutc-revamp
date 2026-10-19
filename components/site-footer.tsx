export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-muted text-sm text-gray-600">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-wrap gap-4 justify-between">
        <span>&copy; 2003-{year} Villanova University Tech Crew</span>
        <a href="mailto:events@vutc.com" className="hover:underline">
          events@vutc.com
        </a>
      </div>
    </footer>
  );
}
