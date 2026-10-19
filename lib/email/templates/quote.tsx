import { Section, Text } from "@react-email/components";
import { Button, DetailTable, EmailLayout } from "./layout";

export type QuoteEmailData = {
  eventId: number;
  eventName: string;
  contactName: string;
  eventDate: string;
  timeRange: string;
  location: string;
  total: string;
  briefUrl: string;
  senderName: string;
};

export function QuoteEmail({ data }: { data: QuoteEmailData }) {
  return (
    <EmailLayout title="VUTC Price Quote" preview={`Quote for ${data.eventName}: ${data.total}`}>
      <Text>Hello {data.contactName},</Text>
      <Text>
        Attached is the price quote for your event <strong>{data.eventName}</strong>. Please review it
        and confirm your event as soon as possible using the button below. VUTC cannot schedule
        services until the quote is confirmed.
      </Text>
      <DetailTable
        rows={[
          ["Quote number", `#${data.eventId}`],
          ["Date", data.eventDate],
          ["Time", data.timeRange],
          ["Location", data.location],
          ["Total", data.total],
        ]}
      />
      <Section style={{ marginTop: 16 }}>
        <Button href={data.briefUrl}>Review and confirm my event</Button>
      </Section>
      <Text>
        Payment information is sent with the bill after the event. By confirming you agree to the
        VUTC client policies, including late submission, cancellation, weather, and billing terms,
        available on our website.
      </Text>
      <Text>
        Reply to this email with any questions.
        <br />
        {data.senderName}, VUTC Events Management
      </Text>
    </EmailLayout>
  );
}

export function quoteEmailText(d: QuoteEmailData): string {
  return [
    `Hello ${d.contactName},`,
    "",
    `Attached is the price quote for ${d.eventName} (#${d.eventId}).`,
    `Date: ${d.eventDate}`,
    `Time: ${d.timeRange}`,
    `Location: ${d.location}`,
    `Total: ${d.total}`,
    "",
    `Review and confirm: ${d.briefUrl}`,
    "",
    "By confirming you agree to the VUTC client policies on our website.",
  ].join("\n");
}
