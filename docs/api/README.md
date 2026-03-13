# API Routes Documentation

This document outlines all API routes, their purposes, and implementation patterns.

## Events API

### Route: `/api/events`

**Methods:**
- `GET` - Fetch events (with pagination)
- `POST` - Create a new event

**Key Files:**
- Handler: `app/api/events/route.ts`
- Client: `lib/api/fetchEvent.ts`, `lib/api/createEvent.ts`

**Types:** `lib/types/events.ts`

### Route: `/api/events/[id]`

**Methods:**
- `GET` - Fetch single event
- `PATCH` - Update event
- `DELETE` - Delete event

**Key Files:**
- Handler: `app/api/events/[id]/route.ts`
- Client: `lib/api/fetchEvent.ts`, `lib/api/updateEvent.ts`, `lib/api/patchEvent.ts`

### Route: `/api/events/check-ids`

**Methods:**
- `GET` - Check event ID availability

**Purpose:** Validate event IDs before creation

---

## Clubs API

### Route: `/api/clubs`

**Methods:**
- `GET` - List clubs
- `POST` - Create club (admin only)

### Route: `/api/clubs/[id]`

**Methods:**
- `GET` - Get club details
- `PATCH` - Update club
- `DELETE` - Delete club

### Route: `/api/clubs/my-clubs`

**Methods:**
- `GET` - Get authenticated user's clubs

**Purpose:** Retrieve clubs where user is a member or admin

### Route: `/api/clubs/admins`

**Methods:**
- `GET` - List club admins
- `POST` - Add club admin

---

## Invites API

### Route: `/api/invites`

**Methods:**
- `GET` - List invites (user's invites)
- `POST` - Create invite

### Route: `/api/invites/[id]`

**Methods:**
- `GET` - Get invite details
- `PATCH` - Update invite (accept/decline)
- `DELETE` - Delete invite

---

## Profiles API

### Route: `/api/profiles`

**Methods:**
- `GET` - Get user profile
- `PATCH` - Update profile

---

## Media API

### Route: `/api/media/*`

**Methods:**
- `POST` - Upload media
- `GET` - Retrieve media

**Purpose:** Handle image uploads and media storage via Supabase Storage

---

## API Implementation Patterns

### 1. Request Validation

Always validate request data at the route handler level:

```typescript
// app/api/events/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  
  // Validate required fields
  if (!body.title || !body.clubId) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  // Proceed with logic
}
```

### 2. Authentication & Authorization

Always check user authentication and club-scoped access:

```typescript
// Get authenticated user
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Verify club access
const { data: clubAdmin } = await supabase
  .from('club_admins')
  .select()
  .eq('club_id', clubId)
  .eq('user_id', user.id)
  .single();

if (!clubAdmin) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### 3. Timezone Handling in Event APIs

**CRITICAL**: Convert timestamps to UTC before storing in database.

```typescript
import { convertToUTC } from '@/lib/utils/timezone';

const eventData = {
  title: body.title,
  start_time: convertToUTC(new Date(body.startTime), body.timezone),
  end_time: convertToUTC(new Date(body.endTime), body.timezone),
  timezone: body.timezone,
};
```

### 4. Error Handling

Use consistent error responses:

```typescript
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { data, error } = await supabase
      .from('events')
      .select()
      .eq('id', params.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 5. API Client Functions

Always use the client functions from `lib/api/` in components instead of direct fetch:

```typescript
// ✅ GOOD - Use client function
import { fetchEvent } from '@/lib/api/fetchEvent';
const event = await fetchEvent(eventId);

// ❌ BAD - Direct fetch call
const response = await fetch(`/api/events/${eventId}`);
```

---

## Client Functions Location

All API client functions are in `lib/api/`:

- `fetchEvent.ts` - GET single event
- `fetchEventServer.ts` - Server-side event fetch
- `createEvent.ts` - POST new event
- `updateEvent.ts` - PUT full event update
- `patchEvent.ts` - PATCH partial event update

**Example client function:**

```typescript
// lib/api/fetchEvent.ts
export async function fetchEvent(eventId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('events')
    .select()
    .eq('id', eventId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}
```

---

## Supabase Client Selection

- **Server Components**: `import { createClient } from '@/lib/supabase/server'`
- **Client Components**: `import { createClient } from '@/lib/supabase/client'`
- **API Routes**: `import { createClient } from '@/lib/supabase/admin'`
- **Middleware**: `import { createClient } from '@/lib/supabase/middleware'`

---

**Last Updated**: March 2026
