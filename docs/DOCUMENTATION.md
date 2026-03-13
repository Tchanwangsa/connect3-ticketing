# Connect3 Ticketing - Developer Documentation

This documentation provides a comprehensive guide for developing features in the Connect3 Ticketing platform. **All agents and developers must read this documentation before implementing features or refactoring code.**

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [API Routes](#api-routes)
- [Components](#components)
- [Library Utilities](#library-utilities)
- [Types & Schemas](#types--schemas)
- [Pages & Routes](#pages--routes)
- [Shared Patterns](#shared-patterns)
- [Important Constraints](#important-constraints)

## Architecture Overview

**Connect3 Ticketing** is a Next.js application that manages clubs, events, ticketing, and user profiles.

- **Frontend**: React components with TypeScript
- **Backend**: Next.js API routes with Supabase
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth with SSO support

### Technology Stack

- Next.js 15+ (App Router)
- TypeScript
- Supabase (Auth, Database, Storage)
- React Hooks
- Tailwind CSS + shadcn/ui
- Sonner (Toasts)

## Project Structure

```
app/               # Next.js App Router pages and API routes
├── api/           # API route handlers
├── auth/          # Auth-related pages
├── dashboard/     # Dashboard pages
└── events/        # Event-related pages

components/        # React components
├── auth/          # Auth components
├── dashboard/     # Dashboard components
├── events/        # Event-related components
├── layout/        # Layout components
├── ui/            # UI primitives (shadcn/ui)
└── shared/        # Shared components

lib/               # Utilities, hooks, API clients
├── api/           # API client functions
├── auth/          # Auth utilities
├── hooks/         # Custom React hooks
├── supabase/      # Supabase client setup
├── types/         # Shared TypeScript types
└── utils/         # Utility functions

docs/              # Developer documentation (this folder)
stores/            # Global state (TanStack Store, Zustand, etc.)
public/            # Static assets
```

## API Routes

See [docs/api/README.md](./api/README.md) for detailed API documentation.

**Key API endpoints:**

- `/api/events` - Event CRUD operations
- `/api/clubs` - Club management
- `/api/invites` - Club invitations
- `/api/profiles` - User profiles
- `/api/media` - Media/image handling

## Components

See [docs/components/README.md](./components/README.md) for component architecture.

**Component Guidelines:**

1. Place reusable UI components in `components/ui/` (shadcn/ui components)
2. Place domain-specific components in category folders (e.g., `components/events/`)
3. Break down large components into smaller, focused sub-components
4. Use TypeScript interfaces for all component props
5. Prefer composition over prop drilling

## Library Utilities

See [docs/lib/README.md](./lib/README.md) for available utilities, hooks, and API clients.

**Key directories:**

- `lib/hooks/` - Custom React hooks (useEventRealtime, useAutoSave, etc.)
- `lib/utils/` - Pure utility functions (timezone, image cropping, uploads)
- `lib/api/` - API client functions (fetchEvent, createEvent, etc.)
- `lib/supabase/` - Supabase client instances (client, server, admin)
- `lib/types/` - Shared TypeScript types

## Types & Schemas

See [docs/lib/TYPES.md](./lib/TYPES.md) for all shared types.

**Important:** Define types once in `lib/types/` and import them everywhere else. Do NOT duplicate type definitions across files.

**Key type files:**

- `lib/types/events.ts` - Event-related types
- `lib/types/ticketing.ts` - Ticketing-related types

## Pages & Routes

See [docs/pages/README.md](./pages/README.md) for comprehensive page documentation.

**Page Structure:**
- Public pages (home, event detail, checkout)
- Authenticated pages (dashboard, event editor)
- Auth pages (callback, error)

**Pages with Important Quirks:**
- `/dashboard/club` - Different logic for organization vs. regular users ([details](./pages/dashboard-club/README.md))
- `/dashboard/events` - Pagination, filtering, real-time updates ([details](./pages/dashboard-events/README.md))
- `/events/[id]` - ISR static generation & 60s revalidation ([details](./pages/event-detail/README.md))
- `/events/create` - Server-side redirect that creates draft ([details](./pages/event-create/README.md))
- `/events/[id]/edit` - Server-side authorization check ([details](./pages/event-edit/README.md))

## Shared Patterns

### 1. API Client Functions

Always use the API client functions from `lib/api/` instead of making raw fetch calls.

```typescript
// ✅ GOOD
import { fetchEvent } from '@/lib/api/fetchEvent';
const event = await fetchEvent(eventId);

// ❌ BAD
const response = await fetch(`/api/events/${eventId}`);
```

### 2. Timezone Handling

**CRITICAL**: Convert timestamps to the event's timezone before storing UTC.

```typescript
// Always read from lib/utils/timezone.ts for timezone utilities
import { convertToEventTimezone, convertToUTC } from '@/lib/utils/timezone';

const eventTimezone = event.timezone; // "America/New_York"
const userTime = new Date();
const eventTime = convertToEventTimezone(userTime, eventTimezone);
```

### 3. Custom Hooks for Reusable Logic

Extract component logic into custom hooks (placed in `lib/hooks/`).

```typescript
// ✅ GOOD - Reusable hook
const useEventData = (eventId: string) => {
  const [event, setEvent] = useState(null);
  // ... logic ...
  return { event, loading, error };
};

// ❌ BAD - Logic duplicated in every component
// Each component reimplements the same fetch + state logic
```

### 4. Supabase Client Selection

Use the correct Supabase client:

- **Client-side components**: `lib/supabase/client.ts` (useClient)
- **Server components**: `lib/supabase/server.ts`
- **Admin operations**: `lib/supabase/admin.ts` (caution: RLS bypass)
- **Middleware**: `lib/supabase/middleware.ts`

```typescript
// ✅ In server component
const { data } = await supabase.from('events').select();

// ✅ In client component
const supabase = createClient();
const { data } = await supabase.from('events').select();
```

### 5. Environment Validation (Club-Scoped Operations)

For club-scoped CREATE/UPDATE/DELETE operations, resolve the acting profile from `club_id` and verify `club_admin` access.

```typescript
// CRITICAL CONSTRAINT: Don't silently fall back to user profile
// Verify club admin access explicitly
```

See [docs/api/PATTERNS.md](./api/PATTERNS.md) for detailed examples.

## Important Constraints

### 1. Timezone Conversion for Events

- Event start/end timestamps saved to DB must use UTC
- Convert using the selected event timezone before storing
- **Do NOT** split ISO strings directly - this shows UTC wall-clock values
- Use `convertToUTC()` before database operations

### 2. Club-Scoped Operations

- Resolve the acting profile from `club_id` and verify `club_admin` access
- Don't silently fall back to user profile
- Always verify club membership/admin status before allowing operations

### 3. Instagram Post Imports (Club Admins)

- Query `instagram_club_fetches` by the selected club **profile_id**, not the authenticated user ID
- Ensure the requested club is within the user's scope

### 4. Code Reusability

- **No duplicate utils**: If a utility function exists in `lib/utils/`, reuse it
- **No duplicate types**: Define types once in `lib/types/`, import everywhere
- **No duplicate components**: Extract common UI patterns into `components/shared/`
- **No duplicate hooks**: Create custom hooks in `lib/hooks/` for reusable logic

## Documentation Maintenance

**When implementing a feature:**

1. Read relevant docs (API patterns, component guidelines, available utilities)
2. Implement using existing utilities/components/hooks
3. Update this documentation with new patterns, utilities, or constraints

**When refactoring code:**

1. Extract reusable logic into `lib/hooks/` or `lib/utils/`
2. Define shared types in `lib/types/`
3. Extract reusable components into `components/shared/`
4. Update documentation if you discover new patterns or constraints

**Always follow DRY (Don't Repeat Yourself)** - if code appears twice, it should be extracted into a utility.

---

**Last Updated**: March 2026  
**Next Review**: After major feature additions
