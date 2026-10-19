"use client";

import { useActionState } from "react";
import { EVENT_NEEDS, LOCATION_SUGGESTIONS } from "@/lib/events/constants";
import { updateEventDetails, type EventFormState } from "@/lib/events/manage-actions";

const input = "w-full border rounded px-3 py-1.5 text-sm";

type Values = {
  eventId: number;
  name: string;
  orgName: string;
  organizationId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  advisorName: string;
  advisorEmail: string;
  accountIndex: string;
  isStudentOrg: boolean;
  location: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  soundcheckTime: string;
  loadInDate: string;
  loadInTime: string;
  reservationStart: string;
  reservationEnd: string;
  expectedAttendance: string;
  needs: string[];
  description: string;
  notes: string;
  htNotes: string;
  planningNotes: string;
  quoteSentNote: string;
  crewSlots: number;
  seniorStaffSlots: number;
  ahtSlots: number;
  lhtSlots: number;
  vhtSlots: number;
  djSlots: number;
  spotSlots: number;
  cameraSlots: number;
  runnerSlots: number;
  discount: string;
  rentalPrice: string;
  rentalDescription: string;
  openOn: string;
  autoOpen: boolean;
  notifyStaff: boolean;
};

function F({ label, error, children }: { label: string; name: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="text-sm block">
      <span className="block mb-0.5 font-medium">{label}</span>
      {children}
      {error ? <span className="block text-xs text-red-700">{error}</span> : null}
    </label>
  );
}

