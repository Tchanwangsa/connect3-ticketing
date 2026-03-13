# Connect3 Ticketing Repository Instructions

This file provides repository-wide guidance for all development in Connect3 Ticketing.

## Quick Start

**BEFORE working on any code:**

1. Read [docs/DOCUMENTATION.md](./docs/DOCUMENTATION.md) (5 min)
2. Check the specific path instructions below
3. Read relevant docs in `docs/` folder

## Core Principles

### 1. Zero Code Duplication

**Never duplicate code, utilities, types, or hooks.** Always:

- Extract utils to `lib/utils/`
- Extract hooks to `lib/hooks/`
- Extract components to `components/shared/`
- Extract types to `lib/types/`

❌ **Wrong**: Same utility in two files  
✅ **Right**: Define once, import everywhere

### 2. Read Documentation

EVERY page and pattern is documented in `docs/`:

- Architecture: `docs/DOCUMENTATION.md`
- APIs: `docs/api/` (especially `PATTERNS.md`)
- Components: `docs/components/README.md`
- Utils/Hooks: `docs/lib/README.md`
- Pages: `docs/pages/README.md`

**If you're about to implement something, check the docs first.**

### 3. Use Existing Utilities

Before creating a new utility, search for existing implementations:

- Timezone? → `lib/utils/timezone.ts`
- Image handling? → `lib/utils/cropImage.ts` or `uploadEventImage.ts`
- Club admin check? → `lib/auth/clubAdmin.ts`
- Auto-save? → `lib/hooks/useAutoSave.ts`
- Real-time? → `lib/hooks/useEventRealtime.ts`

### 4. Centralized Types

**Define types ONCE in `lib/types/` and import everywhere.**

❌ **Wrong**:

```typescript
// component1.tsx
interface Event {
  id: string;
  name: string;
}

// component2.tsx
interface Event {
  id: string;
  name: string;
} // Duplicate!
```

✅ **Right**:

```typescript
// lib/types/events.ts
export interface Event {
  id: string;
  name: string;
}

// component1.tsx & component2.tsx
import type { Event } from "@/lib/types/events";
```

### 5. Always Use API Client Functions

❌ **Wrong**:

```typescript
const res = await fetch(`/api/events/${id}`);
const event = await res.json();
```

✅ **Right**:

```typescript
import { fetchEvent } from "@/lib/api/fetchEvent";
const event = await fetchEvent(id);
```

## Critical Constraints

### Timezone Handling (Events)

**MUST convert to UTC before storing in database.**

```typescript
import { convertToUTC } from "@/lib/utils/timezone";

const eventData = {
  start_time: convertToUTC(new Date(body.startTime), body.timezone),
  end_time: convertToUTC(new Date(body.endTime), body.timezone),
  timezone: body.timezone,
};
```

See [docs/api/PATTERNS.md#1-timezone-handling](./docs/api/PATTERNS.md#1-timezone-handling-for-events)

### Club-Scoped Operations

**Verify club admin access explicitly. Never silently fall back to user profile.**

```typescript
const isAdmin = await isClubAdmin(user.id, clubId);
if (!isAdmin) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

See [docs/api/PATTERNS.md#2-club-scoped-operations](./docs/api/PATTERNS.md#2-club-scoped-operations)

### Instagram Imports (Club Admins)

Query `instagram_club_fetches` by club **profile_id**, not user ID.

See [docs/api/PATTERNS.md#3-instagram-club-post-imports](./docs/api/PATTERNS.md#3-instagram-club-post-imports)

## Path-Specific Instructions

Different instructions apply to different parts of the codebase:

- **`app/`** (Pages): See `.github/instructions/pages.instructions.md`
- **`components/`**: See `.github/instructions/components.instructions.md`
- **`lib/`**: See `.github/instructions/lib.instructions.md`
- **`app/api/`**: See `.github/instructions/api.instructions.md`

## When You're Done

### Update Documentation

Update `docs/` if you:

- ✅ Added a new utility/hook
- ✅ Added a new API route
- ✅ Added a new component pattern
- ✅ Discovered a new constraint
- ✅ Modified existing patterns

### No Incomplete Features

- ✅ All code uses existing patterns
- ✅ No duplicate code/types/utils
- ✅ Documentation updated
- ✅ Pass type checking (`npm run lint`)

## Useful Links

- [Full Documentation Index](./docs/README.md)
- [API Patterns (CRITICAL for events)](./docs/api/PATTERNS.md)
- [Page Documentation](./docs/pages/README.md)
- [Available Utilities](./docs/lib/README.md)
- [Shared Types](./docs/lib/TYPES.md)

---

**Last Updated**: March 14, 2026  
**Applies to**: All files in repository
