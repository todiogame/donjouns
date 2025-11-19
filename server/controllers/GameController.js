const { GameState } = require('../models/GameState');
const { Player } = require('../models/Player');
const fs = require('fs');
const path = require('path');

const configPath = path.resolve(__dirname, '../config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const nbItemsStarting = config.nb_items_starting;
const nbItemsRandomMode = typeof config.nb_items_random_mode === "number"
    ? config.nb_items_random_mode
    : nbItemsStarting;

class GameController {
    constructor(room, minPlayersToStart) {
        this.room = room;
        this.state = new GameState(room);
        this.room.setState(this.state);
        this.minPlayersToStart = minPlayersToStart ?? room.maxClients;
        this.gameStarted = false;
        this.currentMode = null;
    }

    initialize(options) {
        this.room.allDungeonCards = options.dungeon || [];
        this.room.allItemsCards = options.itemsCards || [];

        this.state.initializeItemsDeck(this.room.allItemsCards);
    }

    onPlayerJoin(client) {
        const player = new Player(client.sessionId, `Player ${this.state.players.length + 1}`);
        this.state.addPlayer(player);
        console.log("player", player.id, player.name, player.stuff.length);
        // Host triggers start manually once enough players joined
    }

    startGame(modePreference) {
        if (this.gameStarted) {
            return;
        }
        const normalizedMode = this.normalizeMode(modePreference);
        this.currentMode = normalizedMode;
        this.state.gameMode = normalizedMode;
        this.gameStarted = true;
        this.room.lock();
        console.log(`start_game (${normalizedMode})`);

        if (normalizedMode === "draft") {
            this.startDraftPhase();
        } else {
            this.startRandomPhase();
        }
    }

    startRandomPhase() {
        this.state.dealItemsCardsRandom(nbItemsRandomMode);
        this.state.setUpDungeonGame(this.room.allDungeonCards);
        if (this.state.allPlayersSetupReady()) {
            this.state.gameLoop();
        }
        this.room.broadcast("start_game_random", this.state);
    }

    startDraftPhase() {
        this.state.phase = "DRAFT";
        this.state.dealItemsCardsDraft();
        this.room.broadcast("start_game", this.state);
    }

    finishDraftPhase() {
        this.state.discardHands();
        this.room.broadcast("end_draft", this.state);
        setTimeout(() => {
            this.state.setUpAndPlayDungeon(this.room.allDungeonCards);
            this.room.broadcast("start_game_random", this.state);
        }, 1000);
    }

    handleDraftSelection(clientId, message) {
        if (this.state.phase !== "DRAFT") {
            return;
        }
        const cardIndex = typeof message?.cardIndex === "number" ? message.cardIndex : null;
        if (cardIndex === null) {
            return;
        }
        const player = this.state.players.find(p => p.id === clientId);
        if (!player) {
            return;
        }

        player.selectCard(cardIndex);

        if (this.state.allPlayersSelected()) {
            this.state.addSelectedItemCardsToStuff();
            const allPlayersReady = this.state.players.every(p => p.stuff.length >= nbItemsStarting);
            if (!allPlayersReady) {
                this.state.rotateHands();
            } else {
                this.finishDraftPhase();
            }
        }
    }

    handleMessage(type, client, message) {
        console.log(`Received ${type} message from ${client.sessionId}:`, message);
        switch (type) {
            case "start_game_request":
                this.tryStartGame(client.sessionId, message?.mode);
                break;
            case "set_name":
                this.state.setPlayerName(client.sessionId, typeof message === "string" ? message : message?.name);
                break;
            case "select_card":
                this.handleDraftSelection(client.sessionId, message);
                break;
            case "pick_dungeon":
                this.state.pickDungeonCard(client.sessionId);
                break;
            case "take_damage":
                this.state.faceMonster(client.sessionId, message?.arg);
                break;
            case "special_effect":
                this.state.specialEffect(client.sessionId, message?.arg);
                break;
            case "pass_turn":
                this.state.wantToPassTurn(client.sessionId);
                break;
            case "execute":
                this.state.wantToExecuteNextMonster(client.sessionId);
                break;
            case "use_item":
                this.state.wantToUseItem(client.sessionId, message.item_id, message.arg);
                break;
            case "scout_pick":
                this.state.pickDungeonCard(client.sessionId, message.arg);
                break;
            case "escape_roll":
                this.handleEscapeRoll(client);
                break;
            case "accept_event":
                this.state.dealWithEvent(client.sessionId, true, message?.arg);
                break;
            case "decline_event":
                this.state.dealWithEvent(client.sessionId, false, message?.arg);
                break;
        }
    }

    tryStartGame(requesterId, requestedMode) {
        if (this.gameStarted) {
            return;
        }
        const hostId = this.state.hostId;
        if (!hostId || hostId !== requesterId) {
            return;
        }
        if (this.state.players.length < this.minPlayersToStart) {
            return;
        }
        if (this.state.phase !== "WAITING") {
            return;
        }
        this.startGame(requestedMode);
    }

    normalizeMode(mode) {
        return mode === "draft" ? "draft" : "random";
    }

    handleEscapeRoll(client) {
        console.log(`Received escape_roll message from ${client.sessionId}`);
        this.room.broadcast('game_action', { action: 'animate_roll', playerId: client.sessionId });
        const { escapeRoll, escapeModifier } = this.state.wantToEscape(client.sessionId);
        if (escapeRoll) { // if allowed to escape roll
            setTimeout(() => {
                console.log(`Broadcast escape_roll result for ${client.sessionId}:`, { escapeRoll, escapeModifier });
                this.state.tryToEscape(client.sessionId, escapeRoll + escapeModifier);
                this.room.broadcast('game_action', { action: 'roll_result', result: escapeRoll, modifier: escapeModifier });
            }, 1000); // 1000 milliseconds delay
        }
    }
}

module.exports = GameController;
