import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Not authorized</h1>
      <p>You do not have permission to view that page.</p>
      <Link href="/dashboard" className="underline">
        Back to dashboard
      </Link>
    </div>
  );
}
