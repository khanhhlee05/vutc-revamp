import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "./form";

export const metadata: Metadata = { title: "Set Password" };

export default async function ResetPasswordPage(props: {
  searchParams: Promise<{ token?: string; error?: string; invite?: string }>;
}) {
  const { token, error, invite } = await props.searchParams;
  if (error || !token) {
    return (
      <div className="max-w-sm mx-auto space-y-3">
        <h1 className="text-2xl font-bold">Link expired</h1>
        <p className="text-sm text-foreground/80">
          This link is invalid or has expired.{" "}
          <Link href="/forgot-password" className="underline">
            Request a new one
          </Link>
          .
        </p>
      </div>
    );
  }
  return (
    <div className="max-w-sm mx-auto space-y-4">
      <h1 className="text-2xl font-bold">{invite ? "Welcome to VUTC" : "Choose a new password"}</h1>
      <p className="text-sm text-foreground/80">At least 12 characters. A passphrase of a few words works well.</p>
      <ResetPasswordForm token={token} />
    </div>
  );
}
