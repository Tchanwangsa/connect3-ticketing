# Library Instructions

**Path**: `lib/`

This applies to utilities, hooks, types, and API clients in the `lib/` directory.

## Directory Structure

```
lib/
├── api/               # API client functions (ONLY way to call APIs)
├── auth/              # Authentication utilities
├── hooks/             # Custom React hooks
├── supabase/          # Supabase client instances
├── types/             # Shared TypeScript types
└── utils/             # Pure utility functions
```

## Golden Rule: Check Existing Code First

**Before creating any new utility, hook, or type:**

1. Search `lib/` for existing implementation
2. Check [docs/lib/README.md](../../docs/lib/README.md) for documented utilities
3. Reuse if it exists, create only if truly new

### Things NOT to Create (Already Exist)

- ❌ Timezone conversion (use `lib/utils/timezone.ts`)
- ❌ Image cropping (use `lib/utils/cropImage.ts`)
- ❌ Image upload (use `lib/utils/uploadEventImage.ts`)
- ❌ Club admin check (use `lib/auth/clubAdmin.ts`)
- ❌ Auto-save logic (use `lib/hooks/useAutoSave.ts`)
- ❌ Real-time events (use `lib/hooks/useEventRealtime.ts`)
- ❌ API calls for events (use `lib/api/fetchEvent.ts`, etc.)

## API Client Functions (`lib/api/`)

### Must Use Pattern

**❌ NEVER make direct fetch calls**

```typescript
// ❌ BAD - Components should NOT call fetch
const res = await fetch(`/api/events/${id}`);
const event = await res.json();
```

**✅ ALWAYS use client function**

```typescript
// ✅ GOOD - Always use lib/api/ function
import { fetchEvent } from "@/lib/api/fetchEvent";
const event = await fetchEvent(id);
```

### Creating New API Client Function

If you need a new API call, create a client function:

```typescript
// lib/api/fetchMyData.ts
import { createClient } from "@/lib/supabase/client";

export async function fetchMyData(id: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("my_table")
    .select()
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}
```

Then use it in components:

```typescript
import { fetchMyData } from "@/lib/api/fetchMyData";

const data = await fetchMyData(id);
```

And document it in [docs/lib/README.md](../../docs/lib/README.md)

## Custom Hooks (`lib/hooks/`)

### When to Create a Hook

Extract component logic into a hook if:

- Logic is reused in 2+ components, OR
- Component logic exceeds ~50 lines, OR
- Logic manages complex state/effects

```typescript
// ✅ CREATE HOOK if logic appears in multiple components
// lib/hooks/useEventForm.ts
export function useEventForm(eventId: string) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEvent(eventId)
      .then(setEvent)
      .finally(() => setLoading(false));
  }, [eventId]);

  return { event, loading };
}

// Use in multiple components
function EventEditor({ eventId }) {
  const { event, loading } = useEventForm(eventId);
}

function EventPreview({ eventId }) {
  const { event, loading } = useEventForm(eventId);
}
```

### Hook Rules

- ✅ Use React hooks inside (useState, useEffect, etc.)
- ✅ Return object with state and functions
- ✅ Take parameters for configuration
- ✅ Use `'use'` prefix in name
- ❌ Don't call React hooks conditionally
- ❌ Don't use hooks at the top level of non-function files

```typescript
// ✅ GOOD
export function useFetch(url: string) {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch(url)
      .then((r) => r.json())
      .then(setData);
  }, [url]);
  return data;
}

// ❌ BAD - No 'use' prefix
export function fetchData(url: string) {}

// ❌ BAD - Calls hook conditionally
export function useFetch(url?: string) {
  if (url) {
    useEffect(() => {}); // ❌ Conditional hook call
  }
}
```

## Utilities (`lib/utils/`)

### Pure Functions Only

Utilities should be pure functions (no side effects):

