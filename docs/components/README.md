# Components Architecture

This document outlines component structure, patterns, and guidelines.

## Directory Structure

```
components/
├── auth/               # Authentication components
├── dashboard/          # Dashboard UI components
├── events/             # Event-related components
├── layout/             # Layout/navigation components
├── logo/               # Logo components
├── media/              # Media library components
├── providers/          # React context providers
├── shared/             # Reusable domain components
└── ui/                 # UI primitives (shadcn/ui)
```

## Component Types

### 1. UI Primitives (`components/ui/`)

Low-level, reusable UI components from shadcn/ui.

**Do NOT modify or duplicate these** - they are the base for all domain components.

Examples:
- `button.tsx` - Button primitive
- `dialog.tsx` - Dialog primitive
- `input.tsx` - Input field primitive
- `card.tsx` - Card layout primitive

### 2. Domain Components

Components specific to business logic (events, clubs, profiles).

**Placement:**
- Events: `components/events/`
- Dashboard: `components/dashboard/`
- Auth: `components/auth/`

**Examples:**
- `EventForm.tsx` - Event creation/edit form
- `EventChecklist.tsx` - Event checklist display
- `OrgDashboard.tsx` - Organization dashboard

### 3. Shared Components (`components/shared/`)

Reusable domain-specific components used across multiple pages.

**Create here if:**
- Component is used in 2+ different pages/sections
- Component encapsulates reusable domain logic
- Component is a common UI pattern in the app

**Examples:**
- `AvatarStack.tsx` - Avatar stack component
- Custom button variants
- Common card layouts

## Component Guidelines

### 1. Component File Structure

Each component should be in its own file with clear naming:

```typescript
// ✅ GOOD
components/events/EventForm.tsx
components/dashboard/AdminManagePanel.tsx
components/shared/AvatarStack.tsx

// ❌ BAD
components/Form.tsx (too generic)
components/Panel.tsx (too generic)
```

### 2. TypeScript Props Interface

Always define props using TypeScript interfaces:

```typescript
// ✅ GOOD
interface EventFormProps {
  eventId: string;
  onSuccess?: () => void;
  isReadOnly?: boolean;
}

export function EventForm({ eventId, onSuccess, isReadOnly }: EventFormProps) {
  // ...
}

// ❌ BAD
export function EventForm(props: any) {
  // ...
}
```

### 3. Breaking Down Large Components

If a component is larger than ~200 lines, break it into smaller sub-components:

```typescript
// ✅ GOOD - Component broken into focused pieces
components/events/
├── EventForm.tsx (main form container)
├── EventFormHeader.tsx (form header)
├── EventFormFields.tsx (form fields section)
└── EventFormFooter.tsx (form actions)

// ❌ BAD - Everything in one large component
components/events/
└── EventForm.tsx (500+ lines)
```

### 4. Import Organization

```typescript
// Order: React → External libs → Internal components → Utils → Types

import { useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { EventForm } from '@/components/events/EventForm';
import { useEventData } from '@/lib/hooks/useEventData';
import { formatDate } from '@/lib/utils/timezone';
import type { Event } from '@/lib/types/events';
```

### 5. Styling

All components use Tailwind CSS with shadcn/ui for consistency:

```typescript
// ✅ GOOD
<div className="flex gap-4 p-6 border rounded-lg">
  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
    Submit
  </button>
</div>

// ✅ ALSO GOOD - Using shadcn/ui components
import { Button } from '@/components/ui/button';

<Button onClick={handleSubmit}>Submit</Button>
```

### 6. Composition Over Props Drilling

If props go more than 2 levels deep, extract sub-components or use composition:

```typescript
// ❌ BAD - Props drilling
<EventForm
  event={event}
  onUpdate={onUpdate}
  club={club}
  clubAdmin={clubAdmin}
  editMode={editMode}
  // ... 5 more props ...
/>

// ✅ GOOD - Composition
<EventForm event={event}>
  <EventFormHeader event={event} club={club} />
  <EventFormFields event={event} />
  <EventFormFooter onUpdate={onUpdate} />
</EventForm>
```

## Hook Patterns for Components

Extract component logic into custom hooks:

```typescript
// ✅ GOOD - Logic in custom hook
const useEventForm = (eventId: string) => {
  const [event, setEvent] = useState(null);
  // ... form logic ...
  return { event, handleSubmit, isLoading };
};

export function EventForm({ eventId }: EventFormProps) {
  const { event, handleSubmit, isLoading } = useEventForm(eventId);
  return <form onSubmit={handleSubmit}>...</form>;
}

// ❌ BAD - All logic in component
export function EventForm({ eventId }: EventFormProps) {
  const [event, setEvent] = useState(null);
  // ... 100 lines of logic ...
  return <form ...>...</form>;
}
```

See [docs/lib/README.md](../lib/README.md) for available hooks.

## Client vs Server Components

```typescript
// ✅ Server Component - No interactive hooks, fetches data server-side
export async function EventDisplay({ eventId }: { eventId: string }) {
  const event = await fetchEventServer(eventId);
  return <div>{event.title}</div>;
}

// ✅ Client Component - Uses hooks, interactive
'use client';

import { useEventData } from '@/lib/hooks/useEventData';

export function EventEditor({ eventId }: { eventId: string }) {
  const { event, updateEvent } = useEventData(eventId);
  return <form onSubmit={updateEvent}>...</form>;
}
```

## Common Component Locations

| Component | Location | Purpose |
|-----------|----------|---------|
| Event creation form | `components/events/EventForm.tsx` | Create/edit events |
| Event display card | `components/events/EventDisplayCard.tsx` | Show event summary |
| Dashboard header | `components/dashboard/` | Dashboard layout |
| Login button | `components/auth/LoginButton.tsx` | Auth entry point |
| Form fields | `components/events/fields/` | Input field components |
| Modals | `components/events/checkout/` | Modal dialogs |

---

**Last Updated**: March 2026
