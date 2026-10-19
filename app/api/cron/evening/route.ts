import { isAuthorizedCron } from "@/lib/cron/auth";
import { autoOpenEvents, sendStaffDigest } from "@/lib/cron/jobs";

/** Runs once each evening: auto-open scheduled events, then email the digest. */
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) return new Response("Unauthorized", { status: 401 });
  const opened = await autoOpenEvents();
  const digest = await sendStaffDigest();
  return Response.json({ opened: opened.map((e) => e.id), digest });
}
