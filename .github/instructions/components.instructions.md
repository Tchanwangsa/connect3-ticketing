# Components Instructions

**Path**: `components/`

This applies to all React components in the `components/` directory.

## Component Organization

### Directory Structure

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

## Component Naming

- **File names**: PascalCase matching component name
- **File location**: Category folder when possible
- **Exports**: Default export as the component

```typescript
// ✅ GOOD
components/events/EventForm.tsx
export default function EventForm(props) { ... }

// ❌ BAD
components/Form.tsx (too generic)
components/events/form.tsx (wrong case)
```

## Component Guidelines

### TypeScript Props

Always define props with TypeScript interfaces:

```typescript
// ✅ GOOD
interface EventFormProps {
  eventId: string;
  onSave: (event: Event) => Promise<void>;
  isReadOnly?: boolean;
}

export default function EventForm({ eventId, onSave, isReadOnly }: EventFormProps) {
  // ...
}

// ❌ BAD
export default function EventForm(props: any) { ... }
```

### Breaking Down Large Components

If component exceeds ~200 lines, break into smaller pieces:

```
events/
├── EventForm.tsx           (main, ~150 lines)
├── EventFormHeader.tsx     (sub-component)
├── EventFormFields.tsx     (sub-component)
└── EventFormFooter.tsx     (sub-component)
```

### Composition Over Props Drilling

Avoid passing many props through multiple levels:

```typescript
// ❌ BAD - Props drilling 5+ levels
<Parent prop1 prop2 prop3 prop4 prop5 prop6>
  <Child prop1 prop2 prop3 prop4 prop5 prop6>
    <GrandChild prop1 prop2 prop3 prop4 prop5 prop6 />
  </Child>
</Parent>

// ✅ GOOD - Composition
<Parent>
  <Child>
    <GrandChild data={data} />
  </Child>
</Parent>
```

## Client Components

Use `'use client'` when component needs:

- `useState`, `useEffect`, custom hooks
- Event handlers
- Real-time subscriptions

```typescript
"use client";

import { useState } from "react";

export default function Form() {
  const [value, setValue] = useState("");
  // ...
}
```

## Styling

### Tailwind CSS

All components use Tailwind CSS classes:

```typescript
// ✅ GOOD
<div className="flex gap-4 p-6 border rounded-lg">
  <button className="px-4 py-2 bg-blue-600 text-white rounded">
    Submit
  </button>
</div>
```

### shadcn/ui Components

Use shadcn/ui primitives for consistency:

```typescript
// ✅ GOOD
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

<Card>
  <CardContent>
    <Button onClick={handleSubmit}>Submit</Button>
  </CardContent>
</Card>
```

## Hook Patterns

### Extract Logic to Hooks

If component has significant logic, extract to `lib/hooks/`:

```typescript
// ✅ GOOD - Logic in custom hook
const useEventForm = (eventId: string) => {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  // ... logic ...
  return { event, loading, saveEvent };
};

export default function EventForm({ eventId }: Props) {
  const { event, loading, saveEvent } = useEventForm(eventId);
  return <form>...</form>;
}

// ❌ BAD - All logic inline
export default function EventForm({ eventId }: Props) {
  const [event, setEvent] = useState(null);
  // ... 50 lines of logic ...
  return <form>...</form>;
}
```

### Available Hooks

See [lib/README.md](../../docs/lib/README.md#custom-hooks) for:

- `useAutoSave()` - Auto-save with debounce
- `useEventRealtime()` - Real-time events
- `useAdminClubSelector()` - Club selector
- `useIsMobile()` - Mobile detection
- `useDocumentDark()` - Dark mode

## Reusable Components

### When to Extract to `components/shared/`

Create shared component if:

- Used in 2+ different pages
- Encapsulates reusable UI pattern
- Reduces duplication

```typescript
// ✅ GOOD - Shared component
components/shared/AvatarStack.tsx     (used by multiple pages)
components/shared/EventCard.tsx       (reusable event display)
components/shared/StatusBadge.tsx     (reusable status display)
```

### Import Organization

```typescript
// Order: React → External libs → Components → Utils → Types

import { useState, useCallback } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useEventData } from "@/lib/hooks/useEventData";
import { formatPrice } from "@/lib/utils/format";
import type { Event } from "@/lib/types/events";
```

## No Duplicate Components

❌ **DON'T** create duplicate components for similar UI  
✅ **DO** extract to `components/shared/` or `lib/hooks/`

**Before creating a new component, check**:

- `components/shared/` for reusable UI
- `lib/hooks/` for reusable logic
- Other category folders for similar components

## Performance

### Memoization

Use memoization for expensive components:

```typescript
import { memo } from 'react';

const EventCard = memo(function EventCard({ event }: Props) {
  return <div>...</div>;
});

export default EventCard;
```

### Code Splitting

Large component bundles are split via dynamic imports:

```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Spinner />,
});
```

## Testing Checklist

- [ ] Component accepts all required props
- [ ] Props are typed with TypeScript interface
- [ ] Component doesn't exceed 200 lines (extract sub-components if needed)
- [ ] No duplicate components exist (`components/shared/` checked)
- [ ] Component uses existing hooks/utils (no duplication)
- [ ] Styling uses Tailwind + shadcn/ui
- [ ] No props drilling more than 2 levels
- [ ] All interactive elements have proper event handlers
- [ ] Loading states shown when fetching data
- [ ] Error states handled gracefully

---

**Last Updated**: March 14, 2026  
**Applies to**: `components/**`
