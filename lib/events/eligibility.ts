import type { StaffRole, UserRole } from "@/db/schema";

/** Roles a staff member can self-assign on the signup page. */
export const SIGNUP_ROLES: StaffRole[] = [
  "event_staff",
  "senior_staff",
  "aht",
  "lht",
  "vht",
  "dj",
  "spot",
  "camera",
  "runner",
];

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  event_staff: "Event Staff",
  senior_staff: "Senior Staff",
  aht: "Audio Head Tech",
  lht: "Lighting Head Tech",
  vht: "Video Head Tech",
  dj: "DJ",
  spot: "Spotlight Op",
  camera: "Camera Op",
  runner: "Runner",
  rental_pickup: "Rental Pickup",
  rental_dropoff: "Rental Dropoff",
};

/** Hours a staff member must wait between self signups in the same tier. */
export const SIGNUP_COOLDOWN_HOURS = 3;
/** Hours an event must have been open before a second senior role is allowed. */
export const OPEN_DELAY_HOURS = 3;
/** Hours before load-in after which staff cannot drop through the site. */
export const DROP_LOCK_HOURS = 24;

export type SignupViewer = {
  userId: string;
  roles: UserRole[];
  isActive: boolean;
  isApproved: boolean;
};

export type SignupEvent = {
  id: number;
  status: string;
  preOpen: boolean;
  isEmergency: boolean;
  openedAt: Date | null;
  eventDate: string;
  loadInAt: Date | null;
  startAt: Date;
  crewSlots: number;
  seniorStaffSlots: number;
  ahtSlots: number;
  lhtSlots: number;
  vhtSlots: number;
  djSlots: number;
  spotSlots: number;
  cameraSlots: number;
  runnerSlots: number;
  /** Assignments already on the event, counted by role. */
  taken: Partial<Record<StaffRole, number>>;
};

export type SignupHistory = {
  /** Roles the viewer already holds on this event. */
  rolesOnEvent: StaffRole[];
  /** Most recent self signup as event staff, any event. */
  lastEventStaffSignupAt: Date | null;
  /** Most recent self signup in a senior-tier role, any event. */
  lastSeniorSignupAt: Date | null;
  /** Viewer is event staff on another event that is still open. */
  onOtherOpenEventAsStaff: boolean;
  /** Viewer holds a senior-tier role on another event that is still open. */
  onOtherOpenEventAsSenior: boolean;
  /** Viewer works another event on the same calendar date. */
  hasSameDayEvent: boolean;
};

export type SignupState = "can" | "cannot" | "signed" | "hidden";

export type SignupDecision = {
  role: StaffRole;
  state: SignupState;
  label: string;
};

const SENIOR_TIER: StaffRole[] = ["senior_staff", "spot", "camera", "runner"];
const OP_ROLES: StaffRole[] = [
  "senior_staff",
  "aht",
  "lht",
  "vht",
  "dj",
  "spot",
  "camera",
  "runner",
];

export function slotsFor(event: SignupEvent, role: StaffRole): number {
  switch (role) {
    case "event_staff":
      return event.crewSlots;
    case "senior_staff":
      return event.seniorStaffSlots;
    case "aht":
      return event.ahtSlots;
    case "lht":
      return event.lhtSlots;
    case "vht":
      return event.vhtSlots;
    case "dj":
      return event.djSlots;
    case "spot":
      return event.spotSlots;
    case "camera":
      return event.cameraSlots;
    case "runner":
      return event.runnerSlots;
    default:
      return 0;
  }
}

/**
 * Open event-staff slots. The crew count includes head tech and senior
 * positions, so those reserved slots are subtracted along with the staff
 * already signed up.
 */
export function openEventStaffSlots(event: SignupEvent): number {
  const reserved = OP_ROLES.reduce((s, r) => s + slotsFor(event, r), 0);
  return event.crewSlots - reserved - (event.taken.event_staff ?? 0);
}

/** Whether staff can see this event on the signup page at all. */
export function isSignupVisible(event: SignupEvent): boolean {
  return event.status === "open" || (event.status === "confirmed" && event.preOpen);
}

function formatClock(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  }).format(d);
}

function hoursAgo(now: Date, then: Date | null): number {
  if (!then) return Number.POSITIVE_INFINITY;
  return (now.getTime() - then.getTime()) / 3_600_000;
}

