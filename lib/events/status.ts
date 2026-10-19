import type { EventStatus } from "@/db/schema";

export const STATUS_LABELS: Record<EventStatus, string> = {
  requested: "New Request",
  confirmed: "Confirmed",
  open: "Open for Signup",
  completed: "Completed",
  payroll_created: "Payroll Created",
  billed: "Billed",
  paid: "Paid",
  cancelled: "Cancelled",
  archived: "Archived",
};

export const STATUS_ORDER: EventStatus[] = [
  "requested",
  "confirmed",
  "open",
  "completed",
  "payroll_created",
  "billed",
  "paid",
  "cancelled",
  "archived",
];

/** Statuses that count as a live, scheduled event. */
export const ACTIVE_STATUSES: EventStatus[] = ["confirmed", "open"];

/** Statuses after the event happened and was not cancelled. */
export const PAST_STATUSES: EventStatus[] = [
  "completed",
  "payroll_created",
  "billed",
  "paid",
];

/** Message shown to the client on the brief page. */
export function clientStatusMessage(
  status: EventStatus,
  flags: { isPlanning: boolean; isConfirmed: boolean },
): string {
  switch (status) {
    case "requested":
      return flags.isPlanning
        ? "Your event has been submitted and is being reviewed by a VUTC events team member."
        : "Your event has been submitted and is awaiting review by a VUTC events team member. You should hear from our event management team within the coming days. If your event is urgent or nobody has reached out, contact events@vutc.com.";
    case "confirmed":
    case "open":
      return flags.isConfirmed
        ? "Your event is confirmed and VUTC's services are scheduled. Contact us immediately if you need to cancel."
        : "Your event has been accepted and VUTC's services are scheduled. Please confirm your event below once you have accepted the price quote.";
    case "completed":
    case "payroll_created":
      return "Your event is complete. An invoice will be emailed within three weeks. Payment is due 30 days after the invoice is sent.";
    case "billed":
      return "An invoice has been sent for your event. Payment is due 30 days after the invoice was sent.";
    case "paid":
      return "Your invoice has been paid. Thank you for working with VUTC. We look forward to working with you again.";
    case "cancelled":
      return "This event has been cancelled.";
    case "archived":
      return "This event has been archived.";
  }
}
