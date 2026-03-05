import EventForm from "@/components/events/EventForm";
import { nanoid } from "nanoid";

export default function CreateEventPage() {
  // Generate the event ID upfront so images can be uploaded
  // to event-scoped storage paths before form submission.
  const eventId = nanoid(21);
  return <EventForm mode="create" eventId={eventId} />;
}
