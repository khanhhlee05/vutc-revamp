"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";

export function ForgotPasswordForm() {
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const email = String(new FormData(e.currentTarget).get("email") ?? "");
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setPending(false);
    if (error && error.status === 429) {
      setError("Too many requests. Try again later.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return <p className="text-sm">Check your email for the reset link.</p>;
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-sm">
        <span className="block mb-1 font-medium">Email</span>
        <input name="email" type="email" required autoComplete="username" className="w-full border rounded px-3 py-2" />
      </label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <button type="submit" disabled={pending} className="w-full bg-brand text-white rounded py-2 disabled:opacity-50">
        {pending ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
