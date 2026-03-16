# Ping Pong Party - Digital Scoreboard

Real-time ping pong scoreboard and ELO tracker built with Astro, Webcore, and Auth0.

## Features

### ✅ Implemented
- 🎮 **Kiosk Mode** - Full keyboard-driven scoreboard for 55" TV
  - Player selection with avatars
  - Live scoring (← for Player A, → for Player B)
  - Auto-finish when winner detected
  - Real-time polling updates
- 👥 **Player Management** - Complete CRUD with Gravatar integration
- 🏆 **ELO Rating System** - Automatic calculation with K-factor 32
- ⭐ **Leaderboard** - Ranked by rating with win/loss stats
- 🥇 **Podium Display** - Top 3 players for hallway TV display
- 📊 **Match Tracking** - Full history with rating changes

### 🚧 Planned
- 🔐 **Auth0 Integration** - Secure authentication on all operations
- 📱 **PWA Support** - Mobile-friendly progressive web app
- 🔔 **Push Notifications** - Get notified when matches start

## Tech Stack

- **Frontend**: Astro + React 18 + Tailwind CSS
- **Backend**: Node.js (SSR with Astro)
- **Database**: SQLite (sql.js)
- **Auth**: Auth0
- **CI/CD**: Dagger + GitHub Actions
- **Development**: Devenv (Nix)

## Getting Started

### Prerequisites

- Node.js >= 20
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure Auth0 settings in .env
```

### Development

```bash
# Start development server
npm run dev

# Visit http://localhost:4321
```

### Build

```bash
# Type check
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── layouts/          # Astro layouts
├── pages/            # Astro pages (routes)
│   ├── index.astro   # Home page
│   ├── kiosk.astro   # Kiosk mode for TV
│   └── podium.astro  # Today's leaderboard
├── components/       # Reusable components
├── middleware/       # Auth0 middleware
└── server/          # Backend logic
    ├── db/          # SQLite database
    ├── features/    # Vertical slice features
    │   ├── players/
    │   ├── matches/
    │   ├── ratings/
    │   └── kiosk/
    └── shared/      # Shared types and utils
```

## Keyboard Controls (Kiosk Mode)

**Match Management:**
- **N** - Start new match
- **S** - Start match (in player selection)

**During Match:**
- **←** (Left Arrow) - Award point to Player A
- **→** (Right Arrow) - Award point to Player B
- **F** - Finish match (when winner exists)

## Routes

- `/` - Home page with navigation
- `/kiosk` - **Full interactive scoreboard**
  - Select players
  - Live scoring with keyboard controls
  - Automatic ELO calculation
  - Start new matches
- `/players` - **Player management**
  - Add/delete players
  - Gravatar integration
  - View ratings
- `/ratings` - **ELO Leaderboard**
  - Top players ranked by rating
  - Win/loss stats
  - Win rate percentages
  - Total matches played
- `/matches` - **Match History**
  - Complete match archive
  - Filter by status (All, Completed, In Progress)
  - Search by player name
  - Rating changes for each match
  - Winner highlights
- `/podium` - **Top 3 Players Display**
  - Live data from API
  - Player avatars
  - Auto-refresh every 30s
  - Perfect for hallway TV display
- `/demo` - React integration demo

## API Endpoints

**Players:**
- `GET /api/players` - List all players
- `POST /api/players` - Create player
- `PUT /api/players/:id` - Update player
- `DELETE /api/players/:id` - Delete player

**Matches:**
- `GET /api/matches` - List all matches
- `POST /api/matches` - Create match
- `GET /api/matches/ongoing` - Get current match
- `POST /api/matches/score` - Update score
- `POST /api/matches/finish` - Finish match & calculate ELO

**Ratings:**
- `GET /api/ratings/leaderboard?limit=10` - Get top players with stats

## Documentation

See [CLAUDE.md](CLAUDE.md) for AI assistant instructions and architecture details.

## License

Private - Ping Pong Party Organization
