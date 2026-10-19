"use client";

import { useActionState } from "react";
import type { OrgFormState } from "@/lib/organizations/actions";

export function OrgForm({
  action,
  initial,
}: {
  action: (prev: OrgFormState, form: FormData) => Promise<OrgFormState>;
  initial: { id?: number; name: string; description: string; alertFlag: boolean };
}) {
  const [state, formAction, pending] = useActionState<OrgFormState, FormData>(action, {});
  return (
    <form action={formAction} className="space-y-4 max-w-2xl">
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      {state.saved ? <p className="text-sm text-green-700">Saved.</p> : null}
      <label className="block text-sm">
        <span className="block mb-1 font-medium">Name</span>
        <input name="name" required maxLength={80} defaultValue={initial.name} className="w-full border rounded px-3 py-2" />
        {state.errors?.name ? <span className="text-xs text-red-700">{state.errors.name}</span> : null}
      </label>
      <label className="block text-sm">
        <span className="block mb-1 font-medium">Description and history</span>
        <textarea name="description" rows={5} maxLength={5000} defaultValue={initial.description} className="w-full border rounded px-3 py-2" />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="alertFlag" defaultChecked={initial.alertFlag} />
        Alert: needs special handling (shown on event pages)
      </label>
      <button type="submit" disabled={pending} className="bg-brand text-white px-4 py-2 rounded text-sm disabled:opacity-50">
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
