# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ping Pong Party Digital Scoreboard is a real-time table tennis scoring and tracking application. This is a **complete rewrite** moving from SPA (React + Vite) to **Astro SSR** while preserving proven domain logic from the previous implementation.

**Key Requirements**:
- Migrate from SPA to Astro for better SEO and performance
- Maintain existing ELO rating system (K-factor 32)
- Preserve match creation and scoring logic
- Keep keyboard-driven kiosk mode functionality
- Add dedicated `/podium` route for hallway display
- Auth0 authentication on ALL operations
- Mobile-friendly PWA with push notifications

**Previous Codebase**: `C:\devGithub\hackathon-2025-ping-pong-party\stacks\digital-scoreboard\`
- **Do NOT copy SPA-specific code** (React components, Vite config, SSE client logic)
- **DO reuse domain logic** from `.domain.ts` files (ELO calculations, match validation, business rules)

## Technology Stack

- **Frontend**: Astro 5 + Tailwind CSS + React 18
- **Backend**: Node.js (Astro SSR with @astrojs/node adapter)
- **Authentication**: Auth0 (ID token required on ALL operations)
- **Database**: SQLite (sql.js) with debounced persistence
- **PWA**: Mobile-optimized progressive web app
- **CI/CD**: Dagger + GitHub Actions
- **Releases**: semantic-release (automated)
- **Development Environment**: Devenv (Nix-based)
- **Architecture**: Multi-repository (separate repos per plugin)

### React Integration

Astro supports React components through the `@astrojs/react` integration. You can use React components alongside Astro components:

**Client Directives** (when to hydrate React components):
- `client:load` - Hydrate immediately on page load (for interactive UI)
- `client:idle` - Hydrate when browser is idle
- `client:visible` - Hydrate when component enters viewport
- `client:only="react"` - Only render on client (skip SSR)

**Example**:
```astro
---
import MyReactComponent from '../components/MyReactComponent';
---

<!-- Interactive React component -->
<MyReactComponent client:load initialValue={0} />
```

**When to Use**:
- ✅ Interactive components (forms, counters, modals)
- ✅ State management (useState, useEffect)
- ✅ Complex UI with frequent updates
- ❌ Static content (use Astro components instead for better performance)

## Development Commands

### Environment Setup

```bash
# Initialize development environment (Nix/Devenv)
devenv shell

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### Development Server

```bash
# Start Astro dev server (port 4321)
npm run dev

# Type checking
npm run type-check
```

### Build and Production

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Start production server
npm start
```

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Architecture

### Vertical Slice Architecture (from Previous Implementation)

**CRITICAL**: Maintain vertical slice pattern from the original codebase:

- Each feature keeps server + client + types together in one folder
- No separation into `backend/` or `frontend/` directories
- Pattern: Each feature has `.domain.ts` (business logic + repository), `.types.ts`, and Astro page/component

**Folder Structure**:

```
src/
├── server/
│   ├── features/
│   │   ├── players/        # Player CRUD, Gravatar integration
│   │   │   ├── players.domain.ts    # DB access + business logic
│   │   │   ├── players.types.ts     # Zod schemas
│   │   │   └── players.validation.ts
│   │   ├── matches/        # Match management, scoring
│   │   │   ├── matches.domain.ts    # Match CRUD, validation
│   │   │   └── matches.types.ts
│   │   ├── ratings/        # ELO calculations
│   │   │   ├── ratings.domain.ts    # ELO logic (K-factor 32)
│   │   │   └── season.domain.ts     # Season leaderboards
│   │   └── kiosk/          # Kiosk-specific BFF logic
│   ├── db/
│   │   └── index.ts        # SQLite, migrations, persistence
│   └── shared/
│       ├── types.ts        # PlayerId, MatchId, shared interfaces
│       └── utils.ts        # generateId(), now()
├── pages/                  # Astro routes
│   ├── index.astro         # Home page
│   ├── kiosk.astro         # Keyboard-driven scoreboard
│   ├── podium.astro        # Today's top players (NEW)
│   └── api/                # API endpoints
│       ├── players/
│       ├── matches/
│       └── kiosk/
├── layouts/
│   └── Layout.astro        # Base layout
├── components/             # Reusable Astro/React components
└── middleware/             # Auth0 middleware
```

### Domain Boundaries

**From Previous Implementation - PRESERVE THESE RULES**:

- **Feature ownership**: Each feature owns its domain logic, validation, and data access
- **No shared domain logic**: Domain knowledge stays within feature boundaries
- **Database access**: All DB operations ONLY in `.domain.ts` files
- **Cross-feature data**: Use service layer pattern (to be implemented)

### ELO Rating System (PRESERVE FROM PREVIOUS)

**Source**: `features/ratings/ratings.domain.ts`

```typescript
// K-factor is FIXED at 32 for all players
const K_FACTOR = 32;

