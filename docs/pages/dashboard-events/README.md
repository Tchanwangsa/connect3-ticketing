# Dashboard / Events List

**Route**: `/dashboard/events`  
**File**: `app/dashboard/events/page.tsx`  
**Auth**: Yes (organization/club admin only)

## Purpose

Display a filterable, paginated list of events for an organization or club admin.

## Key Features

### 1. Club Selector

Uses `useAdminClubSelector()` hook to:
- Fetch clubs the user is admin of
- Allow switching between clubs
- Persist selection in component state
- Optionally default to `?club_id=xxx` query param

```typescript
const { clubs, selectedClubId, setSelectedClubId } = useAdminClubSelector(initialClubId);
```

### 2. Tab Filtering

Three tabs for filtering events:
- **All**: All events (any status)
- **Published**: Published events only
- **Draft**: Draft events only

```typescript
type EventTab = "all" | "published" | "draft";
```

### 3. Pagination

Events displayed in a grid with pagination:
- **Page size**: 20 events per page
- **Infinite scroll**: Using `useIntersection()` hook
- **Load more**: "Load More" button at bottom

```typescript
const PAGE_SIZE = 20;
```

### 4. Event Actions

For each event card:
- **Edit** - Navigate to `/events/[id]/edit`
- **Delete** - Show confirmation dialog, then delete
- **Status badge** - Show if published or draft

### 5. Real-Time Updates

Uses `useEventRealtime()` hook to:
- Subscribe to event changes in Supabase
- Auto-update event list when events change
- Reflect deletions, updates, publishes in real-time

```typescript
const event = useEventRealtime(eventId);
```

## Page Flow

```
1. Load auth state from useAuthStore
   ↓
2. Load clubs using useAdminClubSelector
   ├─ Fetch user's admin clubs
   ├─ Set default from query param (if provided)
   └─ Generate list of club names
   ↓
3. Render club selector dropdown
   ↓
4. Render tabs (All, Published, Draft)
   ↓
5. Load selected tab's events
   ├─ Fetch 20 events from API
   ├─ Apply tab filter (all/published/draft)
   └─ Show paginated list
   ↓
6. Watch for scroll to bottom (useIntersection)
   ├─ If scrolled near bottom:
   └─ Load next 20 events
   ↓
7. Show delete dialog on delete action
   ├─ User confirms deletion
   ├─ Delete event from API
   ├─ Remove from list
   └─ Show success toast
```

## Components Used

- `<AdminClubSelector />` - Club dropdown selector
- `<EventDisplayCard />` - Individual event card
- `<CreateEventModal />` - Modal to create new event
- `<AlertDialog />` - Delete confirmation dialog
- `<Tabs />` - Tab filter selector

## API Integration

### Fetching Events

Events are fetched via API (not documented in detail here, but typically):
- Endpoint: `GET /api/events?clubId=xxx&status=draft&page=1&limit=20`
- Returns: Paginated list of events
- Filters: By club, by status (draft/published)

### Deleting Events

- Endpoint: `DELETE /api/events/[id]`
- Requires: Event ownership or club admin access
- Response: Success/error message

## Hooks Used

### `useAdminClubSelector(initialClubId?)`

Manages club selection state:
```typescript
const {
  clubs,              // Array of clubs user is admin of
  loading,            // Loading state
  selectedClubId,     // Currently selected club ID
  setSelectedClubId,  // Update selection
} = useAdminClubSelector(initialClubId);
```

See [docs/lib/README.md](../../lib/README.md#custom-hooks) for full hook documentation.

### `useEventRealtime(eventId)`

Subscribes to real-time event changes:
```typescript
const event = useEventRealtime(eventId);
// Returns latest event data when changed in Supabase
```

### `useIntersection(ref)`

Detects when element scrolls into view (for infinite scroll):
```typescript
const isVisible = useIntersection(bottomRef);
// Trigger load more when visible
```

## State Management

Uses local component state:
- `selectedClubId` - Currently selected club
- `currentTab` - Currently active tab (all/published/draft)
- `events` - List of events
- `loading` - Loading state for events
- `page` - Current page number
- `deleteDialogOpen` - Show/hide delete confirmation
- `confirmDeleteEventId` - Event ID to delete

## Common Issues & Solutions

### ❌ Problem: Events not showing after creation

**Possible Cause**: Event created but not fetched yet (real-time update failed)

**Solution**:
1. Check if `useEventRealtime()` is subscribed correctly
2. Verify event appears in database
3. Refresh page manually
4. Check for Supabase RLS policy blocking reads

### ❌ Problem: Delete button does nothing

**Possible Cause**: Missing club admin permissions

**Solution**:
1. Verify user is admin of the club
2. Check API response for errors (look at console/network tab)
3. Verify event exists

### ❌ Problem: Events from wrong club showing

**Possible Cause**: Invalid `club_id` being used for fetch

**Solution**:
1. Check `selectedClubId` is being passed to API
2. Verify club selector is working
3. Check API filters events correctly by club

### ✅ What Not To Do

❌ **DON'T** bypass club_id check in API calls  
❌ **DON'T** fetch events for all clubs (should be filtered by selected club)  
❌ **DON'T** assume user can delete any event (verify club admin)  

## Performance Considerations

1. **Pagination**: Don't load all events at once (use pagination)
2. **Real-time**: Don't subscribe to events user can't access
3. **Debounce**: Tab/club changes trigger new fetches (consider debouncing)

## Testing Checklist

- [ ] Can select different clubs and see their events
- [ ] Events filter by tab (all/published/draft)
- [ ] Can delete event with confirmation
- [ ] Real-time updates show when event is updated elsewhere
- [ ] Pagination loads more events correctly
- [ ] Infinite scroll triggers on scroll to bottom
- [ ] Create event modal opens and closes

---

**Last Updated**: March 14, 2026
