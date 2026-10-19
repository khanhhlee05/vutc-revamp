import { isAuthorizedCron } from "@/lib/cron/auth";
import { checkSeniorCoverage } from "@/lib/cron/jobs";

/** Runs once around midnight: warn about events short on senior staff. */
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) return new Response("Unauthorized", { status: 401 });
  const result = await checkSeniorCoverage();
  return Response.json(result);
}
