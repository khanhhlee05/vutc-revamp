"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password !== String(form.get("confirm") ?? "")) {
      setError("Passwords do not match.");
      return;
    }
    setPending(true);
    setError(null);
    const { error } = await authClient.resetPassword({ newPassword: password, token });
    setPending(false);
    if (error) {
      setError(error.message ?? "Could not set password. The link may have expired.");
      return;
    }
    router.push("/login?reset=1");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-sm">
        <span className="block mb-1 font-medium">New password</span>
        <input name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" className="w-full border rounded px-3 py-2" />
      </label>
      <label className="block text-sm">
        <span className="block mb-1 font-medium">Confirm password</span>
        <input name="confirm" type="password" required minLength={12} maxLength={128} autoComplete="new-password" className="w-full border rounded px-3 py-2" />
      </label>
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
      <button type="submit" disabled={pending} className="w-full bg-brand text-white rounded py-2 disabled:opacity-50">
        {pending ? "Saving…" : "Set password"}
      </button>
    </form>
  );
}