function later(a: Date | null, b: Date | null): Date | null {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

/**
 * Pure port of the legacy canSignUp() rules. Returns one decision per
 * signup role for the viewer on the given event.
 */
export function evaluateSignup(input: {
  viewer: SignupViewer;
  event: SignupEvent;
  history: SignupHistory;
  now?: Date;
}): SignupDecision[] {
  const { viewer, event, history } = input;
  const now = input.now ?? new Date();
  const has = (r: UserRole) => viewer.roles.includes(r) || viewer.roles.includes("exec");
  const isOpen = event.status === "open";
  const visible = isSignupVisible(event);
  const cutoff = event.loadInAt ?? event.startAt;
  const tooLate = now.getTime() >= cutoff.getTime();
  const onEvent = history.rolesOnEvent.length > 0;
  const eligibleAccount = viewer.isActive && viewer.isApproved;

  const staffCooldownUntil =
    history.lastEventStaffSignupAt
      ? new Date(history.lastEventStaffSignupAt.getTime() + SIGNUP_COOLDOWN_HOURS * 3_600_000)
      : null;
  const staffCooldownOk =
    event.isEmergency || hoursAgo(now, history.lastEventStaffSignupAt) >= SIGNUP_COOLDOWN_HOURS;

  const seniorCooldownOk = hoursAgo(now, history.lastSeniorSignupAt) >= SIGNUP_COOLDOWN_HOURS;
  const openDelayEnded = hoursAgo(now, event.openedAt) >= OPEN_DELAY_HOURS;
  const openDelayUntil = event.openedAt
    ? new Date(event.openedAt.getTime() + OPEN_DELAY_HOURS * 3_600_000)
    : null;
  const seniorWaitUntil = later(
    history.lastSeniorSignupAt
      ? new Date(history.lastSeniorSignupAt.getTime() + SIGNUP_COOLDOWN_HOURS * 3_600_000)
      : null,
    openDelayUntil,
  );

  return SIGNUP_ROLES.map((role): SignupDecision => {
    const label = STAFF_ROLE_LABELS[role];
    if (history.rolesOnEvent.includes(role)) {
      return { role, state: "signed", label: `Signed up: ${label}` };
    }
    if (!visible) return { role, state: "hidden", label: "" };

    const slotsOpen =
      role === "event_staff"
        ? openEventStaffSlots(event)
        : slotsFor(event, role) - (event.taken[role] ?? 0);

    if (role === "event_staff") {
      if (!eligibleAccount) {
        return { role, state: "cannot", label: "Account not yet eligible to sign up" };
      }
      if (onEvent) return { role, state: "hidden", label: "" };
      if (!isOpen) {
        return { role, state: "cannot", label: "Open for head tech and senior positions only" };
      }
      if (tooLate) return { role, state: "cannot", label: "Signup closed" };
      if (slotsOpen < 1) return { role, state: "cannot", label: "No spots left" };
      if (history.hasSameDayEvent) {
        return { role, state: "cannot", label: "You already work an event that day" };
      }
      if (!staffCooldownOk && staffCooldownUntil) {
        return {
          role,
          state: "cannot",
          label: `Sign up at ${formatClock(staffCooldownUntil)}`,
        };
      }
      return { role, state: "can", label: `Sign up: ${label}` };
    }

    // Everything below needs a permission role on the account.
    const permitted =
      (role === "aht" && has("aht")) ||
      (role === "lht" && has("lht")) ||
      (role === "vht" && has("vht")) ||
      (role === "dj" && has("dj")) ||
      (SENIOR_TIER.includes(role) && has("senior"));
    if (!permitted || !eligibleAccount) return { role, state: "hidden", label: "" };
    if (slotsFor(event, role) === 0) return { role, state: "hidden", label: "" };
    if (tooLate || slotsOpen < 1 || onEvent) return { role, state: "hidden", label: "" };

    if (SENIOR_TIER.includes(role)) {
      const ok =
        !history.onOtherOpenEventAsSenior ||
        (seniorCooldownOk && openDelayEnded) ||
        event.isEmergency;
      if (!ok) {
        return {
          role,
          state: "cannot",
          label: seniorWaitUntil
            ? `Sign up at ${formatClock(seniorWaitUntil)}`
            : "Wait before taking another senior position",
        };
      }
    }
    return { role, state: "can", label: `Sign up: ${label}` };
  });
}

/** Whether a staff member may drop a role on the site right now. */
export function canDrop(event: Pick<SignupEvent, "loadInAt" | "startAt" | "status">, now = new Date()) {
  if (event.status !== "open" && event.status !== "confirmed") return false;
  const cutoff = event.loadInAt ?? event.startAt;
  return cutoff.getTime() - now.getTime() > DROP_LOCK_HOURS * 3_600_000;
}