```typescript
// ✅ GOOD - Pure function
export function formatPrice(amount: number): string {
  return `$${(amount / 100).toFixed(2)}`;
}

formatPrice(2500); // Always returns "$25.00"

// ❌ BAD - Has side effects
export function logPrice(amount: number): string {
  console.log(amount); // Side effect!
  return `$${(amount / 100).toFixed(2)}`;
}
```

### Timezone Utilities

Use `lib/utils/timezone.ts` for all timezone operations:

```typescript
import {
  convertToEventTimezone, // UTC → event timezone
  convertToUTC, // Event timezone → UTC
} from "@/lib/utils/timezone";

const localTime = convertToEventTimezone(utcDate, "America/New_York");
const utcTime = convertToUTC(localDate, "America/New_York");
```

### Image Utilities

Image handling is centralized:

```typescript
// Crop image
import { cropImage } from "@/lib/utils/cropImage";
const cropped = await cropImage(file, { x: 0, y: 0, width: 100 });

// Upload to Supabase
import { uploadEventImage } from "@/lib/utils/uploadEventImage";
const url = await uploadEventImage(file, eventId);
```

## Types (`lib/types/`)

### Golden Rule: Define Once, Import Everywhere

**❌ NEVER duplicate type definitions**

```typescript
// ❌ BAD - Type defined in two files
// component1.ts
interface Event {
  id: string;
  title: string;
}

// component2.ts
interface Event {
  id: string;
  title: string;
} // Duplicate!
```

**✅ ALWAYS define in lib/types/ and import**

```typescript
// lib/types/events.ts
export interface Event {
  id: string;
  title: string;
}

// component1.ts & component2.ts
import type { Event } from "@/lib/types/events";
```

### When to Create New Type

Create new types in `lib/types/` if:

- Type is used in 2+ different files, OR
- Type represents domain concept (Event, Ticket, Club, etc.)

### Supabase Client Selection

Choose the right client for your context:

#### Server Components & API Routes

```typescript
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
const { data } = await supabase.from("events").select();
```

#### Client Components

```typescript
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
const { data } = await supabase.from("events").select();
```

#### Admin Operations (API Routes Only)

```typescript
import { createClient } from "@/lib/supabase/admin";

const supabase = createClient();
// Bypasses RLS - use cautiously
```

#### Middleware

```typescript
import { createClient } from "@/lib/supabase/middleware";

const supabase = createClient();
```

## Testing Checklist

### API Client Functions

- [ ] No direct fetch calls
- [ ] Error handling implemented
- [ ] Documented in [docs/lib/README.md](../../docs/lib/README.md)
- [ ] Single responsibility (one action per function)

### Custom Hooks

- [ ] Follows React hook rules (no conditional calls)
- [ ] Returns consistent shape
- [ ] Has `use` prefix
- [ ] Reusable across 2+ components
- [ ] Documented in [docs/lib/README.md](../../docs/lib/README.md)

### Utilities

- [ ] Pure function (no side effects)
- [ ] Handles errors gracefully
- [ ] Single responsibility
- [ ] Documented in [docs/lib/README.md](../../docs/lib/README.md)

### Types

- [ ] Import from `lib/types/`, never define inline
- [ ] Field names use snake_case (match DB) or camelCase (match JS)
- [ ] Exported for reuse
- [ ] Documented in [docs/lib/TYPES.md](../../docs/lib/TYPES.md)

## Documentation Requirements

When adding new utility/hook/type/API:

1. **Add to appropriate file** (`lib/utils/`, `lib/hooks/`, `lib/types/`, `lib/api/`)
2. **Export properly** (default or named export)
3. **Update docs**:
   - API functions: Update [docs/lib/README.md](../../docs/lib/README.md#api-client-functions)
   - Hooks: Update [docs/lib/README.md](../../docs/lib/README.md#custom-hooks)
   - Utils: Update [docs/lib/README.md](../../docs/lib/README.md#utility-functions)
   - Types: Update [docs/lib/TYPES.md](../../docs/lib/TYPES.md)

---

**Last Updated**: March 14, 2026  
**Applies to**: `lib/**`
