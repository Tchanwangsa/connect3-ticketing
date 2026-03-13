# Library Utilities, Hooks & APIs

This document outlines all available utilities, custom hooks, and API client functions.

## Directory Structure

```
lib/
├── api/                # API client functions
├── auth/               # Authentication utilities
├── hooks/              # Custom React hooks
├── supabase/           # Supabase client setup
├── types/              # Shared TypeScript types
└── utils/              # Utility functions
```

## API Client Functions (`lib/api/`)

These are the **only** functions that should be used to fetch/mutate data from the API.

### Available Functions

| Function | Purpose | File |
|----------|---------|------|
| `fetchEvent(id)` | Fetch single event by ID | `fetchEvent.ts` |
| `fetchEventServer(id)` | Server-side event fetch | `fetchEventServer.ts` |
| `createEvent(data)` | Create new event | `createEvent.ts` |
| `updateEvent(id, data)` | Full event update (PUT) | `updateEvent.ts` |
| `patchEvent(id, data)` | Partial event update (PATCH) | `patchEvent.ts` |

### Usage Example

```typescript
// ✅ GOOD - Always use client functions
import { fetchEvent } from '@/lib/api/fetchEvent';

const event = await fetchEvent(eventId);

// ❌ BAD - Direct fetch calls
const response = await fetch(`/api/events/${eventId}`);
```

## Custom Hooks (`lib/hooks/`)

Reusable React logic extracted into custom hooks.

### Available Hooks

| Hook | Purpose | File | Args |
|------|---------|------|------|
| `useAutoSave(data, onSave)` | Auto-save data with debounce | `useAutoSave.ts` | data object, save callback |
| `useAdminClubSelector()` | Track selected admin club | `useAdminClubSelector.ts` | none |
| `useEventRealtime(eventId)` | Real-time event updates | `useEventRealtime.ts` | eventId |
| `useFieldAutoSave(fieldName, value)` | Auto-save individual field | `useFieldAutoSave.ts` | fieldName, current value |
| `useIntersection(ref)` | Intersection observer hook | `useIntersection.ts` | ref to element |
| `useIsMobile()` | Check if mobile viewport | `useIsMobile.ts` | none |
| `useDocumentDark()` | Track dark mode state | `useDocumentDark.ts` | none |

### Hook Usage Examples

```typescript
// Auto-save form
const { isSaving, error } = useAutoSave(formData, async (data) => {
  await updateEvent(eventId, data);
});

// Real-time updates
const event = useEventRealtime(eventId);

// Check mobile
const isMobile = useIsMobile();

// Dark mode
const isDark = useDocumentDark();
```

## Utility Functions (`lib/utils/`)

Pure, reusable utility functions.

### Timezone Utilities (`lib/utils/timezone.ts`)

**CRITICAL**: Use these for all timezone conversions in events.

```typescript
import {
  convertToEventTimezone,    // Convert UTC to event timezone
  convertToUTC,               // Convert event time to UTC
  getTimezoneOffset,          // Get UTC offset for timezone
} from '@/lib/utils/timezone';

// Convert user's local time to event timezone
const eventTime = convertToEventTimezone(
  new Date(),
  'America/New_York'
);

// Convert event time back to UTC for storage
const utcTime = convertToUTC(
  new Date('2026-03-14 14:00'),
  'America/New_York'
);
```

### Image Utilities (`lib/utils/cropImage.ts`)

```typescript
import { cropImage } from '@/lib/utils/cropImage';

const croppedImage = await cropImage(file, cropArea);
```

### Media Upload (`lib/utils/uploadEventImage.ts`)

```typescript
import { uploadEventImage } from '@/lib/utils/uploadEventImage';

const url = await uploadEventImage(file, eventId);
```

### General Utils (`lib/utils/utils.ts`)

Common utility functions for string manipulation, formatting, etc.

## Supabase Clients (`lib/supabase/`)

Choose the correct Supabase client for your context:

### `lib/supabase/client.ts` - Client-Side

```typescript
// ✅ Use in client components ('use client')
'use client';

import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { data } = await supabase.from('events').select();
```

### `lib/supabase/server.ts` - Server Components

```typescript
// ✅ Use in server components (no 'use client')
import { createClient } from '@/lib/supabase/server';

const supabase = await createClient();
const { data } = await supabase.from('events').select();
```

### `lib/supabase/admin.ts` - Admin Operations

```typescript
// ✅ Use in API routes for admin operations (RLS bypass)
import { createClient } from '@/lib/supabase/admin';

const supabase = createClient();
// This bypasses Row-Level Security
const { data } = await supabase.from('events').select();
```

### `lib/supabase/middleware.ts` - Middleware

```typescript
// ✅ Use in middleware.ts
import { createClient } from '@/lib/supabase/middleware';

const supabase = createClient();
```

## Authentication Utilities (`lib/auth/`)

### Club Admin Check (`lib/auth/clubAdmin.ts`)

```typescript
import { isClubAdmin } from '@/lib/auth/clubAdmin';

const isAdmin = await isClubAdmin(userId, clubId);
```

### SSO (`lib/auth/sso.ts`)

Handles single sign-on functionality.

## Using Existing Utilities

**Before writing a new utility, check if one already exists:**

Common utilities already implemented:
- Timezone conversion ✅
- Image cropping ✅
- Image upload ✅
- Club admin verification ✅
- Auto-save with debounce ✅
- Real-time event updates ✅
- Mobile viewport detection ✅
- Dark mode detection ✅

**If you need a utility that doesn't exist:**
1. Create it in `lib/utils/` or `lib/hooks/`
2. Document it in this file
3. Use it consistently across the app

---

**Last Updated**: March 2026
