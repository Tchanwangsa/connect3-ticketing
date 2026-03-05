import type {
  EventFormData,
  CarouselImage,
} from "@/components/events/shared/types";
import type { SectionData } from "@/components/events/sections/types";

/**
 * All field groups that can be independently patched.
 */
export type FieldGroup =
  | "event"
  | "location"
  | "images"
  | "hosts"
  | "pricing"
  | "links"
  | "theme"
  | "sections";

/**
 * Builds the PATCH body for only the provided field groups.
 */
function buildPatchBody(
  groups: FieldGroup[],
  form: EventFormData,
  images: CarouselImage[],
  sections: SectionData[],
  status?: "draft" | "published",
): Record<string, unknown> {
  const body: Record<string, unknown> = { fields: groups };

  if (groups.includes("event")) {
    body.name = form.name;
    body.description = form.description;
    body.startDate = form.startDate;
    body.startTime = form.startTime;
    body.endDate = form.endDate;
    body.endTime = form.endTime;
    body.timezone = form.timezone;
    body.isOnline = form.isOnline;
    body.category = form.category;
    body.tags = form.tags;
    if (status !== undefined) body.status = status;
  }

  if (groups.includes("location")) {
    body.location = form.location;
    body.isOnline = form.isOnline;
  }

  if (groups.includes("images")) {
    body.imageUrls = images
      .filter((img) => img.url && !img.uploading)
      .map((img) => img.url);
  }

  if (groups.includes("hosts")) {
    body.hostIds = form.hostIds;
  }

  if (groups.includes("pricing")) {
    body.pricing = form.pricing.map((t) => ({
      label: t.label,
      price: t.price,
    }));
  }

  if (groups.includes("links")) {
    body.links = form.links.map((l) => ({ url: l.url, title: l.title }));
  }

  if (groups.includes("theme")) {
    body.theme = form.theme;
  }

  if (groups.includes("sections")) {
    body.sections = sections.map((s) => ({ type: s.type, data: s }));
  }

  return body;
}

/**
 * PATCH only the specified field groups to `/api/events/[id]`.
 * Returns the list of groups that were actually updated.
 */
export async function patchEvent(
  eventId: string,
  groups: FieldGroup[],
  form: EventFormData,
  images: CarouselImage[],
  sections: SectionData[],
  status?: "draft" | "published",
): Promise<FieldGroup[]> {
  if (groups.length === 0) return [];

  const body = buildPatchBody(groups, form, images, sections, status);

  const res = await fetch(`/api/events/${eventId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Event patch failed (${res.status})`);
  }

  const { updated } = await res.json();
  return (updated ?? groups) as FieldGroup[];
}
