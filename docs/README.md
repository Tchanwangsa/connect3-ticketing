# Documentation Index

Welcome to the Connect3 Ticketing developer documentation. Start here to understand how the codebase is organized and how to implement features correctly.

## 📚 Documentation Files

### 🚀 Start Here

**[DOCUMENTATION.md](./DOCUMENTATION.md)** (5 min read)
- Architecture overview
- Project structure
- Shared patterns
- Important constraints

**[../.instructions.md](../.instructions.md)** (Agent instructions)
- Agent checklist
- Core principles
- Critical constraints

### 🔌 API Development

**[api/README.md](./api/README.md)**
- All API routes
- API client functions
- Supabase client selection

**[api/PATTERNS.md](./api/PATTERNS.md)** (CRITICAL - READ THIS)
- Timezone handling (read if working with events)
- Club-scoped operations (read if working with clubs)
- Instagram imports (club admin specific)
- Auth patterns
- Error handling

### 🎨 Component Development

**[components/README.md](./components/README.md)**
- Component structure
- Component types (UI, domain, shared)
- Guidelines and patterns
- File organization
- Using hooks with components

### 📦 Utilities & Hooks

**[lib/README.md](./lib/README.md)**
- Available utilities in `lib/utils/`
- Custom hooks in `lib/hooks/`
- API client functions in `lib/api/`
- Supabase client selection

**[lib/TYPES.md](./lib/TYPES.md)**
- All shared TypeScript types
- Event types
- Ticketing types
- Rule: No type duplication

### 📄 Pages & Routes

**[pages/README.md](./pages/README.md)**
- All pages and their purposes
- Route reference table
- Page authentication requirements
- Page flows and logic

**Pages with special docs** (complex pages with quirks):
- [pages/dashboard-club/README.md](./pages/dashboard-club/README.md) - Organization vs regular user logic
- [pages/dashboard-events/README.md](./pages/dashboard-events/README.md) - Pagination, filtering, real-time updates
- [pages/event-detail/README.md](./pages/event-detail/README.md) - ISR static generation & caching
- [pages/event-create/README.md](./pages/event-create/README.md) - Server-side draft creation & redirect
- [pages/event-edit/README.md](./pages/event-edit/README.md) - Authorization & event editor

## 🎯 Quick Links by Task

### I want to...

**Create a new event feature**
→ Read [api/PATTERNS.md](./api/PATTERNS.md#1-timezone-handling-for-events) for timezone handling

**Create a new component**
→ Read [components/README.md](./components/README.md)

**Add a utility function**
→ Check [lib/README.md](./lib/README.md) first to avoid duplication

**Add a new API route**
→ Read [api/README.md](./api/README.md) and [api/PATTERNS.md](./api/PATTERNS.md)

**Handle club-scoped operations**
→ Read [api/PATTERNS.md](./api/PATTERNS.md#2-club-scoped-operations)

**Work with timezones**
→ Use `lib/utils/timezone.ts` - see [api/PATTERNS.md](./api/PATTERNS.md#1-timezone-handling-for-events) for examples

**Fetch data from API**
→ Use functions from `lib/api/` - see [lib/README.md](./lib/README.md#api-client-functions)

**Share logic between components**
→ Create a custom hook in `lib/hooks/` - see [components/README.md](./components/README.md#hook-patterns-for-components)

**Define a new type**
→ Add to `lib/types/` and document in [lib/TYPES.md](./lib/TYPES.md)

**Understand how a page works**
→ Read [pages/README.md](./pages/README.md) for all pages, then specific page docs for complex ones

**Modify /dashboard/club page**
→ Read [pages/dashboard-club/README.md](./pages/dashboard-club/README.md) first (org vs regular user logic!)

**Modify event creation or editing**
→ Read [pages/event-create/README.md](./pages/event-create/README.md) and [pages/event-edit/README.md](./pages/event-edit/README.md)

**Understand event caching/performance**
→ Read [pages/event-detail/README.md](./pages/event-detail/README.md) (ISR & static generation)

## 🚨 Critical Constraints (READ FIRST)

1. **Timezone handling**: Events must be stored in UTC, converted using event timezone
   - See: [api/PATTERNS.md#1-timezone-handling](./api/PATTERNS.md#1-timezone-handling-for-events)

2. **Club-scoped operations**: Always verify club admin access, don't fall back to user profile
   - See: [api/PATTERNS.md#2-club-scoped-operations](./api/PATTERNS.md#2-club-scoped-operations)

3. **No code duplication**: Extract utilities, hooks, types to `lib/`, shared components to `components/shared/`
   - See: [DOCUMENTATION.md#shared-patterns](./DOCUMENTATION.md#shared-patterns)

4. **No type duplication**: Define types in `lib/types/` and import everywhere
   - See: [lib/TYPES.md](./lib/TYPES.md#rule-no-type-duplication)

5. **Use existing utilities**: Don't reimplement timezone conversion, image handling, club admin checks, etc.
   - See: [lib/README.md](./lib/README.md)

## 📋 Documentation Structure

```
docs/
├── DOCUMENTATION.md        # Main architecture & patterns guide
├── README.md              # This file (index)
├── api/
│   ├── README.md         # API routes & patterns
│   └── PATTERNS.md       # Detailed implementation patterns (CRITICAL)
├── components/
│   └── README.md         # Component architecture
└── lib/
    ├── README.md         # Utilities, hooks, API clients
    └── TYPES.md          # Shared TypeScript types
```

## 🔄 Agents: Before You Code

1. Read the task/requirement
2. Read [DOCUMENTATION.md](./DOCUMENTATION.md) (5 min)
3. Read relevant specific doc:
   - Components? → [components/README.md](./components/README.md)
   - API routes? → [api/README.md](./api/README.md) + [api/PATTERNS.md](./api/PATTERNS.md)
   - Utilities? → [lib/README.md](./lib/README.md)
   - Types? → [lib/TYPES.md](./lib/TYPES.md)
4. Search codebase for existing implementations
5. Implement using existing patterns
6. Update documentation if adding new patterns

## ✅ Before Committing

- [ ] Checked docs for existing utilities/hooks/types
- [ ] No code duplication
- [ ] Timezone handling correct (if events involved)
- [ ] Club-scoped access control verified (if clubs involved)
- [ ] Updated documentation
- [ ] Followed patterns from `docs/`

---

**Last Updated**: March 14, 2026

💡 **Tip**: Keep `.instructions.md` and `docs/DOCUMENTATION.md` handy while coding. They contain the core principles and patterns used throughout this project.
