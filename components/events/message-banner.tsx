import { SIGNUP_MESSAGES } from "@/lib/events/signup-messages";

export function MessageBanner({ code }: { code?: string }) {
  if (!code) return null;
  const text = SIGNUP_MESSAGES[code];
  if (!text) return null;
  const bad = code === "denied" || code === "droplocked" || code === "invalid" || code === "droppedlate";
  return (
    <p
      role="status"
      className={`rounded border p-3 text-sm ${bad ? "border-amber-300 bg-amber-50" : "border-green-300 bg-green-50"}`}
    >
      {text}
    </p>
  );
}
