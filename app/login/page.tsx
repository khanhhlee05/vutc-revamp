import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Staff Login" };

export default async function LoginPage(props: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  const { reset } = await props.searchParams;
  return (
    <div className="max-w-sm mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Staff Login</h1>
      {reset ? (
        <p className="rounded border border-green-300 bg-green-50 p-3 text-sm">
          Password saved. Sign in to continue.
        </p>
      ) : null}
      <LoginForm />
    </div>
  );
}
