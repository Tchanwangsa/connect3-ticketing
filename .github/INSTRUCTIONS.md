# Custom Instructions Structure

This repository uses GitHub Copilot's custom instructions pattern to ensure consistent development practices.

## File Structure

### 📋 Repository-Wide Instructions

**File**: `.github/copilot-instructions.md`

Applies to all files in the repository. Contains:
- Core principles (zero duplication, read docs, use existing utilities)
- Critical constraints (timezone handling, club-scoped ops, Instagram imports)
- Path-specific guidance references

### 🎯 Path-Specific Instructions

**Location**: `.github/instructions/`

These apply when Copilot works on files matching the path.

#### `pages.instructions.md` - For `app/` (pages & routes)
- Server vs client components
- Authentication & authorization patterns
- Query parameter handling
- Redirects & ISR

#### `components.instructions.md` - For `components/`
- Component structure & naming
- TypeScript interfaces for props
- Breaking down large components
- Reusable component extraction

#### `api.instructions.md` - For `app/api/`
- Route structure
- Authentication & authorization
- Input validation
- Timezone handling
- Error response format
- Complete example routes

#### `lib.instructions.md` - For `lib/`
- API client functions (no direct fetch!)
- Custom hooks creation rules
- Pure utilities
- Type definitions (no duplication)
- Supabase client selection

### 🤖 Agent Instructions

**File**: `AGENTS.md` (root)

For AI agents working on the codebase:
- Quick start checklist
- Critical constraints with examples
- Core principles
- Important pages warnings
- Implementation checklist
- When stuck: search & documentation strategy

## How Copilot Uses These Files

When you ask Copilot for help:

1. **Checks repository-wide instructions** (`.github/copilot-instructions.md`)
2. **Checks path-specific instructions** (`.github/instructions/`) if applicable
3. **Applies both** if working in a specific path

### Example

If working on `components/events/EventForm.tsx`:
- ✅ Uses `.github/copilot-instructions.md` (repo-wide principles)
- ✅ Uses `.github/instructions/components.instructions.md` (component-specific)
- ✓ Combines both for comprehensive guidance

If working on `app/api/events/route.ts`:
- ✅ Uses `.github/copilot-instructions.md` (repo-wide principles)
- ✅ Uses `.github/instructions/api.instructions.md` (API-specific)
- ✓ Combines both for API route guidance

## Supporting Documentation

These custom instructions reference comprehensive documentation in `docs/`:

- **[docs/DOCUMENTATION.md](../docs/DOCUMENTATION.md)** - Architecture overview
- **[docs/api/PATTERNS.md](../docs/api/PATTERNS.md)** - Critical API patterns
- **[docs/pages/README.md](../docs/pages/README.md)** - All pages reference
- **[docs/lib/README.md](../docs/lib/README.md)** - Available utilities/hooks
- **[docs/lib/TYPES.md](../docs/lib/TYPES.md)** - Centralized types

Complex pages have dedicated documentation:
- **[docs/pages/dashboard-club/](../docs/pages/dashboard-club/)** - Org vs user quirk
- **[docs/pages/event-detail/](../docs/pages/event-detail/)** - ISR & static generation
- **[docs/pages/event-edit/](../docs/pages/event-edit/)** - Authorization pattern
- **[docs/pages/event-create/](../docs/pages/event-create/)** - Server redirect
- **[docs/pages/dashboard-events/](../docs/pages/dashboard-events/)** - Pagination & filtering

## Key Principles

All instructions emphasize:

1. **Zero Duplication** - Extract utilities, hooks, types, components
2. **Use Existing Code** - Search before creating new
3. **Follow Patterns** - Use established patterns in codebase
4. **Document Everything** - Update docs when implementing
5. **Timezone Awareness** - Always convert to UTC for events
6. **Club Admin Verification** - Always verify, never fall back
7. **Type Safety** - Centralized types in lib/types/

## For New Team Members

📚 **Read in this order:**

1. This file (understand the custom instructions structure)
2. `.github/copilot-instructions.md` (core principles)
3. `docs/DOCUMENTATION.md` (5-minute overview)
4. Path-specific instructions (`.github/instructions/`)
5. Relevant docs (`docs/api/`, `docs/components/`, `docs/lib/`, `docs/pages/`)

---

**Last Updated**: March 14, 2026
