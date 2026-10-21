import type { Metadata } from "next";
import { RequestForm } from "./request-form";

export const metadata: Metadata = { title: "Request an Event Quote" };

export default function RequestPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">Request an Event Quote</h1>
        <p className="text-foreground/80 mt-2">
          Tell us about your event and we will reply with a quote. Submit at
          least 10 days before the event; requests inside that window may
          carry a rush fee and limited services. Read the{" "}
          <a href="/policies" className="underline">
            client policies
          </a>{" "}
          before you submit.
        </p>
      </div>
      <RequestForm />
    </div>
  );
}
