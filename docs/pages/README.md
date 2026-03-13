# Pages Documentation

This document outlines all pages in the Connect3 Ticketing application, their purposes, routes, and key behaviors.

## Quick Reference

| Route | File | Purpose | Auth Required | Type |
|-------|------|---------|---|------|
| `/` | `app/page.tsx` | Home/Landing/Dashboard router | No | Client |
| `/auth/callback` | `app/auth/callback/route.ts` | Supabase auth callback | No | API Route |
| `/auth/error` | `app/auth/error/page.tsx` | Auth error page | No | Client |
| `/dashboard/club` | `app/dashboard/club/page.tsx` | Club management panel | Yes | Client |
| `/dashboard/events` | `app/dashboard/events/page.tsx` | Organization events list | Yes | Client |
| `/dashboard/manage` | `app/dashboard/manage/page.tsx` | Club selector & management | Yes | Client |
| `/events/create` | `app/events/create/page.tsx` | Create new event (draft) | Yes | Server |
| `/events/[id]` | `app/events/[id]/page.tsx` | Event detail page (public) | No | Server |
| `/events/[id]/checkout` | `app/events/[id]/checkout/page.tsx` | Ticketing checkout | No | Server |
| `/events/[id]/edit` | `app/events/[id]/edit/page.tsx` | Event editor | Yes* | Server + Client |

*Auth: Event creator or club admin only

## Public Pages

### `/` — Home / Landing / Dashboard Router

**File**: `app/page.tsx`  
**Component**: Client component  
**Auth**: Not required

**Purpose**: 
- Entry point to the application
- Routes authenticated users to their appropriate dashboard
- Shows landing page to unauthenticated users

**Logic**:
1. Checks auth status using `useAuthStore`
2. Shows loading spinner while fetching auth status
3. If not authenticated: Shows landing page with login button
4. If authenticated: Routes based on account type:
   - **Organization account**: Shows `<OrgDashboard />`
   - **Regular user**: Shows `<UserDashboard />`

**Key States**:
- `loading` - Auth fetch in progress
- `user` - Authenticated user from Supabase
- `profile` - User profile from database
- `isOrganisation()` - Check if org account

---

### `/auth/callback` — Supabase Auth Callback

**File**: `app/auth/callback/route.ts`  
**Type**: API Route  
**Auth**: Not required

**Purpose**: 
Handles OAuth callback from Supabase auth provider (Google, GitHub, etc.)

**Flow**:
1. Extracts tokens and code from query params
2. If access + refresh tokens provided: Sets session directly
3. If code provided: Exchanges code for session
4. Redirects to requested `next` param or `/`

**Parameters**:
- `?access_token=xxx` - Direct token from provider
- `?refresh_token=xxx` - Refresh token
- `?code=xxx` - Authorization code (OAuth)
- `?next=/path` - Redirect after auth success

---

### `/auth/error` — Auth Error Page

**File**: `app/auth/error/page.tsx`  
**Component**: Client component  
**Auth**: Not required

**Purpose**: 
Shows user-friendly error message when authentication fails.

**Displays**:
- Error heading
- Generic error message
- Link to home page

---

### `/events/[id]` — Event Detail / Public Preview

**File**: `app/events/[id]/page.tsx`  
**Component**: Server component  
**Auth**: Not required  
**Visibility**: Public (published events only)

**Purpose**:
Display public event details with ticketing options.

**Key Features**:

1. **Static Generation (ISR)**:
   - Pre-renders all published events at build time using `generateStaticParams()`
   - Revalidates every 60 seconds (ISR)
   - On-demand generation for new events (if `dynamicParams=true`)

2. **SEO Optimization**:
   - `generateMetadata()` creates dynamic Open Graph tags
   - Uses event image/title/description for social sharing
   - Supports Twitter card meta tags

3. **Components**:
   - `<ServerEventPreviewDisplay />` - Event details display
   - `<TicketingButton />` - Ticket purchase button

**Notable Behavior**:
- 404 if event not found OR not published
- Uses server-side data fetching for performance
- SEO-optimized for social media sharing

**See Also**: [docs/pages/event-detail/README.md](./event-detail/README.md)

---

### `/events/[id]/checkout` — Ticketing Checkout

**File**: `app/events/[id]/checkout/page.tsx`  
**Component**: Server component  
**Auth**: Not required

**Purpose**:
Ticketing checkout form for purchasing event tickets.

**Logic**:
1. Fetches event (404 if not found)
2. Checks if ticketing is enabled for event
3. Shows checkout form if enabled, 404 otherwise

**Component**: `<CheckoutForm />` (renders in preview mode)

---

## Authenticated Pages

### `/dashboard/events` — Organization Events List

**File**: `app/dashboard/events/page.tsx`  
**Component**: Client component  
**Auth**: Yes (organization admin only)

**Purpose**:
Display list of events for organization/club admin.

**Features**:
- Tab filtering: "All", "Published", "Draft"
- Pagination (20 events per page)
- Event cards with status, edit, delete actions
- "Create Event" button
- Delete confirmation dialog
- Real-time updates via `useEventRealtime()`

