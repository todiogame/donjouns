const { GameState } = require('../models/GameState');
const { Player } = require('../models/Player');
const BotAI = require('./BotAI');
const fs = require('fs');
const path = require('path');

const configPath = path.resolve(__dirname, '../config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const nbItemsStarting = config.nb_items_starting;
const nbItemsRandomMode = typeof config.nb_items_random_mode === "number"
    ? config.nb_items_random_mode
    : nbItemsStarting;

const ESCAPE_ROLL_ANIMATION_DELAY_MS = 1800;

class GameController {
    constructor(room, minPlayersToStart) {
        this.room = room;
        this.state = new GameState(room);
        this.room.setState(this.state);
        this.minPlayersToStart = minPlayersToStart ?? room.maxClients;
        this.gameStarted = false;
        this.currentMode = null;
        this.botAI = new BotAI();
    }

    initialize(options) {
        this.room.allDungeonCards = options.dungeon || [];
        this.room.allItemsCards = options.itemsCards || [];
        this.room.gameController = this; // Store reference for bot AI

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

        // Auto-setup items for bots
        this.state.players.filter(p => p.isBot).forEach(bot => {
            bot.stuff.forEach(item => {
                if (item.requireSetup && !item.indication) {
                    // Set a random indication for bot setup items (must be string)
                    item.indication = (Math.floor(Math.random() * 6) + 1).toString();
                    console.log(`Bot ${bot.name} auto-setup item ${item.title} with value ${item.indication}`);
                }
            });
        });

        if (this.state.allPlayersSetupReady()) {
            this.state.gameLoop();
            this.triggerBotTurnIfNeeded();
        }
        this.room.broadcast("start_game_random", this.state);
    }

    startDraftPhase() {
        this.state.phase = "DRAFT";
        this.state.dealItemsCardsDraft();
        this.room.broadcast("start_game", this.state);

        // Trigger bots to make selections
        setTimeout(() => {
            this.botAI.processBotDraftTurns(this);
        }, 1000);
    }

    finishDraftPhase() {
        this.state.discardHands();
        this.room.broadcast("end_draft", this.state);
        setTimeout(() => {
            this.state.setUpAndPlayDungeon(this.room.allDungeonCards);
            this.room.broadcast("start_game_random", this.state);
            this.triggerBotTurnIfNeeded();
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
                // Trigger bots for next selection round
                setTimeout(() => {
                    this.botAI.processBotDraftTurns(this);
                }, 500);
            } else {
                this.finishDraftPhase();
            }
        } else {
            // Trigger remaining bots to select
            setTimeout(() => {
                this.botAI.processBotDraftTurns(this);
            }, 300);
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
                this.triggerBotTurnIfNeeded();
                break;
            case "special_effect":
                this.state.specialEffect(client.sessionId, message?.arg);
                break;
            case "pass_turn": {
                const result = this.state.wantToPassTurn(client.sessionId);
                if (result instanceof Promise) {
                    result.catch(err => console.error("Error while passing turn:", err));
                }
                break;
            }
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
            {
                const result = this.state.dealWithEvent(client.sessionId, true, message?.arg);
                if (result instanceof Promise) {
                    result
                        .then(() => this.triggerBotTurnIfNeeded())
                        .catch(err => console.error("Error while accepting event:", err));
                } else {
                    this.triggerBotTurnIfNeeded();
                }
                break;
            }
            case "decline_event":
            {
                const result = this.state.dealWithEvent(client.sessionId, false, message?.arg);
                if (result instanceof Promise) {
                    result
                        .then(() => this.triggerBotTurnIfNeeded())
                        .catch(err => console.error("Error while declining event:", err));
                } else {
                    this.triggerBotTurnIfNeeded();
                }
                break;
            }
            case "soulstorm_pick":
                this.state.submitSoulstormChoice(client.sessionId, message?.cardId ?? message?.arg);
                break;
            case "add_bot":
                this.addBot(client.sessionId);
                break;
            case "replay":
                this.handleReplayRequest(client.sessionId);
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

    addBot(requesterId) {
        const hostId = this.state.hostId;
        if (!hostId || hostId !== requesterId) {
            console.log(`addBot failed: ${requesterId} is not host (${hostId})`);
            return;
        }
        if (this.state.players.length >= this.room.maxClients) {
            console.log(`addBot failed: Room full (${this.state.players.length}/${this.room.maxClients})`);
            return;
        }
        console.log("Adding bot via GameController...");
        this.state.addBot();
    }

    normalizeMode(mode) {
        return mode === "draft" ? "draft" : "random";
    }

    triggerBotTurnIfNeeded() {
        if (this.state.phase !== "GAME_LOOP") {
            return;
        }
        const currentPlayer = this.state.getCurrentPlayer();
        if (currentPlayer && currentPlayer.isBot) {
            console.log(`Triggering bot turn for ${currentPlayer.name}`);
            this.botAI.autoPlayDungeon(currentPlayer, this.state, this.room);
        }
    }

    handleEscapeRoll(client) {
        console.log(`Received escape_roll message from ${client.sessionId}`);
        this.room.broadcast('game_action', { action: 'animate_roll', playerId: client.sessionId, rollType: 'escape' });
        const { escapeRoll, escapeModifier } = this.state.wantToEscape(client.sessionId);
        if (escapeRoll) { // if allowed to escape roll
            setTimeout(() => {
                console.log(`Broadcast escape_roll result for ${client.sessionId}:`, { escapeRoll, escapeModifier });
                this.state.tryToEscape(client.sessionId, escapeRoll + escapeModifier);
                this.room.broadcast('game_action', { action: 'roll_result', result: escapeRoll, modifier: escapeModifier, rollType: 'escape' });

                // Check if next player is bot (e.g. if escape failed or succeeded and turn passed)
                this.triggerBotTurnIfNeeded();
            }, ESCAPE_ROLL_ANIMATION_DELAY_MS);
        }
    }

    handleReplayRequest(clientId) {
        if (this.state.phase !== "END") {
            return;
        }
        const requester = this.state.findPlayerById(clientId);
        if (!requester) {
            return;
        }
        this.state.resetForNextGame(this.room.allItemsCards || []);
        this.gameStarted = false;
        this.currentMode = null;
    }
}

module.exports = GameController;
