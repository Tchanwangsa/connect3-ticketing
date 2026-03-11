import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { format } from "date-fns";
import {
  Calendar,
  MapPin,
  Globe,
  Tag,
  Ticket,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  fetchEventServer,
  getAllPublishedEventIds,
} from "@/lib/api/fetchEventServer";

/* ── Static generation ─────────────────────────────────────────── */

/**
 * Pre-render all published events at build time.
 * New events are generated on-demand via ISR (dynamicParams defaults to true).
 */
export async function generateStaticParams() {
  const ids = await getAllPublishedEventIds();
  return ids.map((id) => ({ id }));
}

/** Revalidate every 60 seconds — keeps pages fresh without a full rebuild. */
export const revalidate = 60;

/* ── Dynamic metadata for SEO / Open Graph ─────────────────────── */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await fetchEventServer(id);

  if (!event) {
    return { title: "Event Not Found | Connect3" };
  }

  const title = event.name ? `${event.name} | Connect3` : "Event | Connect3";
  const description =
    event.description?.slice(0, 160) ||
    "Check out this event on Connect3 — the all-in-one ticketing solution for clubs.";
  const ogImage =
    event.images[0]?.url ?? event.thumbnail ?? `${SITE_URL}/og-default.png`;

  const startDate = event.start
    ? new Date(event.start).toISOString()
    : undefined;
  const endDate = event.end ? new Date(event.end).toISOString() : undefined;

  return {
    title,
    description,
    openGraph: {
      title: event.name ?? "Event",
      description,
      url: `${SITE_URL}/events/${id}`,
      siteName: "Connect3 Ticketing",
      images: [
        { url: ogImage, width: 1200, height: 630, alt: event.name ?? "Event" },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: event.name ?? "Event",
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: `${SITE_URL}/events/${id}`,
    },
    other: {
      ...(startDate ? { "event:start_time": startDate } : {}),
      ...(endDate ? { "event:end_time": endDate } : {}),
      ...(event.location?.venue
        ? { "event:location": event.location.venue }
        : {}),
    },
  };
}

/* ── Structured data (JSON-LD) ─────────────────────────────────── */

