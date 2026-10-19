import { Text } from "@react-email/components";
import { DetailTable, EmailLayout } from "./layout";

export type InvoiceEmailData = {
  eventId: number;
  eventName: string;
  contactName: string;
  eventDate: string;
  total: string;
  dueDate: string;
  senderName: string;
};

export function InvoiceEmail({ data }: { data: InvoiceEmailData }) {
  return (
    <EmailLayout title="VUTC Bill of Services" preview={`Invoice for ${data.eventName}: ${data.total}`}>
      <Text>Hello {data.contactName},</Text>
      <Text>
        Attached is your invoice from VUTC for <strong>{data.eventName}</strong> on {data.eventDate}.
      </Text>
      <DetailTable
        rows={[
          ["Invoice number", `#${data.eventId}`],
          ["Total", data.total],
          ["Due", data.dueDate],
        ]}
      />
      <Text>
        Your account will be debited through the university&apos;s Banner system by the Office of Student
        Involvement; no action is needed unless your organization has no university account. A 10%
        finance charge applies to balances unpaid after 30 days.
      </Text>
      <Text>
        Thank you for choosing Villanova University Tech Crew. We look forward to working with you
        again. Reply to this email with any questions.
        <br />
        {data.senderName}, VUTC
      </Text>
    </EmailLayout>
  );
}

export function invoiceEmailText(d: InvoiceEmailData): string {
  return [
    `Hello ${d.contactName},`,
    "",
    `Attached is your invoice from VUTC for ${d.eventName} (#${d.eventId}) on ${d.eventDate}.`,
    `Total: ${d.total}. Due: ${d.dueDate}.`,
    "",
    "Your account will be debited through Banner by the Office of Student Involvement. A 10% finance charge applies after 30 days.",
    "",
    `Thank you for choosing VUTC. ${d.senderName}`,
  ].join("\n");
}
