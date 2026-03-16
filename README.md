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
- 📱 **PWA Support** - Progressive web app with mobile interface
  - Install on mobile devices (Add to Home Screen)
  - Offline support with service worker caching
  - Touch-optimized UI for phones/tablets
  - Auto-detects device type (mobile vs TV)
  - Haptic feedback on touch interactions
  - Real-time sync across all devices

### 🚧 Planned
- 🔐 **Auth0 Integration** - Secure authentication on all operations
- 🔔 **Push Notifications** - Get notified when matches start
- 🔄 **Background Sync** - Queue offline score updates

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
│   ├── index.astro   # Main scoreboard (default kiosk view)
│   ├── players.astro # Player management
│   ├── ratings.astro # ELO leaderboard
│   ├── matches.astro # Match history
│   └── podium.astro  # Top 3 display
├── components/       # Reusable components
│   ├── kiosk/       # Scoreboard, match starter, leaderboard
│   ├── players/     # Player CRUD
│   ├── ratings/     # Rating displays
│   ├── matches/     # Match history
│   └── shared/      # Navigation hints, dialogs
├── middleware/       # Auth0 middleware
└── server/          # Backend logic
    ├── db/          # SQLite database
    ├── features/    # Vertical slice features
    │   ├── players/
    │   ├── matches/
    │   └── ratings/
    └── shared/      # Shared types and utils
```

## Keyboard Controls

### Global Navigation (Works Everywhere)
- **P** - Go to Players page
- **R** - Go to Ratings page
- **M** - Go to Matches page
- **ESC** or **H** - Return to Home (main scoreboard)

### Home Screen / Kiosk Mode
- **N** - Start new match
- **1** - Cycle leaderboard/view (Today → Week → Month → All-Time / Overview → Opponents → History)
- **↑ ↓** - Navigate through leaderboard/opponents
- **Enter** - View player details / View head-to-head matches
- **ESC** - Close player details / Go back

### Ratings Page & Player Details
- **↑ ↓** - Navigate through players/opponents
- **Enter** - View player details / View head-to-head
- **ESC** - Close details / Go back
- **1** - Cycle view (Overview → Opponents → History)

### Player Selection (Grid Navigation)
- **↑ ↓ ← →** - Navigate through players
- **Enter** - Select highlighted player
  - First selection = Player A (blue border)
  - Second selection = Player B (purple border)
- **ESC** - Deselect player / Cancel (reverse order)
- **A** - Add new player
- **S** - Start match with selected players

### During Match
- **←** (Left Arrow) - Award point to Player A
- **→** (Right Arrow) - Award point to Player B
- **F** - Finish match (when winner exists)
- **ESC** - Cancel match (with confirmation)

## Routes

- `/` - **Main scoreboard** (default kiosk view)
  - Leaderboard (Today/Week/Month/All-Time)
  - Monthly podiums (last 3 months)
  - Start new matches
  - Live scoring with keyboard controls
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

## PWA (Progressive Web App)

The app includes full PWA support for mobile devices:

- **Install**: Add to home screen on iOS/Android
- **Offline**: Service worker caches data for offline viewing
- **Mobile UI**: Touch-optimized interface auto-detects mobile devices
- **Real-time Sync**: Scores update across all devices in real-time

### Setup

1. Generate PWA icons (required):
   ```bash
   # See PWA-SETUP.md for detailed instructions
   cd public/icons
   # Generate icons from icon.svg at sizes: 72, 96, 128, 144, 152, 192, 384, 512
   ```

2. The app automatically detects device type:
   - **Mobile/Tablet**: Shows touch-friendly UI with large buttons
   - **Desktop/TV**: Shows keyboard-driven kiosk interface

3. See [PWA-SETUP.md](PWA-SETUP.md) for complete setup and testing guide

### Mobile Features

- Large touch-friendly score buttons
- Visual player selection with avatars
- Haptic feedback on interactions
- Pull-to-refresh for leaderboard
- Works offline with cached data
- Real-time updates when online

## Documentation

See [CLAUDE.md](CLAUDE.md) for AI assistant instructions and architecture details.

## License

Private - Ping Pong Party Organization
