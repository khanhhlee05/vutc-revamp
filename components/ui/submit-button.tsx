"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "./button";

/**
 * Submit button for server action forms. Disables itself while the form is
 * submitting so a double click cannot send the action twice. `pending` lets a
 * form using useActionState pass its own pending flag.
 */
export function SubmitButton({
  children,
  pendingText,
  pending: pendingProp,
  disabled,
  ...props
}: ButtonProps & { pendingText?: React.ReactNode; pending?: boolean }) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <Button type="submit" disabled={pending || disabled} aria-busy={pending || undefined} {...props}>
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
      {pending && pendingText ? pendingText : children}
    </Button>
  );
}
