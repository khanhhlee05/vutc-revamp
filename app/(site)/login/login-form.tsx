"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(e.currentTarget);
    const { error } = await authClient.signIn.email({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });
    setPending(false);
    if (error) {
      setError(
        error.status === 429
          ? "Too many attempts. Try again in a minute."
          : "Incorrect email or password.",
      );
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-sm">
        <span className="block mb-1 font-medium">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          className="w-full border rounded px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="block mb-1 font-medium">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full border rounded px-3 py-2"
        />
      </label>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-brand text-white rounded py-2 disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-sm">
        <a href="/forgot-password" className="underline">
          Forgot your password?
        </a>
      </p>
    </form>
  );
}
