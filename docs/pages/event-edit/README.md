# Event Editor

**Route**: `/events/[id]/edit`  
**Files**: `app/events/[id]/edit/page.tsx` (server) + `EditEventClient.tsx` (client)  
**Auth**: Yes (event creator or club admin)

## Purpose

Allow authorized users to edit event details, ticketing settings, images, and publishing status.

## CRITICAL: Server-Side Authorization Check

This page has **two-part structure**:

### Part 1: Server Component (Authorization)

```typescript
// app/events/[id]/edit/page.tsx (server component)

export default async function EditEventPage({ params }) {
  // Check auth server-side
  const result = await checkEventEditAccess(id, user?.id);

  if (!result.allowed) {
    // If unauthorized: Show page
    return <Unauthorized reason={result.reason} eventId={id} />;
  }

  // If authorized: Render client component
  return <EditEventClient eventId={id} />;
}
```

**Why server-side check first**:
- Don't load event data if user not authorized
- More secure (can't be bypassed by client-side code)
- Faster (check before rendering)

### Part 2: Client Component (Editor)

```typescript
// EditEventClient.tsx (client component)

'use client';

export default function EditEventClient({ eventId }: Props) {
  // Load event data (safe, already authorized)
  const event = useEventData(eventId);

  // Render editor form
  return <EventForm event={event} />;
}
```

## Authorization Rules

User can edit event if:
1. ✅ User is the event creator, OR
2. ✅ User is an admin of the club that owns the event, OR
3. ✅ User's organization owns the event

**Not authorized if**:
- ❌ Event is published and user isn't creator/club admin
- ❌ User is not in club_admins table
- ❌ Event doesn't exist
- ❌ User is not authenticated

## Function: `checkEventEditAccess()`

Located in `lib/api/fetchEventServer.ts`:

```typescript
async function checkEventEditAccess(eventId: string, userId: string | null) {
  // Returns object:
  return {
    allowed: boolean,      // Can user edit?
    reason?: string,       // Why not? ("not_found", "not_authorized")
  };
}
```

## Page Flow

```
1. Get event ID from URL param
   ↓
2. Get authenticated user
   ├─ Not logged in?
   └─ Redirect to /auth/error
   ↓
3. Check edit access using checkEventEditAccess()
   ├─ Event not found?
   │  └─ Return 404 (notFound())
   ├─ Not authorized?
   │  ├─ Reason: "not_found" → notFound()
   │  └─ Reason: other → <Unauthorized />
   └─ Authorized?
      └─ Render <EditEventClient />
   ↓
4. Client component loads event data
   ├─ useEventData(eventId)
   ├─ Subscribe to real-time changes
   └─ Show editor form
   ↓
5. User edits event
   ├─ Auto-save via useAutoSave()
   ├─ Updates event in DB
   └─ Shows success toast
   ↓
6. User can publish event
   ├─ Click "Publish" button
   ├─ Event marked as published
   ├─ Available in /events/[id] (public)
   └─ ISR regenerates static page
```

## Components Used

### `<EditEventClient />`

Client component that renders the event editor:
- Form fields for event details
- Image upload/editing
- Ticketing configuration
- Auto-save functionality
- Publish/draft toggle

### `<Unauthorized />`

Page shown when user doesn't have access:
```typescript
interface UnauthorizedProps {
  reason: string;  // Why access denied
  eventId: string; // Event being accessed
}
```

**Reasons**:
- `"not_found"` - Event doesn't exist (but this shows 404 instead)
- `"not_creator"` - User didn't create event
- `"wrong_club"` - Event belongs to different club
- Other reasons from `checkEventEditAccess()`

## Key Hooks Used

### `useEventData(eventId)`

Custom hook that:
- Fetches event details
- Subscribes to real-time changes
- Returns event data + loading state

### `useAutoSave(data, onSave)`

Auto-saves data with debounce:
```typescript
const { isSaving, error } = useAutoSave(
  formData,
  async (data) => {
    await api.updateEvent(eventId, data);
  }
);
```

## States

### Server-Side States

```typescript
const user = await getUser();           // Authenticated user
const result = await checkEventEditAccess(id, user?.id);
// result.allowed: boolean
// result.reason: "not_found" | "not_authorized" | etc
```

### Client-Side States

```typescript
const {
  event,              // Current event data
  loading,            // Fetching event
  error,              // Fetch error
  updateEvent,        // Function to update event
} = useEventData(eventId);

const {
  isSaving,           // Auto-save in progress
  saveError,          // Auto-save error
} = useAutoSave(formData, onSave);
```

## Publishing Flow

1. User makes edits (auto-saved)
2. User clicks "Publish" button
3. Event marked as `published: true`
4. Page regenerated via ISR (60s interval)
5. Event appears at `/events/[id]` (public)
6. Ticket button becomes functional

## Common Issues & Solutions

### ❌ Problem: "Unauthorized" page appearing

**Possible Causes**:
1. User is not the event creator
2. User is not admin of the event's club
3. User is not the organization that owns event

**Solutions**:
1. Only event creator can edit (transfer ownership if needed)
2. Verify user is club admin (check club_admins table)
3. Verify organization matches

### ❌ Problem: 404 page appearing

**Possible Causes**:
1. Event doesn't exist
2. Event ID in URL is wrong
3. Event was deleted

**Solutions**:
1. Check event exists in database
2. Verify event ID in URL
3. Check dashboard for event list

### ❌ Problem: Changes not saving

**Possible Cause**: Auto-save error or network issue

**Solution**:
1. Check browser console for errors
2. Check network tab for failed requests
3. Verify API is responding
4. Try manual save (if save button available)

### ❌ Problem: Published event still not visible publicly

**Possible Cause**: ISR cache not regenerated yet (60s delay)

**Expected Behavior**: New published events take up to 60 seconds to appear publicly

**Solutions**:
1. Wait 60 seconds
2. Or manually deploy/rebuild to invalidate ISR
3. Check event is actually published (not draft)

### ✅ What Not To Do

❌ **DON'T** skip server-side authorization check  
❌ **DON'T** load unauthorized event data client-side  
❌ **DON'T** let users edit events they don't own  
❌ **DON'T** save event without authorization (even if submitted via API)  

## Related Pages

- [docs/pages/event-create/README.md](../event-create/README.md) - Create new event
- [docs/pages/event-detail/README.md](../event-detail/README.md) - Public event preview
- [docs/pages/dashboard-events/README.md](../dashboard-events/README.md) - Events list

## Testing Checklist

- [ ] Event creator can edit their event
- [ ] Club admin can edit their club's events
- [ ] Non-admin cannot edit club events
- [ ] Non-creator cannot edit other user's events
- [ ] 404 shows for non-existent event
- [ ] Unauthorized page shows with correct reason
- [ ] Changes auto-save correctly
- [ ] Event can be published
- [ ] Published event appears publicly after 60s
- [ ] Real-time updates show if event edited elsewhere

## Security Notes

1. **Server-side check required**: Don't rely on client-side authorization
2. **Database RLS**: Verify Supabase RLS policies enforce these rules
3. **API endpoint auth**: Event update API must also verify authorization
4. **Token expiry**: Handle expired auth tokens gracefully

---

**Last Updated**: March 14, 2026
