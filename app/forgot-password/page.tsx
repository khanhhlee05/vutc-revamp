import type { Metadata } from "next";
import { ForgotPasswordForm } from "./form";

export const metadata: Metadata = { title: "Reset Password" };

export default function ForgotPasswordPage() {
  return (
    <div className="max-w-sm mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Reset your password</h1>
      <p className="text-sm text-gray-700">
        Enter your staff email. If an account exists we will email a link that works for 24 hours.
      </p>
      <ForgotPasswordForm />
    </div>
  );
}