**Admin Club Selector**:
- Uses `useAdminClubSelector()` hook
- Allows switching between managed clubs
- Defaults to first club or query param `?club_id=xxx`

**Key Components**:
- `<AdminClubSelector />` - Club switcher
- `<EventDisplayCard />` - Event card
- `<CreateEventModal />` - New event modal

**See Also**: [docs/pages/dashboard-events/README.md](./dashboard-events/README.md)

---

### `/dashboard/club` — Club Management

**File**: `app/dashboard/club/page.tsx`  
**Component**: Client component  
**Auth**: Yes (club admin or org account)

**Purpose**:
Manage club settings, members, and permissions.

**Complex Authentication Logic**:

This page handles TWO types of accounts differently:

1. **Organization accounts** (`isOrganisation() === true`):
   - Manage their own organization
   - Club ID = their user.id
   - No query param needed

2. **Regular users (club admins)** (`isOrganisation() === false`):
   - Must provide `?club_id=xxx` query param
   - Must verify they are a club admin for that club
   - Redirects to `/` if not verified

**Verification Flow**:
1. Check auth status
2. Determine club ID (from query param or user.id)
3. If not org: Verify club admin access
4. If not verified: Redirect to home

**Components**:
- `<AdminManagePanel />` - Club management UI

**See Also**: [docs/pages/dashboard-club/README.md](./dashboard-club/README.md)

---

### `/dashboard/manage` — Manage Clubs

**File**: `app/dashboard/manage/page.tsx`  
**Component**: Client component  
**Auth**: Yes

**Purpose**:
Select and manage clubs (for users with multiple clubs).

**Features**:
- Club selector dropdown
- Create new event modal
- Admin panel for selected club
- "Create Organization" card (if no clubs)

**Uses**:
- `useAdminClubSelector()` - Track selected club
- `useAuthStore()` - Auth state
- Query param: `?club_id=xxx` to set default selection

---

## Event Creation & Editing

### `/events/create` — Create Event (Server-Side Redirect)

**File**: `app/events/create/page.tsx`  
**Component**: Server component  
**Auth**: Yes  
**Behavior**: Redirect only (no UI)

**Purpose**:
Create a minimal draft event and redirect to editor.

**Flow**:
1. Check authentication (redirect to `/` if not signed in)
2. Resolve club (if `?club_id=xxx` provided)
3. Create minimal draft event in DB
4. Redirect to `/events/[id]/edit`

**Query Parameters**:
- `?club_id=xxx` - Create event under this club (user must be admin)
- `?ig_post_id=xxx` - Link to Instagram post (future use)
- `?source=xxx` - Tracking source (default: "connect3")

**Key Logic**:
- Uses `resolveManagedProfileId()` to get acting profile
- Handles both org accounts and club admin accounts
- Redirects home if club_id validation fails

**See Also**: [docs/pages/event-create/README.md](./event-create/README.md)

---

### `/events/[id]/edit` — Event Editor

**File**: `app/events/[id]/edit/page.tsx` + `EditEventClient.tsx`  
**Component**: Server component (auth check) + Client component (editor)  
**Auth**: Yes (event creator or club admin)

**Purpose**:
Edit event details, ticketing, and publishing.

**Auth Check Flow** (server-side):
1. Verify user is logged in
2. Check if user can edit event:
   - Event creator (owns event)
   - Club admin (if event is club-owned)
   - Organization (if org-owned event)
3. If not authorized: Show `<Unauthorized />`
4. If not found: Show 404
5. Otherwise: Render editor

**Editor Features**:
- Event details form
- Ticketing configuration
- Image uploads
- Publish/draft toggle
- Auto-save functionality

**Components**:
- `<EditEventClient />` - Client-side editor
- `<Unauthorized />` - Permission denied page

**See Also**: [docs/pages/event-edit/README.md](./event-edit/README.md)

---

## Page Routes Diagram

```
/                          (public landing/dashboard router)
├── /auth/
│   ├── /callback          (OAuth callback)
│   └── /error             (auth error)
├── /dashboard/
│   ├── /club              (club management)
│   ├── /events            (events list)
│   └── /manage            (club selector)
└── /events/
    ├── /create            (create draft & redirect)
    ├── /[id]              (public event detail)
    │   ├── /checkout      (ticketing checkout)
    │   └── /edit          (event editor)
```

---

## Key Patterns Across Pages

### Authentication

- **Client pages**: Check auth with `useAuthStore()`, redirect to `/` if needed
- **Server pages**: Use `getUser()` from Supabase, redirect before rendering

### Authorization

- **Club-scoped operations**: Verify club admin using `isClubAdmin()` or `resolveManagedProfileId()`
- **Event-scoped operations**: Check event ownership/club membership

### Loading States

- Use Supabase client `loading` state or manual `useState`
- Show spinner while fetching
- Disable interactions while loading

### Error Handling

- Not found: Use `notFound()` from Next.js
- Unauthorized: Show custom component
- Validation errors: Use toast notifications

---

**Last Updated**: March 14, 2026
