import { Section, Text } from "@react-email/components";
import { Button, DetailTable, EmailLayout } from "./layout";

export type RequestEmailData = {
  eventId: number;
  eventName: string;
  orgName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  advisorName: string;
  advisorEmail: string;
  accountIndex: string;
  location: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  soundcheckTime: string;
  reservationStart: string;
  reservationEnd: string;
  expectedAttendance: string;
  needs: string[];
  description: string;
  submittedAt: string;
  briefUrl: string;
  manageUrl: string;
};

function eventRows(d: RequestEmailData): [string, string][] {
  return [
    ["Quote number", `#${d.eventId}`],
    ["Event", d.eventName],
    ["Organization", d.orgName],
    ["Date", d.eventDate],
    ["Event time", `${d.startTime} to ${d.endTime}`],
    ["Sound check", d.soundcheckTime],
    ["Venue reservation", `${d.reservationStart} to ${d.reservationEnd}`],
    ["Location", d.location],
    ["Expected attendance", d.expectedAttendance],
    ["Needs", d.needs.join(", ")],
    ["Description", d.description],
  ];
}

export function RequestSubmittedClientEmail({ data }: { data: RequestEmailData }) {
  return (
    <EmailLayout
      title="VUTC Event Request Received"
      preview={`We received your request for ${data.eventName}`}
    >
      <Text>Hello {data.contactName},</Text>
      <Text>
        Thank you for your interest in hiring VUTC. We received your request on{" "}
        {data.submittedAt}. A member of our event management team will follow
        up within a few days with a quote. If your event is urgent, email{" "}
        events@vutc.com.
      </Text>
      <DetailTable rows={eventRows(data)} />
      <Section style={{ marginTop: 16 }}>
        <Button href={data.briefUrl}>View the status of my event</Button>
      </Section>
    </EmailLayout>
  );
}

export function RequestSubmittedStaffEmail({ data }: { data: RequestEmailData }) {
  return (
    <EmailLayout
      title={`New event request #${data.eventId}`}
      preview={`${data.orgName}: ${data.eventName} on ${data.eventDate}`}
    >
      <DetailTable
        rows={[
          ...eventRows(data),
          ["Contact", `${data.contactName} · ${data.contactEmail} · ${data.contactPhone}`],
          ["Advisor", `${data.advisorName} · ${data.advisorEmail}`],
          ["Account index", data.accountIndex],
        ]}
      />
      <Section style={{ marginTop: 16 }}>
        <Button href={data.manageUrl}>Open in event management</Button>
      </Section>
    </EmailLayout>
  );
}

export function requestEmailText(d: RequestEmailData): string {
  return eventRows(d)
    .filter(([, v]) => v !== "")
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}
