# Shared Types & Schemas

This document outlines all shared TypeScript types. **Define types ONCE in `lib/types/` and import them everywhere else.**

## Rule: No Type Duplication

❌ **BAD**: Defining the same type in multiple files

```typescript
// components/events/EventForm.tsx
interface Event {
  id: string;
  title: string;
}

// lib/api/fetchEvent.ts
interface Event {
  id: string;
  title: string;
}
```

✅ **GOOD**: Define once, import everywhere

```typescript
// lib/types/events.ts
export interface Event {
  id: string;
  title: string;
}

// components/events/EventForm.tsx
import type { Event } from '@/lib/types/events';

// lib/api/fetchEvent.ts
import type { Event } from '@/lib/types/events';
```

## Event Types (`lib/types/events.ts`)

Core event-related types:

```typescript
export interface Event {
  id: string;
  title: string;
  description?: string;
  start_time: string; // ISO 8601 UTC
  end_time: string;   // ISO 8601 UTC
  timezone: string;   // "America/New_York"
  club_id: string;
  location?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface EventFormData {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  timezone: string;
  location?: string;
  imageUrl?: string;
}

export interface EventChecklistItem {
  id: string;
  event_id: string;
  label: string;
  completed: boolean;
  order: number;
}
```

## Ticketing Types (`lib/types/ticketing.ts`)

Ticketing and checkout related types:

```typescript
export interface Ticket {
  id: string;
  event_id: string;
  type: string;
  price: number;
  quantity: number;
  sold: number;
}

export interface TicketCheckout {
  tickets: TicketSelection[];
  totalPrice: number;
  buyerEmail: string;
  buyerName: string;
}

export interface TicketSelection {
  ticket_id: string;
  quantity: number;
}
```

## Club Types

```typescript
export interface Club {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  created_at: string;
}

export interface ClubAdmin {
  id: string;
  club_id: string;
  user_id: string;
  role: 'admin' | 'moderator';
  joined_at: string;
}
```

## User/Profile Types

```typescript
export interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}
```

## API Response Types

```typescript
export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code: string;
  };
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
```

## Adding New Types

When adding new types:

1. **Determine the domain**: Does it belong to events, ticketing, clubs, profiles?
2. **Add to appropriate file**: `lib/types/events.ts`, `lib/types/ticketing.ts`, etc.
3. **Export it**: `export interface MyType { ... }`
4. **Document here**: Add entry to this document
5. **Import everywhere**: Use `import type { MyType } from '@/lib/types/events'`

## Type Organization Pattern

Group related types together:

```typescript
// lib/types/events.ts

// Core types
export interface Event { ... }

// Related sub-types
export interface EventFormData { ... }
export interface EventChecklistItem { ... }

// API-specific types
export interface CreateEventRequest { ... }
export interface UpdateEventRequest { ... }
```

---

**Last Updated**: March 2026