function EventJsonLd({
  event,
}: {
  event: NonNullable<Awaited<ReturnType<typeof fetchEventServer>>>;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.name ?? "Untitled Event",
    description: event.description ?? undefined,
    startDate: event.start ?? undefined,
    endDate: event.end ?? undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: event.is_online
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    ...(event.location && !event.is_online
      ? {
          location: {
            "@type": "Place",
            name: event.location.venue ?? undefined,
            address: event.location.address ?? undefined,
            ...(event.location.latitude && event.location.longitude
              ? {
                  geo: {
                    "@type": "GeoCoordinates",
                    latitude: event.location.latitude,
                    longitude: event.location.longitude,
                  },
                }
              : {}),
          },
        }
      : event.is_online
        ? {
            location: {
              "@type": "VirtualLocation",
              url: `${SITE_URL}/events/${event.id}`,
            },
          }
        : {}),
    ...(event.images[0]?.url ? { image: event.images[0].url } : {}),
    organizer: event.creator_profile
      ? {
          "@type": "Organization",
          name: event.creator_profile.first_name,
        }
      : undefined,
    ...(event.ticket_tiers.length > 0
      ? {
          offers: event.ticket_tiers.map((t) => ({
            "@type": "Offer",
            name: t.label,
            price: t.price,
            priceCurrency: "AUD",
            availability: "https://schema.org/InStock",
            url: `${SITE_URL}/events/${event.id}`,
          })),
        }
      : {
          offers: {
            "@type": "Offer",
            price: 0,
            priceCurrency: "AUD",
            availability: "https://schema.org/InStock",
            url: `${SITE_URL}/events/${event.id}`,
          },
        }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

/* ── Page component ────────────────────────────────────────────── */

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await fetchEventServer(id);

  if (!event) notFound();

  const startDate = event.start ? new Date(event.start) : null;
  const endDate = event.end ? new Date(event.end) : null;

  const isFree =
    event.ticket_tiers.length === 0 ||
    event.ticket_tiers.every((t) => t.price === 0);

  const displayHosts = event.hosts.filter(
    (h) => (h.status === "accepted" || h.status === "pending") && h.profiles,
  );

  return (
    <>
      <EventJsonLd event={event} />

      <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ── Hero image ── */}
        {event.images.length > 0 && (
          <div className="relative mb-8 aspect-2/1 w-full overflow-hidden rounded-2xl">
            <Image
              src={event.images[0].url}
              alt={event.name ?? "Event image"}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
        )}

        {/* ── Title ── */}
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {event.name ?? "Untitled Event"}
        </h1>

        {/* ── Category & tags ── */}
        {(event.category || (event.tags && event.tags.length > 0)) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {event.category && (
              <Badge variant="secondary" className="gap-1">
                <Tag className="h-3 w-3" />
                {event.category}
              </Badge>
            )}
            {event.tags?.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* ── Key details ── */}
        <div className="mt-6 space-y-3 text-muted-foreground">
          {/* Date & time */}
          {startDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>
                {format(startDate, "EEEE, MMMM d, yyyy · h:mm a")}
                {endDate && ` – ${format(endDate, "h:mm a")}`}
              </span>
            </div>
          )}

          {/* Location */}
          {event.is_online ? (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 shrink-0" />
              <span>Online event</span>
            </div>
          ) : event.location?.venue ? (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>
                {event.location.venue}
                {event.location.address && ` · ${event.location.address}`}
              </span>
            </div>
          ) : null}

          {/* Pricing */}
          <div className="flex items-center gap-2">
            <Ticket className="h-4 w-4 shrink-0" />
            {isFree ? (
              <span className="font-medium text-green-600">Free</span>
            ) : (
              <span>
                From $
                {Math.min(...event.ticket_tiers.map((t) => t.price)).toFixed(2)}
              </span>
            )}
          </div>
        </div>

        <Separator className="my-8" />

        {/* ── Organiser / hosts ── */}
        <section>
          <h2 className="mb-4 text-lg font-semibold">Hosted by</h2>
          <div className="flex flex-wrap gap-4">
            {event.creator_profile && (
              <div className="flex items-center gap-2">
                {event.creator_profile.avatar_url ? (
                  <Image
                    src={event.creator_profile.avatar_url}
                    alt={event.creator_profile.first_name}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {event.creator_profile.first_name.charAt(0)}
                  </div>
                )}
                <span className="text-sm font-medium">
                  {event.creator_profile.first_name}
                </span>
              </div>
            )}
            {displayHosts.map((h) => (
              <div key={h.profile_id} className="flex items-center gap-2">
                {h.profiles?.avatar_url ? (
                  <Image
                    src={h.profiles.avatar_url}
                    alt={h.profiles.first_name}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {h.profiles?.first_name.charAt(0)}
                  </div>
                )}
                <span className="text-sm font-medium">
                  {h.profiles?.first_name}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Description ── */}
        {event.description && (
          <>
            <Separator className="my-8" />
            <section>
              <h2 className="mb-4 text-lg font-semibold">About this event</h2>
              <div className="prose prose-neutral max-w-none whitespace-pre-wrap text-muted-foreground">
                {event.description}
              </div>
            </section>
          </>
        )}

        {/* ── Sections (FAQ, What to Bring, etc.) ── */}
        {event.sections.length > 0 && (
          <>
            <Separator className="my-8" />
            {event.sections.map((section) => (
              <Card key={section.id} className="mb-4 p-6">
                <h3 className="mb-2 text-base font-semibold capitalize">
                  {section.type.replace(/_/g, " ")}
                </h3>
                {section.type === "faq" &&
                  Array.isArray(
                    (section.data as { items?: unknown[] })?.items,
                  ) && (
                    <dl className="space-y-3">
                      {(
                        section.data as { items: { q: string; a: string }[] }
                      ).items.map((item, i) => (
                        <div key={i}>
                          <dt className="font-medium">{item.q}</dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {item.a}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                {section.type === "what_to_bring" &&
                  Array.isArray(
                    (section.data as { items?: unknown[] })?.items,
                  ) && (
                    <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                      {(section.data as { items: string[] }).items.map(
                        (item, i) => (
                          <li key={i}>{item}</li>
                        ),
                      )}
                    </ul>
                  )}
              </Card>
            ))}
          </>
        )}

        {/* ── Pricing tiers ── */}
        {event.ticket_tiers.length > 0 && (
          <>
            <Separator className="my-8" />
            <section>
              <h2 className="mb-4 text-lg font-semibold">Tickets</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {event.ticket_tiers.map((tier) => (
                  <Card
                    key={tier.id}
                    className="flex items-center justify-between p-4"
                  >
                    <span className="font-medium">{tier.label}</span>
                    <span className="text-lg font-semibold">
                      {tier.price === 0 ? "Free" : `$${tier.price.toFixed(2)}`}
                    </span>
                  </Card>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ── Links ── */}
        {event.links.length > 0 && (
          <>
            <Separator className="my-8" />
            <section>
              <h2 className="mb-4 text-lg font-semibold">Links</h2>
              <div className="space-y-2">
                {event.links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline dark:text-blue-400"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {link.title || link.url}
                  </a>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ── Gallery (remaining images) ── */}
        {event.images.length > 1 && (
          <>
            <Separator className="my-8" />
            <section>
              <h2 className="mb-4 text-lg font-semibold">Gallery</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {event.images.slice(1).map((img) => (
                  <div
                    key={img.id}
                    className="relative aspect-square overflow-hidden rounded-xl"
                  >
                    <Image
                      src={img.url}
                      alt={event.name ?? "Event image"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </article>
    </>
  );
}
