"use client";

import { useActionState } from "react";
import { Turnstile } from "@/components/turnstile";
import { EVENT_NEEDS, LOCATION_SUGGESTIONS } from "@/lib/events/constants";
import {
  submitEventRequest,
  type RequestFormState,
} from "@/lib/events/request-action";

const initial: RequestFormState = {};

function Field({
  label,
  name,
  error,
  hint,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && !error ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? (
        <p id={`${name}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const inputClass = "w-full border rounded px-3 py-2 text-sm";

export function RequestForm() {
  const [state, action, pending] = useActionState(submitEventRequest, initial);
  const v = (k: string) => {
    const val = state.values?.[k];
    return typeof val === "string" ? val : "";
  };
  const needs = (state.values?.needs as string[] | undefined) ?? [];
  const err = state.errors ?? {};

  return (
    <form action={action} className="space-y-8" noValidate>
      {state.formError ? (
        <p role="alert" className="rounded border border-danger-border bg-danger-soft p-3 text-sm">
          {state.formError}
        </p>
      ) : null}

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">Contact</legend>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Organization" name="orgName" error={err.orgName}>
            <input id="orgName" name="orgName" required maxLength={80} defaultValue={v("orgName")} className={inputClass} />
          </Field>
          <Field label="Contact name" name="contactName" error={err.contactName} hint="Must be present at the event">
            <input id="contactName" name="contactName" required maxLength={50} defaultValue={v("contactName")} className={inputClass} />
          </Field>
          <Field label="Contact email" name="contactEmail" error={err.contactEmail} hint="Villanova email address">
            <input id="contactEmail" name="contactEmail" type="email" required defaultValue={v("contactEmail")} className={inputClass} />
          </Field>
          <Field label="Contact mobile phone" name="contactPhone" error={err.contactPhone} hint="No office phones; we must reach you outside business hours">
            <input id="contactPhone" name="contactPhone" type="tel" required defaultValue={v("contactPhone")} className={inputClass} />
          </Field>
          <Field label="Advisor name" name="advisorName" error={err.advisorName} hint="Billed along with the contact">
            <input id="advisorName" name="advisorName" required maxLength={50} defaultValue={v("advisorName")} className={inputClass} />
          </Field>
          <Field label="Advisor email" name="advisorEmail" error={err.advisorEmail}>
            <input id="advisorEmail" name="advisorEmail" type="email" required defaultValue={v("advisorEmail")} className={inputClass} />
          </Field>
          <Field label="Budget account index" name="accountIndex" error={err.accountIndex} hint="Villanova University budget account number">
            <input id="accountIndex" name="accountIndex" required maxLength={15} defaultValue={v("accountIndex")} className={inputClass} />
          </Field>
          <label className="flex items-center gap-2 text-sm mt-6">
            <input type="checkbox" name="isStudentOrg" defaultChecked={state.values?.isStudentOrg === "on"} />
            This is a student organization
          </label>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">Event</legend>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Event name" name="name" error={err.name}>
            <input id="name" name="name" required maxLength={80} defaultValue={v("name")} className={inputClass} />
          </Field>
          <Field label="Location" name="location" error={err.location} hint="On or off campus">
            <input id="location" name="location" required list="locations" maxLength={80} defaultValue={v("location")} className={inputClass} />
            <datalist id="locations">
              {LOCATION_SUGGESTIONS.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          </Field>
          <Field label="Event date" name="eventDate" error={err.eventDate}>
            <input id="eventDate" name="eventDate" type="date" required defaultValue={v("eventDate")} className={inputClass} />
          </Field>
          <Field label="Expected attendance" name="expectedAttendance" error={err.expectedAttendance}>
            <input id="expectedAttendance" name="expectedAttendance" required maxLength={64} defaultValue={v("expectedAttendance")} className={inputClass} />
          </Field>
          <Field label="Event start time" name="startTime" error={err.startTime}>
            <input id="startTime" name="startTime" type="time" required defaultValue={v("startTime")} className={inputClass} />
          </Field>
          <Field label="Event end time" name="endTime" error={err.endTime}>
            <input id="endTime" name="endTime" type="time" required defaultValue={v("endTime")} className={inputClass} />
          </Field>
          <Field label="Sound check time" name="soundcheckTime" error={err.soundcheckTime} hint="Optional">
            <input id="soundcheckTime" name="soundcheckTime" type="time" defaultValue={v("soundcheckTime")} className={inputClass} />
          </Field>
          <div className="hidden md:block" />
          <Field label="Venue reservation start" name="reservationStart" error={err.reservationStart} hint="When we can start loading in">
            <input id="reservationStart" name="reservationStart" type="time" required defaultValue={v("reservationStart")} className={inputClass} />
          </Field>
          <Field label="Venue reservation end" name="reservationEnd" error={err.reservationEnd} hint="When we must be out">
            <input id="reservationEnd" name="reservationEnd" type="time" required defaultValue={v("reservationEnd")} className={inputClass} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-lg font-semibold">Your event will need</legend>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {EVENT_NEEDS.map((n) => (
            <label key={n} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="needs" value={n} defaultChecked={needs.includes(n)} />
              {n}
            </label>
          ))}
        </div>
        {err.needs ? <p className="text-xs text-destructive">{err.needs}</p> : null}
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">Details</legend>
        <Field label="Event description and notes" name="description" error={err.description} hint="Schedule, performers, anything unusual. If the event is virtual, say so here.">
          <textarea id="description" name="description" required rows={6} defaultValue={v("description")} className={inputClass} />
        </Field>
        <Field label="Attachment" name="attachment" hint="Optional. PDF, Office document, image, or text, up to 10 MB.">
          <input id="attachment" name="attachment" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xlsx,.png,.jpg,.jpeg,.txt" className="text-sm" />
        </Field>
      </fieldset>

      {/* Honeypot: hidden from people, filled by bots. */}
      <div className="hidden" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <Turnstile />

      <button
        type="submit"
        disabled={pending}
        className="bg-brand text-white px-6 py-2 rounded disabled:opacity-50"
      >
        {pending ? "Submitting…" : "Submit request"}
      </button>
    </form>
  );
}
