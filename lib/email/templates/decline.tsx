import { Text } from "@react-email/components";
import { DetailTable, EmailLayout } from "./layout";

export type DeclineEmailData = {
  eventId: number;
  eventName: string;
  contactName: string;
  eventDate: string;
  location: string;
  reason: string;
  senderName: string;
  senderEmail: string;
  cancelled: boolean;
};

export function DeclineEmail({ data }: { data: DeclineEmailData }) {
  const verb = data.cancelled ? "cancelled" : "declined";
  return (
    <EmailLayout title={`Event ${verb}: ${data.eventName}`}>
      <Text>Hello {data.contactName},</Text>
      <Text>
        We are sorry, but your event <strong>{data.eventName}</strong> on {data.eventDate} has been{" "}
        {verb}.
      </Text>
      {data.reason ? <Text style={{ whiteSpace: "pre-wrap" }}>{data.reason}</Text> : null}
      <DetailTable
        rows={[
          ["Request number", `#${data.eventId}`],
          ["Date", data.eventDate],
          ["Location", data.location],
        ]}
      />
      <Text>
        Reply to this email or contact {data.senderName} at {data.senderEmail} with questions. You are
        welcome to submit a new request on our website.
      </Text>
    </EmailLayout>
  );
}

export function declineEmailText(d: DeclineEmailData): string {
  return [
    `Hello ${d.contactName},`,
    "",
    `Your event ${d.eventName} (#${d.eventId}) on ${d.eventDate} has been ${d.cancelled ? "cancelled" : "declined"}.`,
    d.reason ? `\n${d.reason}\n` : "",
    `Contact ${d.senderName} at ${d.senderEmail} with questions.`,
  ].join("\n");
}
