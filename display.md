# Plan to split `src/display.js`

## Current state
- `src/display.js` (~2.5k lines) bundles Phaser scenes (`TitleScene`, `DiceScene`, `AnimScene`) plus a monolithic `DisplayManager`.
- `DisplayManager` owns background/volume setup, lobby UI (`updateLobby`, `createNameInput`, `updateDraftingUI`), in-game board rendering (cards, piles, HP), action buttons, popups (scout, number input, monster type, pick item), overlays, and end-screen prompts.
- Shared state lives on the class instance (e.g., `zoomedItemCard`, `blurryBackground`, `scoutPopup`, `numberInputPopup`, `hoveredCardPreview`, `itemUsageTrackers`, `pileStates`, `discardState`, `hpStates`, end-screen flags), so breakup must keep these coherent.
- A modular folder already exists at `src/display/` but is unused because imports resolve to `src/display.js`; we can leverage it while aligning with the current file’s behavior.

## Target structure
- **Scenes**: move `TitleScene`, `DiceScene`, `AnimScene` into `src/display/scenes/TitleScene.js`, `DiceScene.js`, `AnimScene.js`; keep APIs (`displayTitle`, `startDiceAnimation`/`showDiceResult`, `executeAnimation`).
- **Root manager**: `src/display/DisplayManager.js` orchestrates sub-managers, owns cross-cutting state (background container, volume control, popup refs if shared), and exposes the same public surface used by game code.
- **Lobby UI**: `src/display/LobbyManager.js` for `updateLobby`, name input helpers, draft UI, and related cleanup.
- **Game interface**: `src/display/GameInterface.js` for `updateGameUI` delegation and board visuals (`displayCurrentCard`, `displayDungeon`, `displayDiscardPile`, `displayHand`, `displayStuff`/`displayMyStuff`, `displayHP`, `displayMonstersPiles`, `animateCard*`, `addShiningEffect`, zoom/hover preview, positioning helpers).
- **Action buttons**: `src/display/ActionButtons.js` for `addDamageButton`, `addExecuteButton`, `addPassTurnButton`, `addEscapeButton`, `addAcceptEventButton`, `addDeclineEventButton`, `addSpecialEffectButton`.
- **Popups**: `src/display/PopupManager.js` hosting modal utilities (`createPopupBackground`, `createButton*`, `displayScoutInterface`, `displayNumberInputInterface`, `showManualNumberInput`, `displayMonsterTypeSelectionInterface`, `displayPickItemInterface`) and their state refs (blurry bg, popup containers).
- **Overlays/end-game**: `src/display/OverlayManager.js` for `showOverlay`/death/fled overlays plus end-screen prompt/update (`showEndScreenPrompt`, `clearEndScreenPrompt`, `updateEndUI`).
- **Background/audio**: keep `initializeBackground`/`createVolumeControl` either on the root manager or a small helper (`src/display/BackgroundManager.js`) depending on how much isolation is needed.
- **Public barrel**: `src/display/index.js` exports the root manager and scenes for clean imports.

## Migration steps
1. Inventory shared state and teardown paths (DOM nodes, graphics containers) so every new class knows what it must create/destroy.
2. Extract scenes into `src/display/scenes/*` without behavior changes; update scene registration in preload/create flow to point to new files.
3. Point `create.js` (and any other imports) at `./display` so the folder index is used instead of `src/display.js`.
4. Build a slim root `DisplayManager` that constructs sub-managers, keeps cross-manager state (background container, shared overlays), and proxies public methods expected by the game loop.
5. Move lobby methods into `LobbyManager`, keeping host/guest logic, start mode options, and DOM input handling intact.
6. Move board rendering/animations into `GameInterface`, ensuring piles/discard/HP tracking maps travel with it; keep zoom/hover UX and `setData` markers on sprites.
7. Move button creation into `ActionButtons`, reusing a shared factory where possible while preserving `setData` tags used by gameplay logic.
8. Move modal/popup flows into `PopupManager`, centralizing overlay creation and cleanup so popups remain mutually exclusive.
9. Move overlays and end-of-game UI into `OverlayManager`, preserving ready flags and callbacks to avoid regressions in the end-screen flow.
10. Retire or trim `src/display.js` after parity checks, optionally reconciling with the existing `src/display/*` implementations to reduce duplication.
11. Validate by running the game locally: lobby join/leave, draft selection, card zoom/hover, pile animations, each action button, all popups, overlays, and the end screen. Adjust if any interaction regresses.

## Safety notes
- Keep public method names and interactive `setData` keys stable so network/message handlers still work.
- Ensure DOM nodes (volume slider, name inputs) are removed on cleanup to avoid duplicates across updates.
- Preserve timing/state maps (`itemUsageTrackers`, `pileStates`, `hpStates`, `discardState`, popup refs) in the managers that use them to keep animations and effects consistent.
