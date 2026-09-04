# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wherewolf is a browser-based companion app for the "One Night Ultimate Werewolf" board game. Players join lobbies, receive hidden role cards, perform night actions, discuss, and vote — without a human moderator. There is no build step; all frontend code is plain HTML/CSS/JavaScript (ES modules) served statically.

The game logic runs on a separate backend server (Socket.IO at `https://wherewolf-server-bhut.onrender.com`). The `Game_Code/` directory contains that server-side code and is out of scope for frontend work.

## Frontend Structure

```
index.html        # Main game view — all game UI lives in a single HTML file
wiki.html         # Role wiki/reference page
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
roles.json        # Role metadata: name, edition, image path, description text
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
- **`roles.json`** — the single source of truth for role metadata on the client. Each entry has `name`, `edition`, `image`, `text` (short description), and `id`.

### Adding a New Role (Frontend)

1. Add a PNG to `images/` — filename must be `rolename_with_underscores.png` (lowercase).
2. Add an entry to `roles.json` with `name`, `edition`, `image`, and `text`.
3. If the role requires a unique night action UI, add a handler in `roleActions.js`.
