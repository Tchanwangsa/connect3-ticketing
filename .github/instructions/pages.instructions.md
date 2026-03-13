# Pages Instructions

**Path**: `app/`

This applies to all Next.js pages and route handlers in the `app/` directory.

## Server Components vs Client Components

### Server Components (Default)

Use for:

- Fetching data server-side
- Protecting secrets/API keys
- Database operations
- Auth checks

```typescript
// ✅ Server component (no 'use client')
export default async function Page({ params }: Props) {
  const data = await fetchData(); // Server-side only
  return <div>{data}</div>;
}
```

### Client Components

Use for:

- Interactive state (forms, buttons)
- Hooks (useState, useEffect, useCallback)
- Event listeners
- Real-time subscriptions

```typescript
'use client'; // Required for hooks/interactivity

import { useState } from 'react';

export default function Form() {
  const [value, setValue] = useState('');
  return <input onChange={(e) => setValue(e.target.value)} />;
}
```

## Page Authentication Rules

### Unauthenticated Pages

Allow public access (no auth check):

- `/` - Home/landing
- `/auth/callback` - OAuth callback
- `/auth/error` - Auth error page
- `/events/[id]` - Public event detail
- `/events/[id]/checkout` - Ticketing checkout

### Authenticated Pages

Require login:

- `/dashboard/*` - All dashboard pages
- `/events/create` - Create event
- `/events/[id]/edit` - Edit event

**Check auth with**:

- **Server components**: `const { data: { user } } = await supabase.auth.getUser()`
- **Client components**: `const { user } = useAuthStore()`

## Special Page Patterns

### Server-Side Redirects

Some pages redirect after performing server-side work:

- `/events/create` - Creates draft event, redirects to editor
- `/auth/callback` - Exchanges auth code, redirects to requested path

**Pattern**:

```typescript
export default async function Page() {
  // Do server work
  // ...
  redirect("/next-page");
}
```

### Static Generation (ISR)

Event detail page uses ISR:

- Pre-builds published events at deploy time
- Revalidates every 60 seconds
- On-demand for new events

```typescript
export async function generateStaticParams() {
  const ids = await getAllPublishedEventIds();
  return ids.map((id) => ({ id }));
}

export const revalidate = 60; // Seconds
export const dynamicParams = true; // Generate new on-demand
```

See [docs/pages/event-detail/README.md](../../docs/pages/event-detail/README.md)

## Using Query Parameters

### Reading Query Params (Server Components)

```typescript
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const clubId = params.club_id;
}
```

### Reading Query Params (Client Components)

```typescript
"use client";

import { useSearchParams } from "next/navigation";

export default function Page() {
  const searchParams = useSearchParams();
  const clubId = searchParams.get("club_id");
}
```

## Authorization Patterns

### Check Auth (Server)

```typescript
const supabase = await createClient();
const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) {
  redirect("/"); // Redirect if not signed in
}
```

### Verify Club Access

```typescript
import { isClubAdmin } from "@/lib/auth/clubAdmin";

const isMember = await isClubAdmin(user.id, clubId);
if (!isMember) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

### Conditional Rendering (Client)

```typescript
'use client';

import { useAuthStore } from '@/stores/authStore';

export default function Page() {
  const { user, loading } = useAuthStore();

  if (loading) return <Spinner />;
  if (!user) return <LoginPrompt />;

  return <Dashboard />;
}
```

## Error Handling

### 404 Pages

```typescript
import { notFound } from "next/navigation";

const data = await fetch(`...`);
if (!data) {
  notFound(); // Shows 404 page
}
```

### Redirects

```typescript
import { redirect } from "next/navigation";

if (!user) {
  redirect("/auth/login");
}
```

### Custom Error Pages

```typescript
// app/error.tsx
'use client';

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div>
      <h1>Something went wrong</h1>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

## Page Documentation

Complex pages have dedicated docs in `docs/pages/`:

- [Dashboard Club](../../docs/pages/dashboard-club/README.md) - Org vs user logic
- [Dashboard Events](../../docs/pages/dashboard-events/README.md) - Pagination & filtering
- [Event Detail](../../docs/pages/event-detail/README.md) - ISR & static generation
- [Event Create](../../docs/pages/event-create/README.md) - Server redirect
- [Event Edit](../../docs/pages/event-edit/README.md) - Authorization & editor

**READ these before modifying those pages.**

## Testing Checklist

- [ ] Auth checks work (redirects if needed)
- [ ] Club access verified before showing data
- [ ] No secrets exposed to client
- [ ] Query params handled safely
- [ ] 404 returns 404, not 500
- [ ] Redirects go to valid pages
- [ ] Loading states shown while fetching
- [ ] Error messages user-friendly

---

**Last Updated**: March 14, 2026  
**Applies to**: `app/**`
