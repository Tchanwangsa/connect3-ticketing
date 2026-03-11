import type { MetadataRoute } from "next";
import { getAllPublishedEventIds } from "@/lib/api/fetchEventServer";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

/**
 * Dynamic sitemap — automatically includes all published events.
 * Google Search Console will pick this up at /sitemap.xml.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const eventIds = await getAllPublishedEventIds();

  const eventEntries: MetadataRoute.Sitemap = eventIds.map((id) => ({
    url: `${SITE_URL}/events/${id}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...eventEntries,
  ];
}
