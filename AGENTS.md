# Connect3 Ticketing - Agent Instructions

This file provides instructions for AI agents working on the Connect3 Ticketing codebase.

**New to this project? Start here:**
1. Read `.github/copilot-instructions.md` (repo-wide principles)
2. Read `docs/DOCUMENTATION.md` (5-minute architecture overview)
3. Read path-specific instructions (`.github/instructions/`)
4. Read relevant docs in `docs/` folder

## Quick Start Checklist

Before making any changes:

- [ ] **Read documentation** - Check `docs/` for existing patterns
- [ ] **Search for existing code** - Don't duplicate utilities/hooks/types
- [ ] **Follow patterns** - Use established patterns in the codebase
- [ ] **Update docs** - Document new patterns/utilities/types created
- [ ] **Test changes** - Run `npm run lint` before committing

## Critical Constraints

### 1. Timezone Handling for Events

**MUST convert to UTC before storing in database.**

❌ **WRONG**:
```typescript
const startTime = new Date(body.startDate).toISOString();
// This is UTC time, not event-timezone time!
```

✅ **CORRECT**:
```typescript
import { convertToUTC } from '@/lib/utils/timezone';

const startTime = convertToUTC(
  new Date(body.startDate),
  body.timezone // "America/New_York"
);

// Store as UTC in database
const { data } = await supabase.from('events').insert({
  start_time: startTime.toISOString(),
  timezone: body.timezone, // ALWAYS store timezone
});
```

