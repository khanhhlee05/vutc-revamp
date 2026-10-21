// Loaded as a blocking script in <head> (app/layout.tsx) so a visitor who chose
// light mode never sees a dark flash. Keep the key in sync with lib/theme.ts.
(function () {
  try {
    var t = localStorage.getItem("vutc-theme");
    if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
  } catch {
    // Storage blocked: keep the default theme.
  }
})();
