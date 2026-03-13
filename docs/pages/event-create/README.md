# Event Creation / Draft Initial Setup

**Route**: `/events/create`  
**File**: `app/events/create/page.tsx`  
**Auth**: Yes  
**Behavior**: Server-side redirect (no UI)

## Purpose

Create a minimal draft event and redirect to the event editor. This is **not** a user-facing page — it's a utility page that quickly sets up a new event.

## CRITICAL BEHAVIOR: Redirect-Only Page

This page:
1. ✅ Has server-side logic
2. ✅ Creates a database record
3. ✅ Redirects to another page
4. ❌ Does NOT show any UI

```
User clicks "Create Event"
         ↓
Browser navigates to /events/create?club_id=xxx
         ↓
Server creates draft event
         ↓
Server redirects to /events/[id]/edit
         ↓
User sees event editor (not /events/create page)
```

## Query Parameters

### `?club_id=xxx`
**Purpose**: Create event under a specific club  
**Required**: For club admins only  
**Behavior**: Verifies user is admin of this club before creating

**Example**: `/events/create?club_id=club-123`

### `?ig_post_id=xxx`
**Purpose**: Link created event to an Instagram post  
**Required**: No (optional)  
**Behavior**: Stores reference in `ig_post_id` field

**Example**: `/events/create?ig_post_id=insta-post-456`

### `?source=xxx`
**Purpose**: Track where event creation was triggered  
**Required**: No (defaults to "connect3")  
**Behavior**: Stores in `source` field for analytics

**Example**: `/events/create?source=instagram-sync`

### `?next=/path`
**Purpose**: Redirect after creation (if not editing)  
**Required**: No  
**Behavior**: Used by auth callback pattern

## Page Flow

```
1. Check user is authenticated
   ├─ Not logged in?
   └─ Redirect to /
   
2. Extract query parameters
   ├─ ?club_id=xxx (optional)
   ├─ ?ig_post_id=xxx (optional)
   └─ ?source=xxx (optional, defaults: "connect3")

3. If club_id provided:
   ├─ Call resolveManagedProfileId(clubId, userId)
   ├─ Resolves to club profile ID if user is admin
   ├─ Returns null if user not admin
   ├─ If null → Redirect to /dashboard/events
   └─ If valid → Use as creator profile

4. Create minimal draft event
   ├─ Generate 21-char nanoid as event ID
   ├─ Create record in events table:
   │  ├─ id: generated nanoid
   │  ├─ name: "Untitled Event"
   │  ├─ created_by: user ID (or club profile ID)
   │  ├─ published: false (draft)
   │  ├─ ig_post_id: if provided
   │  └─ source: tracking source
   └─ If creation fails → Redirect to /dashboard/events

5. Redirect to /events/[id]/edit
   └─ User sees event editor
```

## Key Functions Used

### `resolveManagedProfileId(clubId, userId)`

**What it does**:
- Checks if user is admin of club
- Returns the club profile ID (acting profile)
- Or returns null if not authorized

**Usage**:
```typescript
const creatorProfileId = await resolveManagedProfileId(clubId, user.id);
if (clubId && !creatorProfileId) {
  redirect("/dashboard/events"); // User not admin of club
}
```

**Why**: When creating events for a club, we need to store the club profile as the creator (not the individual user).

### `nanoid(21)`

Generates a 21-character unique ID for the event:
```typescript
const eventId = nanoid(21); // e.g., "abc123def456ghi789jkl"
```

## Typical Flow

### Scenario 1: Organization Account Creating Event

```
User: Organization account
URL: /events/create
↓
1. Authenticate ✓
2. No club_id param (org users don't need it)
3. Create draft with user.id as creator
4. Redirect to /events/[id]/edit
Result: Org can edit event
```

### Scenario 2: Club Admin Creating Event for Club

```
User: Club admin (regular user)
URL: /events/create?club_id=club-777
↓
1. Authenticate ✓
2. Resolve club_id to club profile ID
3. Verify user is admin of club_id ✓
4. Create draft with club profile ID as creator
5. Redirect to /events/[id]/edit
Result: Event shows under club's events
```

### Scenario 3: Club Admin (But Not For This Club)

```
User: Club admin (of club-111)
URL: /events/create?club_id=club-777
↓
1. Authenticate ✓
2. Try to resolve club_id club-777
3. User is NOT admin of club-777 ✗
4. Redirect to /dashboard/events
Result: User cannot create events for clubs they don't administer
```

### Scenario 4: Unauthenticated User

```
User: Not logged in
URL: /events/create?club_id=club-777
↓
1. Check auth ✗
2. Redirect to /
Result: User must log in first
```

## Response Codes

| Status | Meaning |
|--------|---------|
| `200` | Event created & redirected ✓ |
| `302` | Redirect (to editor or home) |
| `401` | Not authenticated |
| `403` | Authenticated but not club admin |
| `500` | Server error during creation |

## Common Issues & Solutions

### ❌ Problem: Keep getting redirected to /dashboard/events

**Possible Causes**:
1. User not admin of requested club
2. club_id query param missing (for non-org users)
3. club_id doesn't exist

**Solution**:
1. Verify user is admin of the club
2. Add `?club_id=xxx` to URL
3. Verify club_id is correct

### ❌ Problem: Getting redirected to home /

**Possible Causes**:
1. Not authenticated

**Solution**:
1. Log in first
2. Click "Create Event" button (should add auth automatically)

### ❌ Problem: Event created but instantly redirected away

**Expected Behavior**: This is normal!

**Why**: Page is designed to create and redirect immediately. You should see the event editor next.

**If not seeing editor**:
1. Check browser console for errors
2. Verify event was actually created (check dashboard)
3. Check event ID in URL is valid

### ✅ What Not To Do

❌ **DON'T** show a form on this page  
❌ **DON'T** skip club admin verification  
❌ **DON'T** allow creation without authentication  
❌ **DON'T** create full event data (only minimal draft)  

## Related Pages

- [docs/pages/event-edit/README.md](../event-edit/README.md) - Event editor (where user lands after create)
- [docs/pages/dashboard-events/README.md](../dashboard-events/README.md) - View created events

## Testing Checklist

- [ ] Org account can create event
- [ ] Club admin can create event for their club
- [ ] Club admin cannot create event for other club
- [ ] Unauthenticated user redirected to home
- [ ] Event created with minimal data
- [ ] User redirected to editor after creation
- [ ] Instagram link preserved if ig_post_id provided
- [ ] Source tracking parameter stored correctly

---

**Last Updated**: March 14, 2026
