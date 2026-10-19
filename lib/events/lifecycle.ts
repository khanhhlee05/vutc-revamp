import type { EventStatus } from "@/db/schema";

export type LifecycleAction =
  | "confirm"
  | "open"
  | "close"
  | "cancel"
  | "deny"
  | "restore"
  | "complete"
  | "create_payroll"
  | "bill"
  | "revert_to_billed"
  | "mark_paid"
  | "archive";

type Transition = { from: EventStatus[]; to: EventStatus; label: string; danger?: boolean };

/** Every legal status change. Anything not listed here is rejected. */
export const TRANSITIONS: Record<LifecycleAction, Transition> = {
  confirm: { from: ["requested"], to: "confirmed", label: "Approve request" },
  open: { from: ["confirmed"], to: "open", label: "Open for signup" },
  close: { from: ["open"], to: "confirmed", label: "Close signup" },
  deny: { from: ["requested"], to: "cancelled", label: "Deny request", danger: true },
  cancel: { from: ["confirmed", "open"], to: "cancelled", label: "Cancel event", danger: true },
  restore: { from: ["cancelled"], to: "requested", label: "Restore to new request" },
  complete: { from: ["open", "confirmed"], to: "completed", label: "Submit timesheet" },
  create_payroll: { from: ["completed"], to: "payroll_created", label: "Add to payroll" },
  bill: { from: ["payroll_created", "completed"], to: "billed", label: "Send invoice" },
  revert_to_billed: { from: ["paid"], to: "billed", label: "Revert to billed" },
  mark_paid: { from: ["billed"], to: "paid", label: "Mark paid" },
  archive: { from: ["paid", "cancelled"], to: "archived", label: "Archive" },
};

/** Actions exposed as buttons on the event management page. */
const BUTTON_ACTIONS: LifecycleAction[] = [
  "confirm",
  "open",
  "close",
  "deny",
  "cancel",
  "restore",
  "revert_to_billed",
  "mark_paid",
  "archive",
];

export function nextStatus(current: EventStatus, action: LifecycleAction): EventStatus | null {
  const t = TRANSITIONS[action];
  return t && t.from.includes(current) ? t.to : null;
}

export function availableActions(current: EventStatus): LifecycleAction[] {
  return BUTTON_ACTIONS.filter((a) => TRANSITIONS[a].from.includes(current));
}

export function isLifecycleAction(value: unknown): value is LifecycleAction {
  return typeof value === "string" && value in TRANSITIONS;
}
