# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wherewolf is a browser-based companion app for the "One Night Ultimate Werewolf" board game. Players join lobbies, receive hidden role cards, perform night actions, discuss, and vote — without a human moderator. There is no build step; all frontend code is plain HTML/CSS/JavaScript (ES modules) served statically.

The game logic runs on a backend server (Socket.IO), deployed at `https://wherewolf-server-bhut.onrender.com`. Frontend and backend live together in this repository — the `backend/` directory contains the server-side code.

## Repository Structure

```
index.html, wiki.html, js/, css/, assets/, images/   # frontend — see below
backend/                                             # backend — see below (also holds roles.json)
```

## Frontend Structure

```
index.html        # Main game view — all game UI lives in a single HTML file
wiki.html         # Role wiki/reference page
js/
  index.js          # Entry point: Socket.IO wiring, lobby state reactions
  functions.js      # DOM helpers: card rendering, UI updates, toast popups, token display
  roleActions.js    # Night action UI handling: which buttons/cards to show per role
  selectRoles.js    # Role selection screen logic (host-only controls)
  CardClickEvent.js # Card click interactions during night and voting phases
  gameSummary.js    # End-of-game log/summary overlay
  chat.js           # Chat message sending/receiving
  tokens.js         # Draggable role token rendering for the day phase
  voteResults.js    # Vote result board and role reveal
  lobby.js          # Lobby lookup helpers (current lobby, players, own card)
  wiki.js           # Wiki page population from roles.json
css/
  style.css         # Main styles
  buttons.css       # Button component styles
assets/           # Background images, card backs, mark/token images
images/           # Role card images (one PNG per role, snake_case filename)
```

## Architecture

### Lobby State Machine

`index.js` receives `update-lobbies` from the server and reacts to `lobby.state`:

| State | Description |
|-------|-------------|
| `waiting` | Lobby view, waiting for players |
| `select-roles` | Host configures the role pool |
| `look-at-role` | Players view their own card |
| `night` | Night phase — role actions shown via `roleActions.js` |
| `day` | Discussion phase |
| `voting` | Players click another card to vote |
| `voting-results` | Results, game summary, restart option |

Each state branch in `index.js` shows/hides DOM elements and calls helpers from `functions.js`.

### Module Responsibilities

- **`index.js`** — owns the `socket`, `lobbies`, `myId`, and `allRoles` globals; exports them for other modules. All Socket.IO emit/on calls live here.
- **`functions.js`** — pure DOM helpers. Receives lobby data as arguments; never emits to the server.
- **`roleActions.js`** — reads `lobby.cards` and the local player's `startingRole` to determine which buttons and card interactions to enable during the night phase. Imports `socket` from `index.js` to emit action confirmations.
- **`selectRoles.js`** — renders the role grid from `allRoles`, filters by edition, and emits role/setting changes. Only the host can make changes; non-host clicks are blocked client-side.
- **`lobby.js`** — lookup helpers (`getCurrentLobby`, `getCurrentPlayers`, `getMyPlayer`) built on the `lobbies`/`myId` globals from `index.js`. Used by other modules to find the current lobby and player without duplicating the lookup logic.
- **`chat.js`** — sends and renders chat/console messages; emits to the server via `socket` imported from `index.js`.
- **`tokens.js`** — renders draggable role tokens into the tokens container during the day phase, ordered by `nightOrder` from `allRoles`.
- **`voteResults.js`** — reveals role cards and renders the vote result board after voting ends.
- **`backend/roles.json`** — the single source of truth for role metadata, shared by frontend and backend. Each entry has `name`, `edition`, `image`, `text` (short description), and `id`. The frontend fetches it from the backend (`../backend/roles.json` from `js/index.js` and `js/wiki.js`); the backend reads it from disk in `database.js`.

### Adding a New Role (Frontend)

1. Add a PNG to `images/` — filename must be `rolename_with_underscores.png` (lowercase).
2. Add an entry to `backend/roles.json` with `name`, `edition`, `image`, and `text`.
3. If the role requires a unique night action UI, add a handler in `roleActions.js`.

## Backend

### Commands

All commands must be run inside the Docker container — never directly on the host.

```bash
# Build the image
docker build -t wherewolf-server backend/

# Run (requires env vars for MongoDB Atlas)
docker run -p 3003:3003 \
  -e DATABASE_USERNAME=<user> \
  -e DATABASE_PASSWORD=<pass> \
  wherewolf-server
```

The server starts with `npm start` → `node server.js` and listens on port 3003.

### Environment Variables

| Variable            | Purpose                                |
|---------------------|-----------------------------------------|
| `DATABASE_USERNAME` | MongoDB Atlas username                  |
| `DATABASE_PASSWORD` | MongoDB Atlas password                  |
| `PORT`              | Server port (optional, defaults to 3003) |

### Backend Architecture

Three source files under `backend/`, no build step, ES modules (`"type": "module"`).

#### `backend/server.js`
Express + Socket.IO server. All game logic lives here as Socket.IO event handlers attached to each client connection. Lobbies are stored in-memory in a module-level `lobbies` array — there is no persistence between server restarts (only completed games are saved to MongoDB).

#### `backend/database.js`
- Connects to MongoDB Atlas (`Wherewolf` database, `games` collection) on startup.
- Reads role definitions from the local `roles.json` in `backend/` on startup and passes them to `server.js` via `setAllRoles`.
- `saveGameToDatabase` is called once per completed game (skipped in test mode).

#### `backend/votingResults.js`
Pure function `evaluateVotingResults(lobby, players)` — no I/O. Mutates `lobby.winningTeam`, `lobby.voteResultText`, and `player.dies` based on vote counts and role effects.

### Key Data Structures

**Lobby** — `{ id, name, cards[], state, selectedRoles[], pendingSwaps[], discussTime, randomActions[], oracleAnswer, ... }`

**Card** — represents either a player or a middle card (`isMiddleCard: true`). Tracks the full role history in `roleChain[]` (index 0 = starting role, last = current role), night-action flags, vote, etc.

### Game State Machine

```
waiting → select-roles → look-at-role → night → day → voting → voting-results
```

- The night cycle runs as a `setInterval` on the server, advancing once all players have acted and all `randomActions` have been acknowledged.
- Card swaps (Robber, Troublemaker, etc.) are queued in `lobby.pendingSwaps` during the night and executed in priority order when early-acting roles finish.
- `middle-card4` is a special extra middle card used only when Alpha Wolf is selected.

### Test Mode

If a lobby contains players named exactly `Bread1`, `Bread2`, and `Bread3`, `isTesting()` returns `true`. Test mode shortens discussion time to 5 s and skips the MongoDB write.

### Adding a New Role (Backend)

Implement the role's night action and win-condition effects directly in `backend/server.js` (action handling) and `backend/votingResults.js` (if it affects vote outcomes or win conditions).
