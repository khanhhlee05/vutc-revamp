"use client";

import { X } from "lucide-react";
import { AlertDialog as AlertPrimitive, Dialog as Primitive } from "radix-ui";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";

const overlayClass =
  "fixed inset-0 z-50 bg-slate-950/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0";
const contentClass =
  "fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border bg-card p-6 shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95";

export const Dialog = Primitive.Root;
export const DialogTrigger = Primitive.Trigger;
export const DialogClose = Primitive.Close;

export function DialogContent({ className, children, ...props }: React.ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Overlay className={overlayClass} />
      <Primitive.Content className={cn(contentClass, className)} {...props}>
        {children}
        <Primitive.Close className="absolute top-4 right-4 rounded-sm text-muted-foreground transition-colors hover:text-foreground">
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </Primitive.Close>
      </Primitive.Content>
    </Primitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("space-y-1.5 pr-6", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.ComponentProps<typeof Primitive.Title>) {
  return <Primitive.Title className={cn("text-lg font-semibold", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: React.ComponentProps<typeof Primitive.Description>) {
  return <Primitive.Description className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

/**
 * Confirmation dialog for actions that are hard to undo. Wrap the trigger
 * button; `confirm` is rendered as the confirming control (usually a submit
 * button inside a server action form).
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirm,
  cancelLabel = "Cancel",
}: {
  trigger: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  confirm: React.ReactNode;
  cancelLabel?: string;
}) {
  return (
    <AlertPrimitive.Root>
      <AlertPrimitive.Trigger asChild>{trigger}</AlertPrimitive.Trigger>
      <AlertPrimitive.Portal>
        <AlertPrimitive.Overlay className={overlayClass} />
        <AlertPrimitive.Content className={contentClass}>
          <div className="space-y-1.5">
            <AlertPrimitive.Title className="text-lg font-semibold">{title}</AlertPrimitive.Title>
            {description ? (
              <AlertPrimitive.Description className="text-sm text-muted-foreground">{description}</AlertPrimitive.Description>
            ) : null}
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertPrimitive.Cancel className={buttonVariants({ variant: "outline" })}>{cancelLabel}</AlertPrimitive.Cancel>
            {confirm}
          </div>
        </AlertPrimitive.Content>
      </AlertPrimitive.Portal>
    </AlertPrimitive.Root>
  );
}
