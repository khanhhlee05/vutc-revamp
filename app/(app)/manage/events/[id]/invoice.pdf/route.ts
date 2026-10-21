import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { hasAnyRole } from "@/lib/auth/roles";
import { buildInvoiceData, getInvoiceEvent } from "@/lib/pay/invoice";
import { renderQuotePdf } from "@/lib/pdf/quote";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !hasAnyRole(user.roles, ["bus_mgmt", "event_mgmt"])) {
    return new Response("Forbidden", { status: 403 });
  }
  const { id } = await ctx.params;
  const event = await getInvoiceEvent(Number(id));
  if (!event) notFound();
  const pdf = await renderQuotePdf(buildInvoiceData(event));
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="VUTC Invoice ${event.id}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
