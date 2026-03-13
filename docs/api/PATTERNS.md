# API Implementation Patterns

This document provides detailed examples of critical API implementation patterns.

## 1. Timezone Handling for Events

### The Critical Issue

Event timestamps stored in the database must be in UTC, but users enter times in their local timezone.

❌ **WRONG**: Splitting ISO strings directly shows UTC wall-clock values:

```typescript
// WRONG - This uses UTC, not the event timezone!
const startTime = new Date(body.startDate).toISOString();
//   2026-03-14T19:00:00Z (UTC) but might be midnight in New York!
```

✅ **CORRECT**: Convert to UTC using the selected event timezone:

```typescript
import { convertToUTC } from '@/lib/utils/timezone';

const eventData = {
  title: body.title,
  // User enters "2:00 PM" in America/New_York timezone
  start_time: convertToUTC(
    new Date(body.startTime),  // 2:00 PM
    body.timezone              // "America/New_York"
  ),
  // Result: 2026-03-14T18:00:00Z (6 PM UTC)
  
  end_time: convertToUTC(
    new Date(body.endTime),
    body.timezone
  ),
  
  timezone: body.timezone, // ALWAYS store the timezone
};

const { data, error } = await supabase
  .from('events')
  .insert([eventData]);
```

### Complete Event Creation Example

```typescript
// app/api/events/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  const supabase = createClient();

  // Validate timezone is provided
  if (!body.timezone) {
    return NextResponse.json(
      { error: 'Timezone is required' },
      { status: 400 }
    );
  }

  // Convert user's local times to UTC
  const startUTC = convertToUTC(
    new Date(body.startTime),
    body.timezone
  );
  const endUTC = convertToUTC(
    new Date(body.endTime),
    body.timezone
  );

  const eventData = {
    title: body.title,
    description: body.description,
    start_time: startUTC.toISOString(),
    end_time: endUTC.toISOString(),
    timezone: body.timezone,
    club_id: body.clubId,
    location: body.location,
  };

  const { data, error } = await supabase
    .from('events')
    .insert([eventData])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
```

### Retrieving Events (Converting Back to Event Timezone)

When displaying events, convert back from UTC to the event's timezone:

```typescript
import { convertToEventTimezone } from '@/lib/utils/timezone';

// In component or hook
const event = await fetchEvent(eventId);
const startTimeInEventTZ = convertToEventTimezone(
  new Date(event.start_time), // 2026-03-14T18:00:00Z (UTC)
  event.timezone              // "America/New_York"
);
// Result: 2026-03-14 14:00:00 (2 PM local time in NY)
```

---

## 2. Club-Scoped Operations

### The Critical Issue

For CREATE/UPDATE/DELETE operations on club resources, always verify club membership and resolve the acting profile from the club ID, **not the authenticated user ID**.

❌ **WRONG**: Assuming user.id is the correct profile

```typescript
// WRONG - This might resolve to the user's personal profile, not a club profile
const { data } = await supabase
  .from('events')
  .insert([{
    title: body.title,
    created_by: user.id, // ❌ This might not be a club profile!
  }]);
```

✅ **CORRECT**: Resolve profile from club_id and verify admin access

```typescript
import { isClubAdmin } from '@/lib/auth/clubAdmin';

export async function POST(request: Request) {
  const body = await request.json();
  const supabase = createClient();

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // CRITICAL: Verify user is club admin
  const isAdmin = await isClubAdmin(user.id, body.clubId);
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'You must be a club admin to create events' },
      { status: 403 }
    );
  }

  // Get the acting club profile
  const { data: clubProfile } = await supabase
    .from('club_profiles')
    .select()
    .eq('club_id', body.clubId)
    .eq('user_id', user.id)
    .single();

  if (!clubProfile) {
    return NextResponse.json(
      { error: 'Club profile not found' },
      { status: 404 }
    );
  }

  // Create event with club profile
  const { data, error } = await supabase
    .from('events')
    .insert([{
      title: body.title,
      club_id: body.clubId,
      created_by: clubProfile.id, // ✅ Use club profile ID
    }]);

  return NextResponse.json(data);
}
```

### Verify Club Membership Pattern

```typescript
// Always verify club membership before allowing operations
async function verifyClubAccess(userId: string, clubId: string, role: 'admin' | 'member' = 'member') {
  const supabase = createClient();

  const { data: access } = await supabase
    .from('club_admins')
    .select()
    .eq('user_id', userId)
    .eq('club_id', clubId)
    .single();

  if (!access) {
    throw new Error('Access denied');
  }

  if (role === 'admin' && access.role !== 'admin') {
    throw new Error('Admin access required');
  }

  return access;
}
```

---

## 3. Instagram Club Post Imports

### The Critical Issue

When importing Instagram posts for club admins, query by the club's **profile_id**, not the authenticated user's ID.

❌ **WRONG**: Querying by user ID

```typescript
// WRONG - This gets user's own Instagram fetches, not club's!
const { data } = await supabase
  .from('instagram_club_fetches')
  .select()
  .eq('profile_id', user.id); // ❌ User ID, not club profile ID
```

✅ **CORRECT**: Get club profile ID, then query by that

```typescript
export async function GET(
  request: Request,
  { params }: { params: { clubId: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Verify club access
  const isAdmin = await isClubAdmin(user.id, params.clubId);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get club profile
  const { data: clubProfile } = await supabase
    .from('club_profiles')
    .select()
    .eq('club_id', params.clubId)
    .eq('user_id', user.id)
    .single();

  // Query by club profile ID
  const { data: instagramFetches } = await supabase
    .from('instagram_club_fetches')
    .select()
    .eq('profile_id', clubProfile.id); // ✅ Club profile ID

  return NextResponse.json(instagramFetches);
}
```

---

## 4. Authentication & Error Handling

### Consistent Error Response Format

```typescript
// Always use this format for errors
export interface ErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, string>;
}

// Examples
return NextResponse.json(
  { error: 'Validation failed', details: { email: 'Invalid email' } },
  { status: 400 }
);

return NextResponse.json(
  { error: 'Unauthorized', code: 'NO_AUTH_TOKEN' },
  { status: 401 }
);

return NextResponse.json(
  { error: 'Forbidden', code: 'INSUFFICIENT_PERMISSIONS' },
  { status: 403 }
);
```

### Authentication Wrapper Pattern

```typescript
// Create a helper for protected routes
async function withAuth(
  handler: (request: Request, user: User) => Promise<Response>
) {
  return async (request: Request) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return handler(request, user);
  };
}

// Use it
export const POST = withAuth(async (request, user) => {
  // User is guaranteed to exist here
  const event = await createEvent(user.id, request.body);
  return NextResponse.json(event);
});
```

---

## 5. Input Validation Pattern

```typescript
export async function POST(request: Request) {
  const body = await request.json();

  // Validate required fields
  const requiredFields = ['title', 'clubId', 'startTime', 'endTime', 'timezone'];
  for (const field of requiredFields) {
    if (!body[field]) {
      return NextResponse.json(
        { error: `Missing required field: ${field}` },
        { status: 400 }
      );
    }
  }

  // Validate field types
  if (typeof body.title !== 'string') {
    return NextResponse.json(
      { error: 'Title must be a string' },
      { status: 400 }
    );
  }

  // Validate timezone is valid
  try {
    // This will throw if timezone is invalid
    convertToUTC(new Date(), body.timezone);
  } catch (e) {
    return NextResponse.json(
      { error: 'Invalid timezone' },
      { status: 400 }
    );
  }

  // Proceed with creation...
}
```

---

**Last Updated**: March 2026
