/** User-facing results for signup and drop actions, keyed by the ?msg= code. */
export const SIGNUP_MESSAGES: Record<string, string> = {
  signed: "You are signed up.",
  denied: "That position is no longer available to you.",
  dropped: "You have been removed from the event.",
  droppedlate:
    "You have been removed from the event. Dropping this close to an event is recorded and may affect eligibility.",
  droplocked:
    "You cannot drop a position within 24 hours of load-in on the site. Contact your head tech.",
  invalid: "Something went wrong. Please try again.",
};