export function EventEditForm({ initial, organizations }: { initial: Values; organizations: { id: number; name: string; alertFlag: boolean }[] }) {
  const [state, action, pending] = useActionState<EventFormState, FormData>(updateEventDetails, {});
  const e = state.errors ?? {};
  const slots: [keyof Values, string][] = [
    ["crewSlots", "Total crew"],
    ["seniorStaffSlots", "Senior staff"],
    ["ahtSlots", "Audio HT"],
    ["lhtSlots", "Lighting HT"],
    ["vhtSlots", "Video HT"],
    ["djSlots", "DJ"],
    ["spotSlots", "Spot ops"],
    ["cameraSlots", "Camera ops"],
    ["runnerSlots", "Runners"],
  ];
  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="eventId" value={initial.eventId} />
      {state.saved ? <p role="status" className="rounded border border-green-300 bg-green-50 p-3 text-sm">Saved.</p> : null}
      {state.formError ? <p className="rounded border border-red-300 bg-red-50 p-3 text-sm">{state.formError}</p> : null}
      {Object.keys(e).length ? <p className="rounded border border-red-300 bg-red-50 p-3 text-sm">Fix the highlighted fields.</p> : null}

      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="text-lg font-semibold mb-2">Client</legend>
        <F label="Event name" name="name" error={e.name}><input name="name" required defaultValue={initial.name} className={input} /></F>
        <F label="Organization name" name="orgName" error={e.orgName}><input name="orgName" required defaultValue={initial.orgName} className={input} /></F>
        <F label="Organization profile" name="organizationId" error={e.organizationId}>
          <select name="organizationId" defaultValue={initial.organizationId} className={input}>
            <option value="">Not linked</option>
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}{o.alertFlag ? " (alert)" : ""}
              </option>
            ))}
          </select>
        </F>
        <F label="Account index" name="accountIndex" error={e.accountIndex}><input name="accountIndex" defaultValue={initial.accountIndex} className={input} /></F>
        <F label="Contact name" name="contactName" error={e.contactName}><input name="contactName" required defaultValue={initial.contactName} className={input} /></F>
        <F label="Contact email" name="contactEmail" error={e.contactEmail}><input name="contactEmail" type="email" required defaultValue={initial.contactEmail} className={input} /></F>
        <F label="Contact phone" name="contactPhone" error={e.contactPhone}><input name="contactPhone" required defaultValue={initial.contactPhone} className={input} /></F>
        <label className="flex items-center gap-2 text-sm mt-5">
          <input type="checkbox" name="isStudentOrg" defaultChecked={initial.isStudentOrg} /> Student organization
        </label>
        <F label="Advisor name" name="advisorName" error={e.advisorName}><input name="advisorName" defaultValue={initial.advisorName} className={input} /></F>
        <F label="Advisor email" name="advisorEmail" error={e.advisorEmail}><input name="advisorEmail" type="email" defaultValue={initial.advisorEmail} className={input} /></F>
      </fieldset>

      <fieldset className="grid gap-4 md:grid-cols-3">
        <legend className="text-lg font-semibold mb-2">Schedule</legend>
        <F label="Event date" name="eventDate" error={e.eventDate}><input name="eventDate" type="date" required defaultValue={initial.eventDate} className={input} /></F>
        <F label="Start" name="startTime" error={e.startTime}><input name="startTime" type="time" required defaultValue={initial.startTime} className={input} /></F>
        <F label="End" name="endTime" error={e.endTime}><input name="endTime" type="time" required defaultValue={initial.endTime} className={input} /></F>
        <F label="Load-in date" name="loadInDate" error={e.loadInDate}><input name="loadInDate" type="date" defaultValue={initial.loadInDate} className={input} /></F>
        <F label="Load-in time" name="loadInTime" error={e.loadInTime}><input name="loadInTime" type="time" defaultValue={initial.loadInTime} className={input} /></F>
        <F label="Sound check" name="soundcheckTime" error={e.soundcheckTime}><input name="soundcheckTime" type="time" defaultValue={initial.soundcheckTime} className={input} /></F>
        <F label="Reservation start" name="reservationStart" error={e.reservationStart}><input name="reservationStart" type="time" defaultValue={initial.reservationStart} className={input} /></F>
        <F label="Reservation end" name="reservationEnd" error={e.reservationEnd}><input name="reservationEnd" type="time" defaultValue={initial.reservationEnd} className={input} /></F>
        <F label="Location" name="location" error={e.location}>
          <input name="location" required list="locations" defaultValue={initial.location} className={input} />
          <datalist id="locations">{LOCATION_SUGGESTIONS.map((l) => <option key={l} value={l} />)}</datalist>
        </F>
        <F label="Expected attendance" name="expectedAttendance" error={e.expectedAttendance}><input name="expectedAttendance" defaultValue={initial.expectedAttendance} className={input} /></F>
        <F label="Auto-open date" name="openOn" error={e.openOn}><input name="openOn" type="date" defaultValue={initial.openOn} className={input} /></F>
        <div className="space-y-1 mt-5 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" name="autoOpen" defaultChecked={initial.autoOpen} /> Auto-open at 8 PM on that date</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="notifyStaff" defaultChecked={initial.notifyStaff} /> Include in staff digest</label>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-lg font-semibold mb-2">Staffing slots</legend>
        <p className="text-xs text-gray-600">Total crew includes head tech and senior positions. Op slots are raised to 1 automatically when matching packages are added.</p>
        <div className="grid gap-3 grid-cols-3 md:grid-cols-5">
          {slots.map(([k, label]) => (
            <F key={k} label={label} name={k} error={e[k]}>
              <input name={k} type="number" min={0} max={50} defaultValue={String(initial[k])} className={input} />
            </F>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-4 md:grid-cols-3">
        <legend className="text-lg font-semibold mb-2">Money</legend>
        <F label="Discount ($)" name="discount" error={e.discount}><input name="discount" type="number" step="0.01" min={0} defaultValue={initial.discount} className={input} /></F>
        <F label="Rental price ($)" name="rentalPrice" error={e.rentalPrice}><input name="rentalPrice" type="number" step="0.01" min={0} defaultValue={initial.rentalPrice} className={input} /></F>
        <F label="Quote note" name="quoteSentNote" error={e.quoteSentNote}><input name="quoteSentNote" defaultValue={initial.quoteSentNote} className={input} /></F>
        <div className="md:col-span-3">
          <F label="Rental description" name="rentalDescription" error={e.rentalDescription}><textarea name="rentalDescription" rows={2} defaultValue={initial.rentalDescription} className={input} /></F>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-lg font-semibold mb-2">Needs and notes</legend>
        <div className="grid gap-1.5 sm:grid-cols-2 md:grid-cols-3 text-sm">
          {EVENT_NEEDS.map((n) => (
            <label key={n} className="flex items-center gap-2"><input type="checkbox" name="needs" value={n} defaultChecked={initial.needs.includes(n)} /> {n}</label>
          ))}
        </div>
        <F label="Client description" name="description" error={e.description}><textarea name="description" rows={4} defaultValue={initial.description} className={input} /></F>
        <F label="Staff notes (visible to all staff)" name="notes" error={e.notes}><textarea name="notes" rows={3} defaultValue={initial.notes} className={input} /></F>
        <F label="Head tech notes" name="htNotes" error={e.htNotes}><textarea name="htNotes" rows={3} defaultValue={initial.htNotes} className={input} /></F>
        <F label="Planning notes (management only)" name="planningNotes" error={e.planningNotes}><textarea name="planningNotes" rows={3} defaultValue={initial.planningNotes} className={input} /></F>
      </fieldset>

      <button type="submit" disabled={pending} className="bg-brand text-white px-5 py-2 rounded text-sm disabled:opacity-50">
        {pending ? "Saving…" : "Save event"}
      </button>
    </form>
  );
}
