import { Alert } from "@/components/ui/alert";

const MESSAGES: Record<string, string> = {
  confirm: "Request approved.",
  open: "Event opened for signup.",
  close: "Signup closed.",
  deny: "Request denied and the client was emailed.",
  cancel: "Event cancelled and the client was emailed.",
  restore: "Event restored to new requests.",
  mark_paid: "Marked as paid.",
  revert_to_billed: "Reverted to billed.",
  archive: "Event archived.",
  quote: "Quote emailed to the client.",
  illegal: "That action is not allowed from the event's current status.",
  invalid: "Something was missing or invalid. Please try again.",
  nolines: "Add at least one package or custom line before sending a quote.",
  saved: "Saved.",
  billed: "Invoice emailed to the client and the event marked billed.",
};

export function Flash({ code }: { code?: string }) {
  if (!code || !MESSAGES[code]) return null;
  const bad = ["illegal", "invalid", "nolines"].includes(code);
  return <Alert variant={bad ? "warning" : "success"}>{MESSAGES[code]}</Alert>;
}