// Expected score calculation
expectedScore(ratingA, ratingB) -> { expectedA, expectedB }

// ELO update
eloUpdate(ratingA, ratingB, scoreA: 0 | 0.5 | 1) -> {
  newRatingA, newRatingB, expectedA, expectedB
}
```

**Business Rules**:
- New players start at 1000 ELO
- K-factor is always 32 (no dynamic K-factor)
- Anonymous matches don't affect ratings (rated: false)
- Ratings updated immediately on match completion

### Match Domain Logic (PRESERVE FROM PREVIOUS)

**Source**: `features/matches/matches.domain.ts`

```typescript
// Match completion rules
hasWinner(scoreA, scoreB) -> boolean
// Winner must have: score >= 11 AND lead >= 2

winnerOf(scoreA, scoreB) -> 'A' | 'B' | null

// Match validation
validateNoOngoingMatch(matches) -> void | throw ValidationError
validateMatchCanBeModified(match) -> void | throw ValidationError
validateCanUndo(match) -> void | throw ValidationError
```

**Business Rules**:
- Only ONE ongoing match at a time (status: 'IN_PROGRESS')
- Score updates only allowed on IN_PROGRESS matches
- Match finishes when: score >= 11 AND lead >= 2
- Undo only when history exists (scoreA > 0 OR scoreB > 0)
- All match mutations are **localhost-only** (security rule from previous)

### Keyboard Controls (KIOSK MODE)

**Source**: `features/kiosk/hooks/useKeyboardControls.ts`

**Primary Controls**:
- **Left Arrow (←)**: Award point to Player A
- **Right Arrow (→)**: Award point to Player B
- **S**: Start new match / Show start dialog
- **Escape**: Cancel/close dialogs
- **U**: Undo last point

**Important**:
- Ignore keyboard input when focused on `<input>`, `<textarea>`, or `contentEditable` elements
- Auto-detect winner when score conditions met
- Play sound effects on score update (arcade-effects.ts pattern)

### Database Layer

**Source**: `db/index.ts`

**Technology**: SQLite via sql.js (pure JavaScript, runs in Node.js)

**Persistence Strategy** (from previous implementation):
- Debounced save after critical operations (1 second delay)
- Periodic backup every 30 seconds
- Force save on SIGTERM/SIGINT
- Maximum data loss on crash: ~1-30 seconds

**Schema**:

```sql
-- Players table
CREATE TABLE players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,  -- For Gravatar
  rating INTEGER NOT NULL DEFAULT 1000,
  createdAt INTEGER NOT NULL
);

