"use client";

import { useActionState } from "react";
import type { UserRole } from "@/db/schema";
import { ROLE_LABELS } from "@/lib/auth/roles";
import type { UserFormState } from "@/lib/users/actions";

const inputClass = "w-full border rounded px-3 py-2 text-sm";
const ALL_ROLES = Object.keys(ROLE_LABELS) as UserRole[];

export type UserFormValues = {
  id?: string;
  name: string;
  email: string;
  roles: UserRole[];
  isApproved: boolean;
  isActive: boolean;
  notes: string;
  phone: string;
  gradYear: string;
  bannerId: string;
  residence: string;
  emergencyContact: string;
  emergencyPhone: string;
  receivesNotifications: boolean;
};

export function UserForm({
  action,
  initial,
  mode,
}: {
  action: (prev: UserFormState, form: FormData) => Promise<UserFormState>;
  initial: UserFormValues;
  mode: "create" | "edit";
}) {
  const [state, formAction, pending] = useActionState<UserFormState, FormData>(action, {});
  const err = state.errors ?? {};
  const v = (k: keyof UserFormValues) => {
    const fromState = state.values?.[k];
    if (typeof fromState === "string") return fromState;
    const init = initial[k];
    return typeof init === "string" ? init : "";
  };
  const roles = (state.values?.roles as string[] | undefined) ?? initial.roles;
  const checked = (k: "isApproved" | "isActive" | "receivesNotifications") =>
    state.values ? state.values[k] === "on" : initial[k];

  return (
    <form action={formAction} className="space-y-6">
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      {state.formError ? <p className="rounded border border-danger-border bg-danger-soft p-3 text-sm">{state.formError}</p> : null}
      {state.saved ? <p className="text-sm text-success">Saved.</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm">
          <span className="block mb-1 font-medium">Full name</span>
          <input name="name" required defaultValue={v("name")} className={inputClass} />
          {err.name ? <span className="text-xs text-destructive">{err.name}</span> : null}
        </label>
        <label className="text-sm">
          <span className="block mb-1 font-medium">Email</span>
          <input name="email" type="email" required defaultValue={v("email")} className={inputClass} />
          {err.email ? <span className="text-xs text-destructive">{err.email}</span> : null}
        </label>
        <label className="text-sm">
          <span className="block mb-1 font-medium">Mobile phone</span>
          <input name="phone" type="tel" defaultValue={v("phone")} className={inputClass} />
          {err.phone ? <span className="text-xs text-destructive">{err.phone}</span> : null}
        </label>
        <label className="text-sm">
          <span className="block mb-1 font-medium">Graduation year</span>
          <input name="gradYear" type="number" min={2000} max={2100} defaultValue={v("gradYear")} className={inputClass} />
          {err.gradYear ? <span className="text-xs text-destructive">{err.gradYear}</span> : null}
        </label>
        <label className="text-sm">
          <span className="block mb-1 font-medium">Banner ID</span>
          <input name="bannerId" maxLength={11} defaultValue={v("bannerId")} className={inputClass} />
          {err.bannerId ? <span className="text-xs text-destructive">{err.bannerId}</span> : null}
        </label>
        <label className="text-sm">
          <span className="block mb-1 font-medium">Campus residence</span>
          <input name="residence" maxLength={120} defaultValue={v("residence")} className={inputClass} />
        </label>
        <label className="text-sm">
          <span className="block mb-1 font-medium">Emergency contact</span>
          <input name="emergencyContact" maxLength={120} defaultValue={v("emergencyContact")} className={inputClass} />
        </label>
        <label className="text-sm">
          <span className="block mb-1 font-medium">Emergency phone</span>
          <input name="emergencyPhone" type="tel" defaultValue={v("emergencyPhone")} className={inputClass} />
          {err.emergencyPhone ? <span className="text-xs text-destructive">{err.emergencyPhone}</span> : null}
        </label>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Roles</legend>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {ALL_ROLES.map((r) => (
            <label key={r} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="roles" value={r} defaultChecked={roles.includes(r)} />
              {ROLE_LABELS[r]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isApproved" defaultChecked={checked("isApproved")} />
          Approved to work events
        </label>
        {mode === "edit" ? (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isActive" defaultChecked={checked("isActive")} />
            Active (unchecking signs them out and blocks signup)
          </label>
        ) : null}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="receivesNotifications" defaultChecked={checked("receivesNotifications")} />
          Receives the daily event digest
        </label>
      </div>

      {mode === "edit" ? (
        <label className="block text-sm">
          <span className="block mb-1 font-medium">Personnel notes (private)</span>
          <textarea name="notes" rows={3} maxLength={2000} defaultValue={v("notes")} className={inputClass} />
        </label>
      ) : null}

      <button type="submit" disabled={pending} className="bg-brand text-white px-4 py-2 rounded text-sm disabled:opacity-50">
        {pending ? "Saving…" : mode === "create" ? "Create account and send invite" : "Save changes"}
      </button>
    </form>
  );
}
