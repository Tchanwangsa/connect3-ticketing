# API Instructions

**Path**: `app/api/`

This applies to all API route handlers in the `app/api/` directory.

## Route Structure

```
app/api/
├── clubs/
│   ├── route.ts          (GET: list, POST: create)
│   ├── [id]/route.ts     (GET: detail, PATCH: update, DELETE: delete)
│   ├── admins/           (club admins management)
│   └── my-clubs/         (user's clubs)
├── events/
│   ├── route.ts          (POST: create events)
│   └── [id]/route.ts     (GET: detail, PATCH: update, DELETE: delete)
├── invites/
│   ├── route.ts
│   └── [id]/route.ts
├── profiles/
│   └── route.ts
└── media/
    └── route.ts
```

## Authentication

### Check User is Authenticated

```typescript
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // User is authenticated
}
```

## Authorization

### Club-Scoped Operations

**CRITICAL**: Always verify club admin access explicitly.

```typescript
import { isClubAdmin } from "@/lib/auth/clubAdmin";
import { resolveManagedProfileId } from "@/lib/auth/clubAdmin";

export async function POST(request: Request) {
  const { clubId } = await request.json();

  // Verify user is club admin
  const isAdmin = await isClubAdmin(user.id, clubId);
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Or resolve acting profile (for org vs user accounts)
  const profileId = await resolveManagedProfileId(clubId, user.id);
  if (!profileId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Proceed with operation
}
```

See [docs/api/PATTERNS.md#2-club-scoped-operations](../../docs/api/PATTERNS.md#2-club-scoped-operations)

## Input Validation

### Validate Required Fields

```typescript
export async function POST(request: Request) {
  const body = await request.json();

  // Validate required fields
  const required = ["title", "clubId", "startTime", "endTime", "timezone"];
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json(
        { error: `Missing required field: ${field}` },
        { status: 400 },
      );
    }
  }

  // Validate field types
  if (typeof body.title !== "string") {
    return NextResponse.json(
      { error: "Title must be a string" },
      { status: 400 },
    );
  }

  // Proceed
}
```

### Validate Timezone

```typescript
import { convertToUTC } from "@/lib/utils/timezone";

export async function POST(request: Request) {
  const { timezone } = await request.json();

  try {
    convertToUTC(new Date(), timezone); // Validate timezone
  } catch (e) {
    return NextResponse.json({ error: "Invalid timezone" }, { status: 400 });
  }
}
```

## Timezone Handling

**CRITICAL**: Convert to UTC before storing in database.

```typescript
import { convertToUTC } from "@/lib/utils/timezone";

export async function POST(request: Request) {
  const body = await request.json();

  // User enters time in their timezone
  const startUTC = convertToUTC(new Date(body.startTime), body.timezone);

  const eventData = {
    title: body.title,
    start_time: startUTC.toISOString(),
    end_time: convertToUTC(new Date(body.endTime), body.timezone).toISOString(),
    timezone: body.timezone, // ALWAYS store timezone
  };

  const { data, error } = await supabase.from("events").insert([eventData]);
}
```

See [docs/api/PATTERNS.md#1-timezone-handling](../../docs/api/PATTERNS.md#1-timezone-handling-for-events)

## Error Handling

### Standard Error Responses

```typescript
// 400 - Bad Request (validation error)
return NextResponse.json(
  { error: "Validation failed", details: { email: "Invalid email" } },
  { status: 400 },
);

// 401 - Unauthorized (not authenticated)
return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

// 403 - Forbidden (authenticated but no permission)
return NextResponse.json({ error: "Forbidden" }, { status: 403 });

// 404 - Not Found
return NextResponse.json({ error: "Event not found" }, { status: 404 });

// 500 - Server Error
return NextResponse.json({ error: "Internal server error" }, { status: 500 });
```

### Catch Supabase Errors

```typescript
export async function POST(request: Request) {
  try {
    const { data, error } = await supabase.from("events").insert([data]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

## Supabase Client Selection

### For API Routes: Use `admin` Client

API routes should use the admin client (runs on server):

```typescript
import { createClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = createClient();
  // This bypasses RLS policies (use carefully)
}
```

## Response Format

### Success Response

```typescript
// Return data directly
return NextResponse.json({
  id: "abc123",
  title: "My Event",
  // ...
});

// Or with metadata
return NextResponse.json(
  {
    data: event,
    created: true,
  },
  { status: 201 },
); // 201 for created
```

### Error Response

```typescript
// Consistent error format
return NextResponse.json(
  {
    error: "User-friendly message",
    code: "ERROR_CODE", // Optional: for client error handling
    details: {}, // Optional: additional info
  },
  { status: 400 }, // Appropriate HTTP status
);
```

## Example: Complete Event Creation Route

```typescript
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/admin";
import { isClubAdmin } from "@/lib/auth/clubAdmin";
import { convertToUTC } from "@/lib/utils/timezone";

export async function POST(request: NextRequest) {
  try {
    // 1. Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse and validate request body
    const body = await request.json();

    const required = ["title", "clubId", "startTime", "endTime", "timezone"];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing field: ${field}` },
          { status: 400 },
        );
      }
    }

    // 3. Verify club admin access
    const isAdmin = await isClubAdmin(user.id, body.clubId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4. Validate timezone
    try {
      convertToUTC(new Date(), body.timezone);
    } catch {
      return NextResponse.json({ error: "Invalid timezone" }, { status: 400 });
    }

    // 5. Create event with UTC timestamps
    const eventData = {
      title: body.title,
      club_id: body.clubId,
      start_time: convertToUTC(
        new Date(body.startTime),
        body.timezone,
      ).toISOString(),
      end_time: convertToUTC(
        new Date(body.endTime),
        body.timezone,
      ).toISOString(),
      timezone: body.timezone,
      created_by: user.id,
    };

    const { data, error } = await supabase
      .from("events")
      .insert([eventData])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("Error creating event:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

## Testing Checklist

- [ ] Auth check implemented
- [ ] Authorization verified (if club-scoped)
- [ ] Input validation for all fields
- [ ] Timezone validated (if event-related)
- [ ] Timezone converted to UTC (if event-related)
- [ ] Error responses have http status codes
- [ ] No secrets exposed in responses
- [ ] Supabase errors handled
- [ ] Success response format consistent
- [ ] Tested with Postman/curl

---

**Last Updated**: March 14, 2026  
**Applies to**: `app/api/**`
