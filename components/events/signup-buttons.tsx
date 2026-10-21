import type { SignupDecision } from "@/lib/events/eligibility";
import { dropEvent, signUpForEvent } from "@/lib/events/signup-actions";

export function SignupButtons({
  eventId,
  decisions,
  returnTo,
  allowDrop,
}: {
  eventId: number;
  decisions: SignupDecision[];
  returnTo: string;
  allowDrop: boolean;
}) {
  const visible = decisions.filter((d) => d.state !== "hidden");
  if (visible.length === 0) {
    return <p className="text-xs text-muted-foreground">No positions available to you.</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((d) =>
        d.state === "can" ? (
          <form key={d.role} action={signUpForEvent}>
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="role" value={d.role} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <button type="submit" className="bg-brand text-white text-sm px-3 py-1.5 rounded">
              {d.label}
            </button>
          </form>
        ) : d.state === "signed" ? (
          <form key={d.role} action={dropEvent} className="flex items-center gap-2">
            <span className="text-sm rounded bg-success-soft border border-success-border px-3 py-1.5">
              {d.label}
            </span>
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="role" value={d.role} />
            <input type="hidden" name="returnTo" value={returnTo} />
            {allowDrop ? (
              <button type="submit" className="text-sm underline text-destructive">
                Drop
              </button>
            ) : (
              <span className="text-xs text-muted-foreground">Contact your head tech to drop</span>
            )}
          </form>
        ) : (
          <span
            key={d.role}
            className="text-sm rounded border px-3 py-1.5 text-muted-foreground bg-muted"
          >
            {d.label}
          </span>
        ),
      )}
    </div>
  );
}
