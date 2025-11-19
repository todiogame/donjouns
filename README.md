# Donjouns

Phaser front‑end + Colyseus multiplayer backend for a dungeon draft/loot game prototype. The repository contains both the browser client (bundled with Webpack) and the Node.js/Colyseus game server.

## Prerequisites

- Node.js 18+ (uses modern ECMAScript modules and Webpack 5)
- npm 9+ (ships with current Node releases)

## Getting Started

1. **Install dependencies**
   ```powershell
   npm install
   ```
2. **Run the Phaser client (development build)**
   ```powershell
   npm run start
   ```
   This launches `webpack-dev-server`, auto-opens your browser, and serves hot-reloaded assets.
3. **Run the Colyseus server (in a second terminal)**
   ```powershell
   npm run server
   ```
   The server listens on `ws://localhost:2567`, serves the built assets from `dist/`, and registers the Colyseus monitor at `http://localhost:2567/colyseus`.

Keep the backend running before loading the client so the WebSocket connection succeeds. Stop each process with `Ctrl+C`.

## Project Structure

- `src/` – Phaser game client source.
- `server/` – Colyseus server, rooms, and data loader.
- `webpack.config.js` – bundles the client into `dist/`.
- `compress.py` – helper script for packaging assets.

## Useful Scripts

| Script            | Description                                   |
| ----------------- | --------------------------------------------- |
| `npm run start`   | Launch webpack dev server with live reload.   |
| `npm run server`  | Start the Colyseus/Express backend.           |

## Next Steps

- Review `todo.txt` for pending gameplay/UI work items.
- Configure deployment/hosting once gameplay is ready (see “PRODUCTION” section in `todo.txt`).



## Configuration Notes

- Configure `server/config.json` to tune multiplayer behaviour. `min_players_to_start` sets how many adventurers the lobby requires before the host can start the run (defaults to the same value as `nb_players`, i.e. 3).
- The first player in the room is highlighted as the host; only they see the “Lancer la partie” button, which remains disabled until the lobby contains at least `min_players_to_start` players.
- Use the lobby name field to pick a display name; it syncs to all clients and is saved locally for the next session.
