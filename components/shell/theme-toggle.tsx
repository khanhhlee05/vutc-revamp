"use client";

import { Moon, Sun } from "lucide-react";
import { THEME_STORAGE_KEY, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

function setTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private mode or blocked storage: the choice just lasts for this page.
  }
}

/**
 * Sun/moon button. The icon comes from CSS (the dark: variant), so the server
 * and the browser render the same markup and nothing re-renders on load.
 */
export function ThemeToggle({
  className,
  withLabel = false,
  onClick,
  ...props
}: React.ComponentProps<"button"> & { withLabel?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      onClick={(e) => {
        onClick?.(e);
        setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
      }}
      className={cn(
        "inline-flex items-center gap-2 rounded-md p-2 text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground",
        className,
      )}
    >
      <Sun className="hidden size-4 dark:block" aria-hidden />
      <Moon className="size-4 dark:hidden" aria-hidden />
      {withLabel ? (
        <>
          <span className="hidden dark:inline">Light mode</span>
          <span className="dark:hidden">Dark mode</span>
        </>
      ) : (
        <span className="sr-only">Switch between light and dark mode</span>
      )}
    </button>
  );
}
