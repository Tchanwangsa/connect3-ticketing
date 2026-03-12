"use client";

import { EventCardDetails } from "@/lib/types/events";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { CalendarDays, Globe, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export function EventDisplayCard({
  event,
  content,
}: {
  event: EventCardDetails;
  content?: React.ReactNode;
}) {
  const router = useRouter();
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "TBA";
    return new Date(dateStr).toLocaleDateString("en-AU", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
  return (
    <Card
      key={event.id}
      className="cursor-pointer overflow-hidden transition-shadow hover:shadow-md gap-3"
      onClick={() => router.push(`/events/${event.id}/edit`)}
    >
      {event.thumbnail && (
        <div className="aspect-square w-full overflow-hidden">
          <Image
            src={event.thumbnail}
            alt={event.name ?? "Event"}
            width={400}
            height={225}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm leading-tight line-clamp-1">
            {event.name || "Untitled Event"}
          </CardTitle>
          <div className="flex items-center gap-1.5 shrink-0">
            {event.status === "draft" && (
              <Badge variant="outline" className="text-[11px]">
                Draft
              </Badge>
            )}
            {event.category && (
              <Badge variant="secondary" className="text-[11px]">
                {event.category}
              </Badge>
            )}
          </div>
        </div>
        <CardDescription className="flex items-center gap-1 text-[11px]">
          <CalendarDays className="h-3 w-3" />
          {formatDate(event.start)}
          {event.is_online ? (
            <span className="ml-1.5 flex items-center gap-0.5">
              <Globe className="h-3 w-3" /> Online
            </span>
          ) : (
            <span className="ml-1.5 flex items-center gap-0.5">
              <MapPin className="h-3 w-3" /> In-person
            </span>
          )}
        </CardDescription>
      </CardHeader>
      {content && <CardContent className="pt-0"> {content} </CardContent>}
    </Card>
  );
}
