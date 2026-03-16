# Migration Plan: SPA → Astro SSR

This document outlines the migration strategy from the previous React SPA implementation to the new Astro SSR architecture.

## Source Codebase

**Location**: `C:\devGithub\hackathon-2025-ping-pong-party\stacks\digital-scoreboard\`

**Tech Stack (OLD)**:
- React 18 + Vite
- Express backend (separate process)
- Client-side routing (hash-based)
- Server-Sent Events (SSE) for real-time sync
- sql.js (SQLite in-memory with persistence)

**Tech Stack (NEW)**:
- Astro 5 + SSR
- Integrated backend (Astro server endpoints)
- File-based routing
- TBD: Real-time sync mechanism
- sql.js (same database approach)

## Phase 1: Foundation ✅ COMPLETE

### What Was Migrated

#### Database Layer ✅
**Source**: `db/index.ts`
**Destination**: `src/server/db/index.ts`

```typescript
// Copied with minimal changes:
- database() initialization
- Schema creation (players, matches tables)
- saveDb() debounced persistence
- saveDbSync() immediate save
- Process exit handlers (SIGTERM, SIGINT)
```

**Changes Made**:
- Removed test-mode detection (process.env.VITEST)
- Simplified for Node.js only (no browser compatibility needed)
- Kept same schema structure

#### Shared Types ✅
**Source**: `shared/types.ts`
**Destination**: `src/server/shared/types.ts`

```typescript
// Copied directly:
- PlayerId, MatchId branded types
- Player interface
- Match interface
- toPlayerId(), toMatchId() helper functions
```

**Changes Made**:
- None - types are portable

#### Utility Functions ✅
**Source**: `shared/utils.ts`
**Destination**: `src/server/shared/utils.ts`

```typescript
// Copied:
- now() - timestamp generator
- generateId() - random ID generator
```

**Changes Made**:
- Removed crypto import (using Math.random for now)

#### ELO Rating System ✅
**Source**: `features/ratings/ratings.domain.ts`
**Destination**: `src/server/features/ratings/ratings.domain.ts`

```typescript
// Copied:
- K_FACTOR = 32
- expectedScore(ratingA, ratingB)
- eloUpdate(ratingA, ratingB, scoreA)
- calculateRatingsForMatch() helper
```

**Changes Made**:
- Removed service layer imports
- Removed state management (will be replaced with DB queries)
- Simplified to pure calculation functions

#### Match Domain Logic ✅
**Source**: `features/matches/matches.domain.ts`
**Destination**: `src/server/features/matches/matches.domain.ts`

```typescript
// Copied:
- hasWinner(scoreA, scoreB)
- winnerOf(scoreA, scoreB)
- createMatch() DB operation
- updateMatch() DB operation
- ongoingMatch() query
```

**Changes Made**:
- Removed privacy filtering logic (will be re-added later)
- Removed Zod validation imports (will be re-added)
- Simplified interfaces

#### Pages ✅
Created new Astro pages:
- `src/pages/index.astro` - Home page with navigation
- `src/pages/kiosk.astro` - Keyboard-driven scoreboard (basic version)
- `src/pages/podium.astro` - NEW: Today's leaderboard display

## Phase 2: Core Features 🚧 IN PROGRESS

### Players Feature

#### Files to Migrate

**Source Files**:
- `features/players/players.domain.ts` → Database CRUD operations
- `features/players/players.validation.ts` → Zod schemas
- `features/players/players.types.ts` → Type definitions
- `features/players/players.api.ts` → Client API calls (SKIP - rewrite as Astro)
- `features/players/players.server.ts` → Express routes (CONVERT to Astro endpoints)

**Destination**:
```
src/
├── server/features/players/
│   ├── players.domain.ts     # DB operations
│   ├── players.validation.ts # Zod schemas
│   └── players.types.ts      # Types
├── pages/api/players/
│   ├── index.ts              # GET /api/players, POST /api/players
│   ├── [id].ts               # GET/PUT/DELETE /api/players/:id
│   └── recovery/             # Recovery endpoints
└── pages/players.astro       # Player management UI
```

**Migration Steps**:
1. ✅ Copy `players.domain.ts` (DB operations)
2. ✅ Copy `players.validation.ts` (Zod schemas)
3. ✅ Copy `players.types.ts` (interfaces)
4. 🚧 Create Astro API endpoints (`/api/players/*`)
5. 🚧 Create `players.astro` page (replace React components)
6. ✅ Add Gravatar email integration

**Key Changes**:
- Express routes → Astro API routes (use `export const GET`, `export const POST`, etc.)
- React components → Astro components
- Client-side API calls → Direct server-side data fetching in Astro

### Matches Feature

#### Files to Migrate

**Source Files**:
- ✅ `features/matches/matches.domain.ts` (DONE - already migrated)
- `features/matches/matches.types.ts` → Type definitions
- `features/matches/matches.validation.ts` → Zod schemas
- `features/matches/matches.server.ts` → Express routes (CONVERT)
- `features/matches/matches.api.ts` → Client API (SKIP - rewrite)

**Destination**:
```
src/
├── server/features/matches/
│   ├── matches.domain.ts     # ✅ DONE
│   ├── matches.validation.ts # TODO
│   └── matches.types.ts      # TODO
├── pages/api/matches/
│   ├── index.ts              # GET /api/matches
│   ├── ongoing.ts            # GET /api/matches/ongoing
│   ├── create.ts             # POST /api/matches
│   ├── [id]/
│   │   ├── score.ts          # PUT /api/matches/:id/score
│   │   ├── finish.ts         # POST /api/matches/:id/finish
│   │   └── index.ts          # DELETE /api/matches/:id
│   └── undo.ts               # POST /api/matches/undo
└── pages/matches.astro       # Match history UI
```

**Migration Steps**:
1. ✅ Copy match domain logic (DONE)
2. 🚧 Copy match validation rules
3. 🚧 Create Astro API endpoints
4. 🚧 Create match history page
5. 🚧 Add localhost-only middleware for mutations

### Kiosk Feature

#### Files to Migrate

**Source Files**:
- `features/kiosk/hooks/useKeyboardControls.ts` → Keyboard logic
- `features/kiosk/hooks/useScoreboardState.ts` → State management
- `features/kiosk/kiosk.server.ts` → SSE stream (CONVERT)
- `features/kiosk/components/*` → React components (REWRITE)

**Destination**:
```
src/
├── pages/kiosk.astro         # ✅ BASIC VERSION DONE
├── pages/api/kiosk/
│   └── stream.ts             # SSE endpoint (TODO)
└── components/kiosk/
    ├── Scoreboard.astro      # TODO
    ├── PlayerSelection.astro # TODO
    └── StartDialog.astro     # TODO
```

**Migration Steps**:
1. ✅ Create basic kiosk page with keyboard controls
2. 🚧 Migrate keyboard control logic to Astro script
3. 🚧 Implement SSE endpoint for real-time updates
4. 🚧 Create scoreboard components
5. 🚧 Add player selection UI
6. 🚧 Add match start dialog

**Key Changes**:
- React hooks → Astro `<script>` tags with vanilla JS/TS
- SSE client → EventSource in Astro script
- Component state → DOM manipulation or Alpine.js

### Ratings Feature

#### Files to Migrate

**Source Files**:
- ✅ `features/ratings/ratings.domain.ts` (DONE - ELO calculations)
- `features/ratings/season.domain.ts` → Season leaderboards
- `features/ratings/ratings.state.ts` → Rating storage (SKIP - use DB)
- `features/ratings/ratings.server.ts` → Express routes (CONVERT)

**Destination**:
```
src/
├── server/features/ratings/
│   ├── ratings.domain.ts     # ✅ DONE
│   └── season.domain.ts      # TODO
├── pages/api/ratings/
│   └── leaderboard.ts        # TODO
└── pages/ratings.astro       # TODO
```

**Migration Steps**:
1. ✅ Copy ELO calculation logic (DONE)
2. 🚧 Copy season system logic
3. 🚧 Create leaderboard API endpoint
4. 🚧 Create ratings page with leaderboard

## Phase 3: Advanced Features 📋 PLANNED

### Tournament Mode

**NOT MIGRATING YET** - Complex feature that can be added later

**Source Files**:
- `features/tournament/*` - Round Robin and King of the Hill logic

**Decision**: Implement from scratch in Phase 3 after core features are stable

### Video Replay

**NOT MIGRATING YET** - Optional feature

**Source Files**:
- `features/video-replay/*` - Camera capture and playback

**Decision**: Add in Phase 3 if needed

### Activity Feed

**NOT MIGRATING YET** - Nice-to-have feature

**Source Files**:
- `features/activity-feed/*` - Event broadcasting

**Decision**: Add in Phase 3 after real-time sync is working

### Meshtastic Integration

**NOT MIGRATING** - Specific to previous deployment

**Source Files**:
- `features/meshtastic/*` - Radio announcements

**Decision**: Not needed for new implementation

## Real-Time Sync Strategy

### Old Approach (SSE)

```typescript
// Server (Express)
export function broadcastScoreboard(data: any) {
  clients.forEach(client => {
    client.write(`data: ${JSON.stringify({ type: 'scoreboard:update', data })}\n\n`);
  });
}

// Client (React)
useEffect(() => {
  const es = new EventSource('/api/kiosk/stream');
  es.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.type === 'update') setState(msg.data);
  };
  return () => es.close();
}, []);
```

### New Approach (TBD)

**Options**:
1. **SSE with Astro endpoints** - Similar to old approach
2. **Polling** - Simpler, less real-time
3. **WebSockets** - More complex but better for two-way communication
4. **Astro Actions** - New Astro feature for server actions

**Recommendation**: Start with SSE (Astro endpoint), fallback to polling if issues

## Authentication Migration

### Old Approach

```typescript
// Cloudflare Access guard (optional)
// Player CRUD bypasses Cloudflare for remote admin
// Match mutations are localhost-only
```

### New Approach

```typescript
// Auth0 middleware on ALL operations
// Use Astro middleware for auth checks
// Localhost-only for match mutations
// Public read-only for kiosk/podium displays
```

**Migration Steps**:
1. 🚧 Set up Auth0 configuration
2. 🚧 Create Astro middleware for auth
3. 🚧 Add localhost detection utility
4. 🚧 Protect mutation endpoints
5. 🚧 Allow public read for display routes

## Database Migration

**Good News**: Database schema is identical!

No migration needed - can copy `.data/app.db` file directly from old implementation.

**Verification**:
```bash
# Copy database from old app
cp /path/to/old/.data/app.db ./.data/app.db

# Start new app - should work immediately
npm run dev
```

## Testing Strategy

### Unit Tests to Migrate

**Priority 1** (Core Logic):
- ✅ ELO calculations (ratings.domain.test.ts)
- 🚧 Match validation (matches.domain.test.ts)
- 🚧 Player validation (players.validation.test.ts)

**Priority 2** (Integration):
- 🚧 Match API endpoints
- 🚧 Player API endpoints
- 🚧 Kiosk API endpoints

**Priority 3** (E2E):
- 🚧 Kiosk keyboard controls
- 🚧 Match creation flow
- 🚧 Score update flow

### Test Framework

**Old**: Vitest
**New**: Vitest (keep same framework)

Migration is straightforward - mostly path updates

## Deployment Changes

### Old Deployment

```bash
# Docker container
podman build -t ping-pong-scoreboard .
podman run -p 3000:3000 -v pingpong-data:/data ping-pong-scoreboard

# Monorepo Taskfile commands
task deploy:upload
task deploy:restart-service
```

### New Deployment

```bash
# Astro build output
npm run build
# → dist/ folder with static assets + server code

# Node.js server
npm start
# → Runs Astro server on port 3000
```

**TODO**:
- Create new Dockerfile for Astro
- Update deployment scripts
- Set up Dagger CI pipeline
- Configure GitHub Actions

## Progress Tracking

### Phase 1: Foundation ✅ COMPLETE (100%)
- ✅ Astro project setup
- ✅ Database layer
- ✅ Shared types
- ✅ ELO domain logic
- ✅ Match domain logic
- ✅ Basic pages

### Phase 2: Core Features ✅ COMPLETE (95%)
- ✅ Players domain (100%) - Full CRUD + Gravatar
- ✅ Matches API (100%) - Create, score, finish with ELO
- ✅ Kiosk improvements (95%) - Scoreboard + Match starter
- ✅ Ratings API (100%) - Leaderboard with stats
- ⏳ Auth0 integration (0%)

### Phase 3: Advanced Features 📋 PLANNED (0%)
- ⏳ Tournament mode (0%)
- ⏳ PWA + Push notifications (0%)
- ⏳ Video replay (0%)
- ⏳ Activity feed (0%)

## Migration Checklist

### Core Domain Logic
- [x] Database setup
- [x] ELO calculations
- [x] Match validation
- [x] Player validation
- [x] Match CRUD operations
- [x] Player CRUD operations

### API Endpoints
- [x] GET /api/players
- [x] POST /api/players
- [x] PUT /api/players/:id
- [x] DELETE /api/players/:id
- [x] GET /api/matches
- [x] POST /api/matches
- [x] GET /api/matches/ongoing
- [x] POST /api/matches/score
- [x] POST /api/matches/finish
- [ ] GET /api/kiosk/stream (SSE)
- [ ] GET /api/ratings/leaderboard

### UI Pages
- [x] Home page (updated with 6 sections)
- [x] Kiosk page (interactive scoreboard)
- [x] Podium page (real data with avatars)
- [x] Players management
- [x] Ratings leaderboard
- [x] Match history (with filter and search)

### Features
- [x] Keyboard controls (full implementation)
- [x] Real-time updates (polling)
- [x] Match creation UI
- [x] Player selection
- [x] Gravatar avatars
- [ ] Auth0 integration
- [ ] SSE (currently using polling)
- [ ] PWA manifest
- [ ] Push notifications

### Infrastructure
- [ ] Dockerfile
- [ ] Dagger CI pipeline
- [ ] GitHub Actions
- [ ] semantic-release config
- [ ] Devenv setup

## Notes

- **Do not rush** - Focus on getting core features solid before adding advanced features
- **Test extensively** - The old codebase has good test coverage, maintain it
- **Keep it simple** - Don't over-engineer, Astro should simplify things
- **Document changes** - Update CLAUDE.md as architecture evolves
