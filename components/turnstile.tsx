"use client";

import Script from "next/script";

/**
 * Cloudflare Turnstile widget. Renders nothing when the site key is not
 * configured, and the server skips verification in that case too.
 */
export function Turnstile() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) return null;
  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
      />
      <div className="cf-turnstile" data-sitekey={siteKey} />
    </>
  );
}
