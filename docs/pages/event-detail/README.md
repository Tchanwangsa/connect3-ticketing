# Event Detail / Public Preview

**Route**: `/events/[id]`  
**File**: `app/events/[id]/page.tsx`  
**Auth**: Not required  
**Visibility**: Public (published events only)

## Purpose

Display public event details with ticketing options. This is a **public-facing** page that shows event information to potential ticket buyers.

## CRITICAL QUIRK: Static Generation with Revalidation (ISR)

This page uses **Incremental Static Regeneration (ISR)** for performance and SEO. This is important when modifying how events are loaded or cached.

### How It Works

#### Build Time: Pre-render All Published Events

```typescript
export async function generateStaticParams() {
  const ids = await getAllPublishedEventIds();
  return ids.map((id) => ({ id }));
}
```

**What happens**:
1. At build time, fetch all published event IDs
2. Pre-render HTML for **every published event**
3. Result: Static HTML files served instantly (very fast)

#### On-Demand: New Events Generated Dynamically

```typescript
export const revalidate = 60;
export const dynamicParams = true; // default
```

**What happens**:
- `dynamicParams = true` means: If user visits `/events/[id]` for an **unpublished** or **new** event not in static params
- The page is generated on-demand (not pre-built)
- Result: Takes longer for first visitor to new event, but then cached

#### Revalidation: Cache Expires Every 60 Seconds

```typescript
export const revalidate = 60;
```

**What happens**:
- Event page is cached for 60 seconds
- After 60 seconds, on next request: Page is regenerated
- Result: Events stay fresh without full rebuild (old event without revalidating every second)

### Flow Diagram

```
Build Time (Hosting: Vercel/etc):
  1. Fetch all published event IDs
  2. Pre-render HTML for each
  3. Upload to CDN
  
User Visit (First Time):
  1. Browser requests /events/abc123
  2. Server serves pre-built HTML from CDN ✅ Fast!
  
User Visit (New Unpublished Event):
  1. Browser requests /events/xyz789 (not in static params)
  2. Server generates HTML on-demand ⏳ Slower
  3. Cache in CDN for 60 seconds
  
User Visit (After 60 Seconds):
  1. Browser requests /events/abc123
  2. 60 seconds passed, cache expired
  3. Server regenerates HTML ⏳ Slower
  4. Serve new HTML and re-cache ✅ Fast again for next 60s
```

## SEO & Open Graph

This page generates dynamic metadata for social media sharing:

```typescript
export async function generateMetadata({ params }) {
  const { id } = await params;
  const event = await fetchEventServer(id);

  if (!event) {
    return { title: "Event Not Found | Connect3" };
  }

  return {
    title: `${event.name} | Connect3`,
    description: event.description?.slice(0, 160),
    openGraph: {
      image: event.images[0]?.url || event.thumbnail,
      // ... social sharing metadata
    },
  };
}
```

**Why this matters**:
- When shared on Twitter/Facebook, correct event image shows
- Event title and description appear in shared preview
- Improves click-through from social media

## Components

### `<ServerEventPreviewDisplay />`

Server component displaying:
- Event title, description, date/time
- Event image gallery
- Location
- Organizer info
- Ticket info (if ticketing enabled)

### `<TicketingButton />`

Button that links to checkout if ticketing is enabled:
```
/events/[id]/checkout
```

## Page Flow

```
1. Extract event ID from URL param
   ↓
2. Fetch event server-side using fetchEventServer()
   ↓
3. If event not found or not published:
   └─ Return 404 (notFound())
   ↓
4. Generate SEO metadata
   ├─ Event image for OG tags
   ├─ Event title/description
   └─ Sharing metadata
   ↓
5. Render event preview
   ├─ Event details
   ├─ Image gallery
   ├─ Ticketing button (if enabled)
   └─ Share buttons
```

## Data Fetching

Uses `fetchEventServer()` from `lib/api/fetchEventServer.ts`:

```typescript
import { fetchEventServer } from '@/lib/api/fetchEventServer';

const event = await fetchEventServer(id);
if (!event) {
  notFound(); // Returns 404
}
```

**Why server-side fetch**:
- Runs on server (client doesn't see API keys)
- Data included in HTML (good for SEO)
- Faster than client-side fetch

## Verification Checklist

### ✅ For Event Visibility

- [ ] Event is published (not draft)
- [ ] Event has all required fields
- [ ] Event exists in database

### ✅ For SEO

- [ ] Event title appears in `<title>` tag
- [ ] Event description in meta tags
- [ ] Event image in Open Graph meta tags
- [ ] Event URL is canonical (for sharing)

### ✅ For Performance

- [ ] Page builds at build time for all published events
- [ ] Page regenerates every 60 seconds
- [ ] New unpublished events generate on-demand
- [ ] CDN caches page correctly

## Common Issues & Solutions

### ❌ Problem: Event not showing even though it's published

**Possible Causes**:
1. Event not in database
2. Event is draft (not published)
3. Event data missing critical fields

**Solution**:
1. Verify event exists in database
2. Verify `published = true` in DB
3. Check all required fields are filled

### ❌ Problem: Old event data showing (stale cache)

**Possible Cause**: ISR cache not invalidated

**Solution**:
1. Wait 60 seconds for automatic revalidation
2. Or manually deploy/rebuild to invalidate cache
3. Check Vercel dashboard for ISR status

### ❌ Problem: Event image not showing on social media

**Possible Cause**: Open Graph meta tags not set correctly

**Solution**:
1. Check event has image in database
2. Verify image URL is accessible
3. Use social media debuggers (Twitter card validator, etc.)

### ❌ Problem: New event doesn't appear immediately

**Expected Behavior**: New event takes a moment to appear

**Why**:
- New event not in pre-built static params
- Must be generated on-demand (slower first time)
- Then cached for 60 seconds

**Solution**: Pre-publish events before announcing (so they build at next rebuild)

### ✅ What Not To Do

❌ **DON'T** set `revalidate` to 0 (disables ISR, always regenerates)  
❌ **DON'T** set `revalidate` to very low number (very high server load)  
❌ **DON'T** fetch unpublished events (404 them instead)  
❌ **DON'T** put secrets in client metadata (ISR generates HTML on server)  

## Related Pages

- [docs/pages/event-edit/README.md](../event-edit/README.md) - Event editor (draft)
- [docs/pages/event-detail/README.md](../event-detail/README.md) - Checkout (ticketing)

## ISR Configuration Tips

**Change cache time** (currently 60 seconds):
```typescript
export const revalidate = 300; // Cache for 5 minutes
```

**Disable ISR** (always regenerate):
```typescript
export const revalidate = 0; // ⚠️ High server cost
```

**Enable static-only** (never regenerate):
```typescript
export const dynamicParams = false; // Only pre-built events appear
```

---

**Last Updated**: March 14, 2026
