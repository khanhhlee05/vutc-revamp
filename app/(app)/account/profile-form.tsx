"use client";

import { useActionState } from "react";
import { updateMyProfile, type ProfileFormState } from "@/lib/users/actions";

const inputClass = "w-full border rounded px-3 py-2 text-sm";

export function ProfileForm({
  initial,
}: {
  initial: {
    phone: string;
    gradYear: string;
    bannerId: string;
    residence: string;
    emergencyContact: string;
    emergencyPhone: string;
    receivesNotifications: boolean;
  };
}) {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(updateMyProfile, {});
  const err = state.errors ?? {};
  return (
    <form action={action} className="space-y-4">
      {state.saved ? <p className="text-sm text-success">Saved.</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm">
          <span className="block mb-1 font-medium">Mobile phone</span>
          <input name="phone" type="tel" defaultValue={initial.phone} className={inputClass} />
          {err.phone ? <span className="text-xs text-destructive">{err.phone}</span> : null}
        </label>
        <label className="text-sm">
          <span className="block mb-1 font-medium">Graduation year</span>
          <input name="gradYear" type="number" min={2000} max={2100} defaultValue={initial.gradYear} className={inputClass} />
          {err.gradYear ? <span className="text-xs text-destructive">{err.gradYear}</span> : null}
        </label>
        <label className="text-sm">
          <span className="block mb-1 font-medium">Banner ID</span>
          <input name="bannerId" defaultValue={initial.bannerId} maxLength={11} className={inputClass} />
          {err.bannerId ? <span className="text-xs text-destructive">{err.bannerId}</span> : null}
        </label>
        <label className="text-sm">
          <span className="block mb-1 font-medium">Campus residence</span>
          <input name="residence" defaultValue={initial.residence} maxLength={120} className={inputClass} />
        </label>
        <label className="text-sm">
          <span className="block mb-1 font-medium">Emergency contact</span>
          <input name="emergencyContact" defaultValue={initial.emergencyContact} maxLength={120} className={inputClass} />
        </label>
        <label className="text-sm">
          <span className="block mb-1 font-medium">Emergency contact phone</span>
          <input name="emergencyPhone" type="tel" defaultValue={initial.emergencyPhone} className={inputClass} />
          {err.emergencyPhone ? <span className="text-xs text-destructive">{err.emergencyPhone}</span> : null}
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="receivesNotifications" defaultChecked={initial.receivesNotifications} />
        Email me the daily event digest
      </label>
      <button type="submit" disabled={pending} className="bg-brand text-white px-4 py-2 rounded text-sm disabled:opacity-50">
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
