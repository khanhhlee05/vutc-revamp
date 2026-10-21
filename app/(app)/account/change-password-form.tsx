"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";

export function ChangePasswordForm() {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const next = String(data.get("newPassword") ?? "");
    if (next !== String(data.get("confirm") ?? "")) {
      setMsg({ ok: false, text: "New passwords do not match." });
      return;
    }
    setPending(true);
    const { error } = await authClient.changePassword({
      currentPassword: String(data.get("currentPassword") ?? ""),
      newPassword: next,
      revokeOtherSessions: true,
    });
    setPending(false);
    if (error) {
      setMsg({ ok: false, text: error.message ?? "Could not change password." });
      return;
    }
    form.reset();
    setMsg({ ok: true, text: "Password changed. Other devices were signed out." });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-sm">
      <label className="block text-sm">
        <span className="block mb-1 font-medium">Current password</span>
        <input name="currentPassword" type="password" required autoComplete="current-password" className="w-full border rounded px-3 py-2" />
      </label>
      <label className="block text-sm">
        <span className="block mb-1 font-medium">New password</span>
        <input name="newPassword" type="password" required minLength={12} maxLength={128} autoComplete="new-password" className="w-full border rounded px-3 py-2" />
      </label>
      <label className="block text-sm">
        <span className="block mb-1 font-medium">Confirm new password</span>
        <input name="confirm" type="password" required minLength={12} maxLength={128} autoComplete="new-password" className="w-full border rounded px-3 py-2" />
      </label>
      {msg ? <p className={`text-sm ${msg.ok ? "text-success" : "text-destructive"}`}>{msg.text}</p> : null}
      <button type="submit" disabled={pending} className="bg-brand text-white px-4 py-2 rounded text-sm disabled:opacity-50">
        {pending ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}
