import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventTabs } from "@/components/manage/event-tabs";
import { requireRole } from "@/lib/auth/session";
import { getManagedEvent, listOrganizationsBrief } from "@/lib/events/manage-queries";
import { toZonedDateString } from "@/lib/time";
import { EventEditForm } from "./event-edit-form";

export const metadata: Metadata = { title: "Edit Event" };

function clock(d: Date | null): string {
  if (!d) return "";
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "America/New_York" }).format(d);
}

export default async function EditEventPage(props: { params: Promise<{ id: string }> }) {
  await requireRole("event_mgmt");
  const { id } = await props.params;
  const eventId = Number(id);
  if (!Number.isInteger(eventId)) notFound();
  const [event, orgs] = await Promise.all([getManagedEvent(eventId), listOrganizationsBrief()]);
  if (!event) notFound();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        #{event.id} {event.name}
      </h1>
      <EventTabs id={event.id} active="edit" />
      <EventEditForm
        organizations={orgs}
        initial={{
          eventId: event.id,
          name: event.name,
          orgName: event.orgName,
          organizationId: event.organizationId ? String(event.organizationId) : "",
          contactName: event.contactName,
          contactEmail: event.contactEmail,
          contactPhone: event.contactPhone,
          advisorName: event.advisorName,
          advisorEmail: event.advisorEmail,
          accountIndex: event.accountIndex,
          isStudentOrg: event.isStudentOrg,
          location: event.location,
          eventDate: event.eventDate,
          startTime: clock(event.startAt),
          endTime: clock(event.endAt),
          soundcheckTime: clock(event.soundcheckAt),
          loadInDate: event.loadInAt ? toZonedDateString(event.loadInAt) : "",
          loadInTime: clock(event.loadInAt),
          reservationStart: clock(event.reservationStartAt),
          reservationEnd: clock(event.reservationEndAt),
          expectedAttendance: event.expectedAttendance ?? "",
          needs: event.needs,
          description: event.description,
          notes: event.notes,
          htNotes: event.htNotes,
          planningNotes: event.planningNotes,
          quoteSentNote: event.quoteSentNote,
          crewSlots: event.crewSlots,
          seniorStaffSlots: event.seniorStaffSlots,
          ahtSlots: event.ahtSlots,
          lhtSlots: event.lhtSlots,
          vhtSlots: event.vhtSlots,
          djSlots: event.djSlots,
          spotSlots: event.spotSlots,
          cameraSlots: event.cameraSlots,
          runnerSlots: event.runnerSlots,
          discount: event.discount,
          rentalPrice: event.rentalPrice,
          rentalDescription: event.rentalDescription,
          openOn: event.openOn ?? "",
          autoOpen: event.autoOpen,
          notifyStaff: event.notifyStaff,
        }}
      />
    </div>
  );
}
