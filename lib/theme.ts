export type Theme = "light" | "dark";

/** localStorage key. public/theme-init.js reads the same key before first paint. */
export const THEME_STORAGE_KEY = "vutc-theme";

/** What the server renders and what first-time visitors see. */
export const DEFAULT_THEME: Theme = "dark";
