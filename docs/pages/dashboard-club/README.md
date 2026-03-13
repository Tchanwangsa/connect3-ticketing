# Dashboard / Club Management

**Route**: `/dashboard/club`  
**File**: `app/dashboard/club/page.tsx`  
**Auth**: Yes (club admin or org account)

## CRITICAL QUIRK: Organization vs Regular User Handling

This page has **different logic** depending on the user's account type. This is important to understand when modifying the page.

### Two Account Types

#### 1. Organization Account (`isOrganisation() === true`)

An **organization account** represents a group/club itself.

- **User Type**: Organization (not a regular person)
- **ClubId**: Always `user.id` (they ARE the club)
- **Query Param**: Not needed (`?club_id` is ignored)
- **Flow**:
  - No verification needed (they own everything)
  - Load club management directly
  - Manage organization members and settings

**Example**: "The Photography Club" is registered as an organization account. When "The Photography Club" logs in, they see their own club management.

#### 2. Regular User (Club Admin) (`isOrganisation() === false`)

A **regular user** who is an admin of one or more clubs.

- **User Type**: Individual person
- **ClubId**: Must come from `?club_id=xxx` query param
- **Query Param**: REQUIRED
- **Flow**:
  1. Extract `club_id` from query param
  2. Verify user is admin of that club
  3. If not verified: Redirect to home
  4. If verified: Load club management for that club

**Example**: "Alice" is a regular user and admin of "The Photography Club". When Alice clicks "Manage Club", the URL is `/dashboard/club?club_id=<club_id>`. Alice's access is verified before showing the management panel.

### Implementation Details

```typescript
// Determine club ID
const clubId = isOrg ? (user?.id ?? null) : searchParams.get("club_id");

// Org accounts skip verification
if (isOrg) return;

// Regular users must have club_id param
if (!clubId) {
  router.replace("/");
  return;
}

// Verify club admin access
const { data: access } = await supabase
  .from('club_admins')
  .select()
  .eq('club_id', clubId)
  .eq('user_id', user.id)
  .single();

if (!access) {
  toast.error('Access denied');
  setVerified(false);
  return;
}

setVerified(true); // User is admin of this club
```

## Page Flow

```
1. Check auth (redirect if not signed in)
   ↓
2. Wait for auth to load
   ↓
3. Determine account type (org or regular user)
   ↓
4a. If org: Load club management
   ↓
4b. If regular: Check query param and verify club admin access
   ├─ No club_id param? → Redirect to /
   ├─ Not admin? → Redirect to /
   └─ Is admin? → Load club management
   ↓
5. Render AdminManagePanel
```

## Components Used

- `<AdminManagePanel />` - The main club management UI
- Tabs for different management sections
- Loading spinner during verification

## States

```typescript
const [verified, setVerified] = useState(false);
const hasFetched = useRef(false); // Prevent double-verification
```

## Common Issues & Solutions

### ❌ Problem: User sees "Access denied" when trying to access club

**Possible Causes**:
1. Query param missing: URL should be `/dashboard/club?club_id=<clubId>`
2. User is not an admin: They need to be added to `club_admins` table
3. Club doesn't exist: Invalid `club_id`

**Solution**:
1. Check URL has `?club_id` query param
2. Verify user is in `club_admins` table with the correct club_id
3. Verify club exists in database

### ❌ Problem: Organization accounts skip verification, but shouldn't allow clubs

**Note**: Org accounts are assumed to be verified (they own everything). If you want to restrict org account permissions, that logic needs to happen at the database level (RLS policies).

### ✅ What Not To Do

❌ **DON'T** assume `user.id` is the club ID for regular users  
❌ **DON'T** skip verification for non-org users  
❌ **DON'T** create club_id from user.id for regular users  

## Related Documentation

- See [docs/api/PATTERNS.md](../../api/PATTERNS.md#2-club-scoped-operations) for club-scoped operation patterns
- See [docs/lib/auth/clubAdmin.ts](../../lib/README.md#authentication-utilities) for `isClubAdmin()` function
- See [docs/DOCUMENTATION.md#shared-patterns](../../DOCUMENTATION.md#shared-patterns) for general patterns

---

**Last Updated**: March 14, 2026
