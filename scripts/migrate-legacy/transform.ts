import { randomBytes } from "node:crypto";
import type { EventStatus, NewEvent } from "@/db/schema";
import { zonedToUtc } from "@/lib/time";
import type { Row } from "./parse-dump";

export const STATUS_MAP: Record<string, EventStatus> = {
  "0": "requested",
  "1": "requested",
  "2": "confirmed",
  "3": "open",
  "4": "completed",
  "5": "payroll_created",
  "6": "billed",
  "7": "paid",
  "8": "cancelled",
  "9": "archived",
};

const ZERO_DATE = /^0000-00-00/;

export function cleanDate(v: string | null): string | null {
  if (!v || ZERO_DATE.test(v) || !/^\d{4}-\d{2}-\d{2}/.test(v)) return null;
  return v.slice(0, 10);
}

export function cleanTime(v: string | null): string | null {
  if (!v || v === "00:00:00" || !/^\d{2}:\d{2}/.test(v)) return null;
  return v.slice(0, 5);
}

function cleanDateTime(v: string | null): Date | null {
  if (!v || ZERO_DATE.test(v)) return null;
  const d = cleanDate(v);
  const t = v.length >= 16 ? v.slice(11, 16) : "00:00";
  return d ? zonedToUtc(d, t) : null;
}

function money(v: string | null): string {
  const n = Number(v ?? 0);
  return (Number.isFinite(n) ? n : 0).toFixed(2);
}

function int(v: string | null): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function bool(v: string | null): boolean {
  return v === "1";
}

/** "A<br/>B<br/>" into ["A", "B"]; "N/A" into []. */
export function splitNeeds(v: string | null): string[] {
  if (!v) return [];
  return v
    .split(/<br\s*\/?>/i)
    .map((s) => s.replace(/<[^>]+>/g, "").trim())
    .filter((s) => s && s.toUpperCase() !== "N/A");
}

function addDaysStr(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function transformOrganization(r: Row) {
  return {
    legacyId: int(r.id),
    name: (r.name ?? "").trim() || `Client ${r.id}`,
    description: r.description ?? "",
    alertFlag: int(r.alert) !== 0,
    alertDate: cleanDate(r.alertDate),
    createdAt: cleanDate(r.dateCreated) ? zonedToUtc(cleanDate(r.dateCreated)!, "12:00") : new Date(),
  };
}

export function transformEvent(r: Row, orgIdByLegacy: Map<number, number>): NewEvent {
  const eventDate = cleanDate(r.date) ?? "1970-01-01";
  const startTime = cleanTime(r.timeS) ?? "00:00";
  let endTime = cleanTime(r.timeF) ?? startTime;
  let endDate = eventDate;
  if (endTime < startTime) endDate = addDaysStr(eventDate, 1); // overnight event
  if (endTime === startTime && !cleanTime(r.timeF)) endTime = startTime;
  const loadDate = cleanDate(r.dateL) ?? (cleanTime(r.timeL) ? eventDate : null);
  const loadTime = cleanTime(r.timeL);
  const clientLegacy = int(r.clientID);
  const submitted = cleanDateTime(r.submitDate) ?? zonedToUtc(eventDate, "09:00");

  return {
    legacyId: int(r.id),
    publicToken: randomBytes(32).toString("base64url"),
    status: STATUS_MAP[r.status ?? "1"] ?? "requested",
    organizationId: clientLegacy ? (orgIdByLegacy.get(clientLegacy) ?? null) : null,
    name: (r.eventName ?? "").trim() || `Event ${r.id}`,
    orgName: (r.org ?? "").trim(),
    contactName: (r.name ?? "").trim(),
    contactEmail: (r.email ?? "").trim().toLowerCase(),
    contactPhone: (r.phone ?? "").trim(),
    advisorName: (r.advisorName ?? "").trim(),
    advisorEmail: (r.advisorEmail ?? "").trim().toLowerCase(),
    accountIndex: r.acctIndex && r.acctIndex !== "0" ? r.acctIndex.trim() : "",
    isStudentOrg: bool(r.studentOrg),
    location: (r.location ?? "").trim(),
    eventDate,
    startAt: zonedToUtc(eventDate, startTime),
    endAt: zonedToUtc(endDate, endTime),
    loadInAt: loadDate ? zonedToUtc(loadDate, loadTime ?? "00:00") : null,
    soundcheckAt: cleanTime(r.timeSC) ? zonedToUtc(eventDate, cleanTime(r.timeSC)!) : null,
    reservationStartAt: cleanTime(r.timeRS) ? zonedToUtc(eventDate, cleanTime(r.timeRS)!) : null,
    reservationEndAt: cleanTime(r.timeRF) ? zonedToUtc(eventDate, cleanTime(r.timeRF)!) : null,
    expectedAttendance: r.attendance ?? null,
    needs: splitNeeds(r.eventNeeds),
    description: (r.description ?? "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, ""),
    notes: r.notes ?? "",
    htNotes: r.notesHT ?? "",
    planningNotes: r.planningNotes ?? "",
    quoteSentNote: r.quoteSent ?? "",
    crewSlots: int(r.crew),
    seniorStaffSlots: int(r.senior),
    ahtSlots: int(r.audioHT),
    lhtSlots: int(r.lightHT),
    vhtSlots: int(r.videoHT),
    djSlots: int(r.djHT),
    spotSlots: int(r.spotOp),
    cameraSlots: int(r.cameraOp),
    runnerSlots: int(r.runnerOp),
    price: money(r.price),
    discount: money(r.discount),
    vutcShare: money(r.vutcShare),
    rentalPrice: money(r.rentalPrice),
    rentalDescription: r.rentalDescription ?? "",
    rentalsOrdered: bool(r.rentalsOrdered),
    autoOpen: bool(r.autoOpen),
    preOpen: bool(r.preOpen),
    isPlanning: bool(r.planning),
    isConfirmed: bool(r.confirmed),
    notifyStaff: r.notify == null ? true : bool(r.notify),
    isEmergency: bool(r.shtf),
    submittedAt: submitted,
    approvedAt: cleanDate(r.approvedDate) ? zonedToUtc(cleanDate(r.approvedDate)!, "12:00") : null,
    openOn: cleanDate(r.dateO),
    openedAt: cleanDateTime(r.timeOpen),
    billedAt: cleanDate(r.billDate) ? zonedToUtc(cleanDate(r.billDate)!, "12:00") : null,
    billSentAt: cleanDate(r.billSent) ? zonedToUtc(cleanDate(r.billSent)!, "12:00") : null,
    paidAt: cleanDateTime(r.paidDate),
    cancelReason: r.cancelReason ?? "",
    createdAt: submitted,
  };
}

export function transformLineItem(
  r: Row,
  eventIdByLegacy: Map<number, number>,
  packageIdByName: Map<string, number>,
  aliases: Record<string, string | null>,
) {
  const eventId = eventIdByLegacy.get(int(r.eventid));
  if (!eventId) return null;
  const rawName = (r.package ?? "").trim();
  const canonical = packageIdByName.has(rawName) ? rawName : (aliases[rawName] ?? null);
  return {
    eventId,
    packageId: canonical ? (packageIdByName.get(canonical) ?? null) : null,
    name: rawName || "Line item",
    unitPrice: money(r.price),
    quantity: (Number(r.amount ?? 1) || 0).toFixed(2),
    description: r.Description ?? r.description ?? "",
  };
}