**See**: [docs/api/PATTERNS.md#1-timezone-handling](./docs/api/PATTERNS.md#1-timezone-handling-for-events)

### 2. Club-Scoped Operations

**Verify club admin access explicitly. Do NOT silently fall back to user profile.**

❌ **WRONG**:
```typescript
// This assumes the user's personal profile owns the event
// But club events need the club profile!
const { data } = await supabase
  .from('events')
  .insert([{ created_by: user.id }]); // Wrong profile!
```

✅ **CORRECT**:
```typescript
import { isClubAdmin } from '@/lib/auth/clubAdmin';
import { resolveManagedProfileId } from '@/lib/auth/clubAdmin';

// Verify user is club admin
const isAdmin = await isClubAdmin(user.id, clubId);
if (!isAdmin) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// Get the club profile (not the user's personal profile)
const profileId = await resolveManagedProfileId(clubId, user.id);

const { data } = await supabase.from('events').insert([{
  created_by: profileId, // Use club profile, not user.id
  club_id: clubId,
}]);
```

**See**: [docs/api/PATTERNS.md#2-club-scoped-operations](./docs/api/PATTERNS.md#2-club-scoped-operations)

### 3. Instagram Imports

Query `instagram_club_fetches` by club **profile_id**, not user ID.

**See**: [docs/api/PATTERNS.md#3-instagram-club-post-imports](./docs/api/PATTERNS.md#3-instagram-club-post-imports)

### 4. Zero Code Duplication

**Never duplicate utilities, hooks, types, or components.**

**Before creating new code, check**:
- `lib/utils/` - Pure utility functions
- `lib/hooks/` - Custom React hooks
- `lib/types/` - TypeScript interfaces
- `components/shared/` - Reusable components
- `docs/lib/README.md` - Documentation of existing utilities

### 5. Always Use API Client Functions

**NEVER make direct fetch calls. Always use `lib/api/` functions.**

❌ **BAD**:
```typescript
const res = await fetch(`/api/events/${id}`);
const event = await res.json();
```

✅ **GOOD**:
```typescript
import { fetchEvent } from '@/lib/api/fetchEvent';
const event = await fetchEvent(id);
```

### 6. Centralized Type Definitions

**Define types ONCE in `lib/types/`. Never duplicate type definitions.**

❌ **BAD**:
```typescript
// event.tsx
interface User { id: string; email: string; }

// dashboard.tsx
interface User { id: string; email: string; } // Duplicate!
```

✅ **GOOD**:
```typescript
// lib/types/users.ts
export interface User { id: string; email: string; }

// event.tsx & dashboard.tsx
import type { User } from '@/lib/types/users';
```

## Core Principles

### 1. Single Responsibility

Each function/component should have one clear purpose:

```typescript
// ✅ GOOD - Each function does one thing
export function calculateEventDuration(startTime: Date, endTime: Date): number {
  return endTime.getTime() - startTime.getTime();
}

export function formatDuration(milliseconds: number): string {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  return `${hours}h`;
}

// ❌ BAD - Does too much
export function calculateAndFormatDuration(startTime, endTime) {
  const ms = endTime.getTime() - startTime.getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  return `${hours}h`;
}
```

### 2. Break Down Large Components

If component exceeds 200 lines, extract sub-components:

```
EventForm/ (main)
├── EventFormHeader/ (sub)
├── EventFormFields/ (sub)
└── EventFormFooter/ (sub)
```

### 3. Extract Logic to Hooks

If component has complex logic, move to `lib/hooks/`:

```typescript
// ✅ GOOD
const { event, loading, save } = useEventForm(eventId);

// ❌ BAD - Logic inline in component
// 100+ lines of state, effects, and handlers in component
```

### 4. Use TypeScript Interfaces

Always define props with TypeScript:

```typescript
// ✅ GOOD
interface EventFormProps {
  eventId: string;
  onSave: (event: Event) => Promise<void>;
}

export function EventForm({ eventId, onSave }: EventFormProps) { }

// ❌ BAD
export function EventForm(props: any) { }
```

## Important Pages - Read Before Modifying

Some pages have complex logic with important quirks:

- **[Dashboard Club](./docs/pages/dashboard-club/README.md)** ⚠️
  - Different behavior for org vs regular user accounts
  - Read before modifying authentication logic

- **[Dashboard Events](./docs/pages/dashboard-events/README.md)**
  - Real-time updates, pagination, filtering
  - Read before modifying event list

- **[Event Detail](./docs/pages/event-detail/README.md)** ⚠️
  - ISR (static generation) with 60-second revalidation
  - Read before modifying caching logic

- **[Event Create](./docs/pages/event-create/README.md)** ⚠️
  - Server-side redirect (no UI shown to user)
  - Read before modifying event creation

- **[Event Edit](./docs/pages/event-edit/README.md)** ⚠️
  - Server-side authorization check required
  - Read before modifying editor

## Before Implementing

### Checklist

```
Code Implementation Checklist:
- [ ] Read relevant docs (`docs/` or `.github/instructions/`)
- [ ] Search for existing utilities/hooks/types
- [ ] Check similar components for patterns
- [ ] Verify timezone handling (if events involved)
- [ ] Verify club admin access (if clubs involved)
- [ ] Extract logic to hooks (if 50+ lines in component)
- [ ] No duplicate code/types/components
- [ ] Use existing API client functions
- [ ] Update documentation
- [ ] Run type checking (`npm run lint`)
```

## When You Get Stuck

### Search Strategy

1. **For patterns**: Check `docs/` folder
2. **For utilities**: Check `lib/utils/`, `lib/hooks/`, `lib/api/`
3. **For similar code**: Search codebase for similar files
4. **For types**: Check `lib/types/`
5. **For page behavior**: Check specific page docs in `docs/pages/`

### Documentation

- **Architecture**: [docs/DOCUMENTATION.md](./docs/DOCUMENTATION.md)
- **API patterns**: [docs/api/PATTERNS.md](./docs/api/PATTERNS.md)
- **Component patterns**: [docs/components/README.md](./docs/components/README.md)
- **Available utilities**: [docs/lib/README.md](./docs/lib/README.md)
- **Page documentation**: [docs/pages/README.md](./docs/pages/README.md)
- **Available types**: [docs/lib/TYPES.md](./docs/lib/TYPES.md)

## After Implementing

### Update Documentation

Update `docs/` if you:
- ✅ Added new utility/hook
- ✅ Added new API route
- ✅ Added new component pattern
- ✅ Discovered new constraint/pattern
- ✅ Modified existing behavior

### No Incomplete Features

Before committing:
- ✅ All code follows existing patterns
- ✅ No duplicate code/types/utils
- ✅ Documentation updated
- ✅ Type checking passes (`npm run lint`)

## Questions?

If something is unclear:

1. **Check documentation** in `docs/` folder
2. **Look at existing code** - Find similar implementation
3. **Review patterns** - Check `.github/instructions/` for path-specific guidance
4. **Check repository memory** - Read repo notes in `/memories/repo/`

## Key Files to Know

- `.github/copilot-instructions.md` - Repository-wide principles
- `.github/instructions/` - Path-specific instructions
- `docs/DOCUMENTATION.md` - Architecture & patterns overview
- `docs/api/PATTERNS.md` - Critical API patterns (timezone, club-scoped ops)
- `docs/pages/README.md` - All pages reference
- `docs/lib/README.md` - Available utilities/hooks

---

**Version**: 1.0  
**Last Updated**: March 14, 2026

🚀 **Ready to code?** Read the relevant documentation first, search for existing code, then follow the patterns in this codebase.
