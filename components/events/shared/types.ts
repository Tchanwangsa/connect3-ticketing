/* ── Shared event types ── */

export interface DateTimeData {
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endDate: string;
  endTime: string;
  timezone: string; // IANA tz
}

export interface LocationData {
  displayName: string;
  address: string;
}

export interface ClubProfile {
  id: string;
  first_name: string;
  avatar_url: string | null;
}

export interface EventFormData {
  name: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  timezone: string;
  location: LocationData;
  isOnline: boolean;
  category: string;
  tags: string[];
  hostIds: string[];
  thumbnailFile: File | null;
}