-- Matches table
CREATE TABLE matches (
  id TEXT PRIMARY KEY,
  playerA_id TEXT,
  playerA_ratingBefore INTEGER,
  playerA_ratingAfter INTEGER,
  playerB_id TEXT,
  playerB_ratingBefore INTEGER,
  playerB_ratingAfter INTEGER,
  scoreA INTEGER NOT NULL DEFAULT 0,
  scoreB INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  startedAt INTEGER NOT NULL,
  completedAt INTEGER,
  createdAt INTEGER NOT NULL,
  rated INTEGER DEFAULT 1,  -- SQLite stores boolean as 0/1
  handicapConfig TEXT,      -- JSON string (optional)
  pointSequence TEXT        -- "A" or "B" per point (optional)
);
```

**Helper Functions**:
- `database()`: Get database instance (lazy init)
- `saveDb()`: Debounced save (1s delay)
- `saveDbSync()`: Immediate save (use on exit)

### UI/UX Requirements (from Previous Implementation)

**Screen Size and Readability**:
- Designed for **55" TV viewed from 5 meters**
- **Typography**: Large, bold fonts
  - Scoreboard: Triple-scale (≈108px names, 288-384px scores)
  - Labels: Minimum 2rem (32px) on desktop
- **Spacing**: Generous padding, clear separation
- **Contrast**: High contrast text/backgrounds
- **No Emojis in Web UI**: Use SVG icons instead (Linux deployments lack color emoji fonts)

**Routes**:
- `/` - Home page with navigation cards
- `/kiosk` - Full-screen keyboard-driven scoreboard for TV
- `/podium` - **NEW**: Dedicated hallway display for today's top 3 players
- `/players` - Player management (to be implemented)
- `/api/*` - API endpoints (Astro server endpoints)

### Authentication Layer

**CRITICAL**: All API operations MUST include Auth0 ID token validation.

- Use Auth0 for user authentication
- Attach ID token to every API request
- Server-side validation required on all endpoints
- No unauthenticated operations allowed
- **Exception**: Public read-only routes for kiosk/podium displays

### Kiosk vs Podium Modes

**Kiosk Mode** (`/kiosk`):
- Full scoreboard with live scoring
- Keyboard-driven controls
- Match start/management UI
- Real-time updates
- Localhost-only for mutations

**Podium Mode** (`/podium` - NEW):
- Read-only display
- Shows today's top 3 players
- Large, readable from hallway distance
- Auto-refresh every 30 seconds
- No keyboard controls
- Celebratory animations

### Migration Strategy from Previous Codebase

**Phase 1 - Foundation** (CURRENT):
✅ Astro project setup with Node adapter
✅ Tailwind CSS integration
✅ Basic layouts and pages
✅ Database setup (SQLite via sql.js)
✅ Shared types and utilities
✅ ELO domain logic
✅ Match domain logic

**Phase 2 - Core Features**:
- [ ] Player CRUD with Gravatar integration
- [ ] Match API endpoints (create, update score, finish)
- [ ] Kiosk page with keyboard controls
- [ ] Real-time updates (SSE or polling)
- [ ] Auth0 middleware

**Phase 3 - Advanced Features**:
- [ ] Podium leaderboard with animations
- [ ] PWA manifest and service worker
- [ ] Push notifications
- [ ] Tournament modes (Round Robin, King of the Hill)
- [ ] Video replay (optional camera capture)

**What to Copy from Previous**:
- ✅ `ratings.domain.ts` - ELO calculation logic
- ✅ `matches.domain.ts` - Match validation and business rules
- ⏳ `players.domain.ts` - Player CRUD operations
- ⏳ `players.validation.ts` - Player validation rules
- ⏳ Keyboard control patterns (adapt for Astro)
- ❌ React components (rewrite as Astro)
- ❌ SSE client logic (replace with Astro approach)
- ❌ Vite config (Astro handles bundling)

**What NOT to Copy**:
- React components and hooks
- Vite-specific configuration
- Express server setup (Astro handles this)
- Client-side routing (use Astro file-based routing)

## Development Guidelines

### Commit Conventions

Use conventional commits for semantic-release:
- `feat:` new features
- `fix:` bug fixes
- `docs:` documentation changes
- `chore:` maintenance tasks
- `perf:` performance improvements

### Code Style

- TypeScript strict mode enabled
- Prefer async/await over promises
- Use Zod for validation schemas
- Keep business logic in `.domain.ts` files
- Use descriptive variable names

### Testing Strategy

- Unit tests for domain logic (ELO, match validation)
- Integration tests for API endpoints
- E2E tests for critical user flows (kiosk scoring)
- Test with in-memory database (no file I/O)

## Business Rules Summary

### Match Management
- Only ONE ongoing match at a time
- Score updates only on IN_PROGRESS status
- Finish match when: score >= 11 AND lead >= 2
- Undo available when history exists
- All mutations are localhost-only

### Player Management
- Non-empty name required
- Valid or empty email (for Gravatar)
- Cannot delete player with match history
- New players start at 1000 ELO

### Rating System
- K-factor: 32 (fixed for all players)
- New player rating: 1000
- Anonymous matches: rated = false (no ELO change)
- Ratings recalculated on match finish

## Known Issues and TODOs

- [ ] Auth0 middleware not yet implemented
- [ ] Real-time updates (SSE) needs implementation
- [ ] PWA manifest and service worker
- [ ] Push notification setup
- [ ] Player management UI
- [ ] Tournament mode migration
- [ ] Video replay feature
- [ ] Gravatar integration for player avatars

## Related Documentation

- Previous implementation: `C:\devGithub\hackathon-2025-ping-pong-party\stacks\digital-scoreboard\`
- AI Instructions from old codebase: `AI_INSTRUCTIONS.md`
- Architecture docs: `docs/architecture.md`
- Feature docs: `docs/features.md`

## Multi-Repository Strategy

The Ping Pong Party organization uses multiple repositories:
- `digital-scoreboard` (this repo) - Main application
- Future: Separate repos per plugin/feature module
- Each plugin published and versioned independently

When adding features, consider if they should be:
- Part of core application
- Extracted as standalone plugin
- Shared utility across multiple plugins

## Environment Variables

```bash
# Auth0
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_AUDIENCE=your-api-identifier

# Database
DATABASE_PATH=./.data/app.db

# Server
PORT=3000
NODE_ENV=development
```
