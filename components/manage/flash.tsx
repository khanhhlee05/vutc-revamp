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
};

export function Flash({ code }: { code?: string }) {
  if (!code || !MESSAGES[code]) return null;
  const bad = ["illegal", "invalid", "nolines"].includes(code);
  return (
    <p role="status" className={`rounded border p-3 text-sm ${bad ? "border-amber-300 bg-amber-50" : "border-green-300 bg-green-50"}`}>
      {MESSAGES[code]}
    </p>
  );
}
