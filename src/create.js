import { Game, Player } from './classes';
import { DisplayManager } from './display';

const GAME_MODE_OPTIONS = [
    {
        key: "live:random",
        label: "Live Random",
        description: "Table multijoueur, objets aleatoires."
    },
    {
        key: "live:draft",
        label: "Live Draft",
        description: "Table multijoueur avec draft."
    },
    {
        key: "solo:random",
        label: "Solo + Bots",
        description: "Un joueur humain avec bots, objets aleatoires."
    },
    {
        key: "solo:draft",
        label: "Solo Draft",
        description: "Un joueur humain avec bots et draft."
    },
    {
        key: "autoplay:random",
        label: "Autoplay",
        description: "Simulation visuelle pilotee par l'IA."
    },
    {
        key: "autoplay:draft",
        label: "Autoplay Draft",
        description: "Draft et partie pilotes par l'IA."
    }
];

class NativeRoom {
    constructor(socket) {
        this.socket = socket;
        this.sessionId = "";
        this.name = "room";
        this.stateHandlers = [];
        this.messageHandlers = new Map();
        this.pendingStates = [];
        this.pendingMessages = [];
    }

    send(type, message = {}) {
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type, message }));
        }
    }

    onStateChange(callback) {
        this.stateHandlers.push(callback);
        while (this.pendingStates.length) {
            callback(this.pendingStates.shift());
        }
    }

    onMessage(type, callback) {
        if (!this.messageHandlers.has(type)) {
            this.messageHandlers.set(type, []);
        }
        this.messageHandlers.get(type).push(callback);
        const remaining = [];
        this.pendingMessages.forEach((entry) => {
            if (entry.type === type) callback(entry.message);
            else remaining.push(entry);
        });
        this.pendingMessages = remaining;
    }

    dispatch(payload) {
        if (payload.type === "state") {
            const state = payload.state;
            if (this.stateHandlers.length) this.stateHandlers.forEach(callback => callback(state));
            else this.pendingStates.push(state);
            return;
        }

        const messageType = payload.type;
        const message = payload.message ?? {
            winner: payload.winner,
            finalPlayers: payload.finalPlayers
        };
        const handlers = this.messageHandlers.get(messageType) || [];
        if (handlers.length) handlers.forEach(callback => callback(message));
        else this.pendingMessages.push({ type: messageType, message });
    }
}

class NativeBackendClient {
    constructor(endpoint) {
        this.endpoint = endpoint;
    }

    joinOrCreate() {
        return new Promise((resolve, reject) => {
            const socket = new WebSocket(this.endpoint);
            const room = new NativeRoom(socket);
            let joined = false;

            socket.onmessage = (event) => {
                const payload = JSON.parse(event.data);
                if (payload.type === "joined") {
                    room.sessionId = payload.sessionId;
                    room.name = payload.roomName || "room";
                    joined = true;
                    resolve(room);
                    return;
                }
                room.dispatch(payload);
            };

            socket.onerror = (event) => {
                if (!joined) reject(event);
                else console.error("WebSocket error", event);
            };

            socket.onclose = () => {
                console.log("WebSocket closed");
            };
        });
    }
}

const PLAYER_NAME_STORAGE_KEY = "donjouns_player_name";
let cachedStoredPlayerName;

function getStoredPlayerName() {
    if (cachedStoredPlayerName !== undefined) {
        return cachedStoredPlayerName;
    }
    cachedStoredPlayerName = "";
    if (typeof window !== "undefined" && window.localStorage) {
        try {
            cachedStoredPlayerName = window.localStorage.getItem(PLAYER_NAME_STORAGE_KEY) || "";
        } catch (err) {
            console.warn("Unable to read stored player name", err);
            cachedStoredPlayerName = "";
        }
    }
    return cachedStoredPlayerName;
}

function persistPlayerName(name) {
    cachedStoredPlayerName = name;
    if (typeof window !== "undefined" && window.localStorage) {
        try {
            if (name) {
                window.localStorage.setItem(PLAYER_NAME_STORAGE_KEY, name);
            } else {
                window.localStorage.removeItem(PLAYER_NAME_STORAGE_KEY);
            }
        } catch (err) {
            console.warn("Unable to store player name", err);
        }
    }
}

function isDefaultPlayerName(name) {
    if (!name) return true;
    return /^Player\s+\d+$/i.test(name.trim());
}

const ADJECTIVES = ["Vif", "Puissant", "Sage", "Furtif", "Brave", "Joyeux", "Sombre", "Lumineux", "Rouge", "Bleu"];
const NOUNS = ["Guerrier", "Mage", "Voleur", "Paladin", "Gobelin", "Dragon", "Chevalier", "Sorcier", "Elfe", "Nain"];

function generateRandomName() {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    return `${noun} ${adj}`;
}

let cardGame;
let displayManager;
let client;
let room;
let localPlayerId;

export function create() {
    console.log("Creating the scene...");
    cardGame = new Game();

    this.playcardSound = this.sound.add('playcard');
    this.drawSound = this.sound.add('draw');
    this.shuffleSound = this.sound.add('shuffle');
    this.rollDieSound = this.sound.add('rolldie');
    this.runningSound = this.sound.add('running');

    this.shuffleSound.play();

    client = new NativeBackendClient("ws://localhost:2567/ws");

    displayManager = new DisplayManager(this);
    displayManager.initializeBackground();

    const resetToLobby = () => {
        if (room) {
            room.send("replay");
        } else {
            this.scene.restart();
        }
    };
    const openEndScreen = () => displayManager.updateEndUI(cardGame.winner, cardGame.finalPlayers, localPlayerId, {
        onReplay: resetToLobby,
        onExit: resetToLobby
    });

    const setupRoomListeners = (roomInstance) => {
        room = roomInstance;
        localPlayerId = room.sessionId;
        console.log(room.sessionId, "joined", room.name);

        let storedName = getStoredPlayerName();
        if (!storedName) {
            storedName = generateRandomName();
            persistPlayerName(storedName);
        }
        if (storedName) {
            room.send("set_name", { name: storedName });
        }

        room.onStateChange((state) => {
            console.log("New state:", state);
            updateGameState(state);
        });

        room.onMessage("start_game", (state) => {
            console.log("Received start_game message:", state);
            cardGame = new Game(); // Initialize the card game
            updateGameState(state);
            displayManager.displayTitle("Le Draft demarre !");
        });

        room.onMessage("start_game_random", (state) => {
            console.log("Received start_game_random message:", state);
            cardGame = new Game(); // Initialize the card game
            updateGameState(state);
            displayManager.displayTitle("La partie demarre !");
        });

        room.onMessage("end_draft", (state) => {
            displayManager.displayTitle("Fin du Draft !");
        });

        room.onMessage("endScores", (message) => {
            console.log("Received end scores data:", message);
            cardGame.winner = message.winner;
            cardGame.finalPlayers = message.finalPlayers;
            displayManager.showEndScreenPrompt(openEndScreen, true);
        });

        // Consolidated game_action message handler
        room.onMessage("game_action", (message) => {
            switch (message.action) {
                case "animate_roll":
                    cardGame.isDiceRolling = true;
                    displayManager.updateGameUI(cardGame, localPlayerId);
                    if (message.rollType === "escape") {
                        this.runningSound?.play();
                    }
                    this.rollDieSound.play();
                    displayManager.displayDice(displayManager.getPlayerPositionAroundTable(message.playerId, localPlayerId, cardGame.players));
                    break;
                case "animate_execute":
                    const animScene = this.game.scene.getScene('AnimScene');
                    if (animScene) animScene.executeAnimation();
                    break;
                case "item_used":
                    displayManager.playItemUseEffect(message);
                    break;
                case "roll_result":
                    const diceScene = this.game.scene.getScene('DiceScene');
                    console.log("rolled a", message.result);
                    if (diceScene) diceScene.showDiceResult(message.result, message.modifier);
                    cardGame.isDiceRolling = false;
                    if (cardGame.phase.includes("GAME")) displayManager.updateGameUI(cardGame, localPlayerId);
                    break;
                case "scout":
                    displayManager.displayScoutInterface(message.cards);
                    break;
                case "scout_pick":
                    console.log("Received scout cards, pick 1:", message);
                    const callback = (id) => room.send("scout_pick", { arg: id });
                    displayManager.displayScoutInterface(message.cards, callback);
                    break;
                case "soulstorm_pick": {
                    const cards = message.cards || [];
                    if (cards.length === 1) {
                        room.send("soulstorm_pick", { cardId: cards[0].id });
                        break;
                    }
                    const pickCard = (id) => room.send("soulstorm_pick", { cardId: id });
                    displayManager.displayScoutInterface(cards, pickCard);
                    break;
                }
                default:
                    console.error("Unknown game action:", message.action);
                    break;
            }
        });
    };

    client.joinOrCreate("room").then(setupRoomListeners).catch(e => {
        console.error("join error", e);
    });

    this.input.on('pointerdown', (pointer, gameObjects) => {
        if (displayManager.zoomedItemCard) {
            displayManager.closeZoom();
            return;
        }

        if (!room) {
            return;
        }

        if (!cardGame || cardGame.phase === "WAITING") {
            return; // Ignore input until the game state is available
        }

        if (cardGame.isDiceRolling) {
            return; // Disable interactions during dice roll
        }
        else if (gameObjects.length > 0) {
            if (cardGame.phase === "DRAFT") {
                const cardImage = gameObjects[0];
                if (cardImage.isInStuff) {
                    displayManager.zoomCard(cardImage);
                } else if (cardImage.isPlayer) {
                    const cardIndex = cardImage.cardIndex;
                    const currentPlayer = cardGame.players.find(p => p.id === localPlayerId);
                    console.log(`Sending select_card message: { action: "select_card", cardIndex: ${cardIndex} }`);
                    room.send("select_card", { cardIndex: cardIndex });

                    // Highlight the selected card
                    currentPlayer.hand.forEach(c => c.isPicked = false);
                    currentPlayer.hand[cardIndex].isPicked = true;
                    console.log(cardIndex, "picked")
                    displayManager.updateDraftingUI(cardGame.players, localPlayerId);
                }
            }
            else if (cardGame.phase.includes("GAME")) {
                const clickedElement = gameObjects[0];
                console.log(clickedElement)
                if (clickedElement.getData("type") === "dungeon") {
                    console.log("pick donjon")
                    room.send("pick_dungeon");
                } else if (clickedElement.getData("type") === "take_damage") {
                    console.log(`Player takes ${cardGame.currentCard.damage} damage.`);
                    // special case for GLUTTONOUS_OOZE: have to destroy 1 item
                    if ((cardGame.currentCard.effect === "GLUTTONOUS_OOZE" || cardGame.currentCard.effect === "LIMON")
                        && (cardGame.players.find(p => p.id === localPlayerId).stuff.filter(i => !i.broken).length)) {
                        console.log("Pick an item to ooze:");
                        const callback = (number) => room.send("take_damage", { arg: number });
                        displayManager.displayPickItemInterface(cardGame, localPlayerId, (i) => !i.broken, callback, true)
                    }
                    else room.send("take_damage")
                } else if (clickedElement.getData("type") === "pass_turn") {
                    room.send("pass_turn")
                } else if (clickedElement.getData("type") === "execute") {
                    room.send("execute")
                } else if (clickedElement.getData("type") === "special_effect") {
                    // special case for SHAPESHIFTER: have to destroy 1 item
                    if (cardGame.currentCard.effect === "SHAPESHIFTER") {
                        console.log("Pick a type:");
                        const callback = (type) => room.send("special_effect", { arg: type });
                        displayManager.displayMonsterTypeSelectionInterface(cardGame.currentCard, callback)
                    }
                    else room.send("special_effect")
                } else if (clickedElement.getData("type") === "opponent_item") {
                    displayManager.zoomCard(clickedElement);
                } else if (clickedElement.getData("type") === "my_item") {
                    let itemId = clickedElement.getData("item_id")
                    if (clickedElement.getData("ui") && !clickedElement.getData("broken")) {
                        let item = cardGame.getPlayerById(localPlayerId)?.stuff.find(item => item.id === itemId);
                        displayInterface(clickedElement, item, room);
                    } else {
                        room.send("use_item", { item_id: itemId });
                    }
                } else if (clickedElement.getData("type") === "escape_roll") {
                    room.send("escape_roll")
                } else if (clickedElement.getData("type") === "accept_event") {
                    // special case for SECRET_SHOP: have to discard 1 item
                    if ((cardGame.currentCard.effect === "SECRET_SHOP" || cardGame.currentCard.effect === "SHOP")
                        && (cardGame.players.find(p => p.id === localPlayerId).stuff.filter(i => !i.broken).length > 3)) {
                        console.log("Pick an item to discard:");
                        const callback = (number) => room.send("accept_event", { arg: number });
                        displayManager.displayPickItemInterface(cardGame, localPlayerId, (i) => !i.broken, callback, true)
                    }
                    // special case for HANDYMAN: have to fix 1 item
                    else if ((cardGame.currentCard.effect === "HANDYMAN" || cardGame.currentCard.effect === "REPAIR")
                        && (cardGame.players.find(p => p.id === localPlayerId).stuff.filter(i => i.broken).length)) {
                        console.log("Pick an item to fix:");
                        const callback = (number) => room.send("accept_event", { arg: number });
                        displayManager.displayPickItemInterface(cardGame, localPlayerId, (i) => i.broken, callback, true)
                    }
                    else room.send("accept_event")
                } else if (clickedElement.getData("type") === "decline_event") {
                    room.send("decline_event")
                }
            }
        }
    });
    function displayInterface(cardImage, item, room) {
        const uiType = cardImage.getData("ui");
        const itemId = cardImage.getData("item_id");

        const callback = (number) => {
            console.log("use_item", { item_id: itemId, arg: number });
            room.send("use_item", { item_id: itemId, arg: number });
        };

        if (uiType === "number") {
            displayManager.displayNumberInputInterface(item, callback);
        } else if (uiType === "monster_type") {
            displayManager.displayMonsterTypeSelectionInterface(item, callback);
        } else if (uiType === "my_pile") {
            const defeatedMonstersPile = cardGame.getPlayerById(localPlayerId)?.defeatedMonstersPile;
            if (defeatedMonstersPile.length) displayManager.displayScoutInterface(defeatedMonstersPile, callback);
        } else if (uiType === "my_items_intact") {
            const condition = (i) => !i.broken && i.id != item.id;
            if (cardGame.players.find(p => p.id === localPlayerId).stuff.some(i => !i.broken && item.id != i.id))
                displayManager.displayPickItemInterface(cardGame, localPlayerId, condition, callback, true);
        } else if (uiType === "my_items_broken") {
            const condition = (i) => i.broken;
            if (cardGame.players.find(p => p.id === localPlayerId).stuff.some(i => i.broken))
                displayManager.displayPickItemInterface(cardGame, localPlayerId, condition, callback, true);
        } else if (uiType === "opponent_items_broken") {
            const condition = (i) => i.broken;
            if (cardGame.players.filter(p => p.id != localPlayerId).some(p => p.stuff.some(i => i.broken)))
                displayManager.displayPickItemInterface(cardGame, localPlayerId, condition, callback, false);
        }
    }

    function cloneItemCard(cardState) {
        if (!cardState) return null;
        return {
            id: cardState.id,
            _id: cardState._id,
            texture: cardState.texture,
            title: cardState.title,
            active: cardState.active,
            color: cardState.color,
            key: cardState.key,
            description: cardState.description,
            hp: cardState.hp,
            broken: cardState.broken,
            requireSetup: cardState.requireSetup,
            ui: cardState.ui,
            indication: cardState.indication,
            canBeUsed: cardState.canBeUsed,
            usageCounter: cardState.usageCounter
        };
    }

    function cloneDungeonCard(cardState) {
        if (!cardState) return null;
        const base = {
            id: cardState.id,
            _id: cardState._id,
            texture: cardState.texture,
            title: cardState.title,
            dungeonCardType: cardState.dungeonCardType,
            description: cardState.description,
            effect: cardState.effect
        };
        if (cardState.dungeonCardType === "monster") {
            return {
                ...base,
                power: cardState.power,
                types: Array.from(cardState.types || []),
                damage: cardState.damage,
                timesDealDamage: cardState.timesDealDamage,
                specialUI: cardState.specialUI
            };
        }
        if (cardState.dungeonCardType === "event") {
            return {
                ...base,
                event: !!cardState.event,
                optional: !!cardState.optional
            };
        }
        return base;
    }

    function copyPlayerState(playerState) {
        const player = new Player(playerState.id, playerState.name, playerState.isBot);
        player.heroName = playerState.heroName || "";
        player.hand = Array.from(playerState.hand || []).map(cloneItemCard);
        player.stuff = Array.from(playerState.stuff || []).map(cloneItemCard);
        player.selectedItemCardIndex = playerState.selectedItemCardIndex ?? -1;
        player.medals = playerState.medals;
        player.hp = playerState.hp;
        player.baseHP = playerState.baseHP;
        player.canPass = playerState.canPass;
        player.defeatedMonstersPile = Array.from(playerState.defeatedMonstersPile || []).map(cloneDungeonCard);
        player.score = playerState.score;
        player.dead = playerState.dead;
        player.fled = playerState.fled;
        player.monstersBeatenThisTurn = playerState.monstersBeatenThisTurn;
        return player;
    }
    function updateGameState(state) {
        cardGame.phase = state.phase;
        cardGame.players = Array.from(state.players || []).map(copyPlayerState);
        console.log(`updateGameState: ${cardGame.players.length} players`);
        cardGame.itemDeck = Array.from(state.itemDeck || []).map(cloneItemCard);
        cardGame.currentPlayerIndex = state.currentPlayerIndex;
        cardGame.dungeon = Array.from(state.dungeon || []).map(cloneDungeonCard);
        cardGame.dungeonLength = state.dungeonLength;
        cardGame.currentCard = cloneDungeonCard(state.currentCard);
        cardGame.canTryToEscape = state.canTryToEscape;
        cardGame.canExecute = state.canExecute;
        cardGame.discardPile = Array.from(state.discardPile || []).map(cloneDungeonCard);
        cardGame.turnNumber = state.turnNumber;
        cardGame.trap = state.trap;
        cardGame.logs = Array.from(state.logs || []);

        if (cardGame.phase !== "END") {
            displayManager.clearEndScreenPrompt();
        }

        if (cardGame.phase === "WAITING") {
            const minPlayersToStart = state.minPlayersToStart || state.maxPlayers || cardGame.players.length || 1;
            const maxPlayers = state.maxPlayers || minPlayersToStart;
            const localPlayer = cardGame.getPlayerById?.(localPlayerId) || cardGame.players.find(p => p.id === localPlayerId);
            const storedName = getStoredPlayerName();
            const resolvedName = localPlayer && !isDefaultPlayerName(localPlayer.name)
                ? localPlayer.name
                : storedName;

            displayManager.updateLobby(cardGame.players, localPlayerId, {
                hostId: state.hostId || (cardGame.players[0]?.id ?? ""),
                minPlayersToStart,
                maxPlayers,
                startModes: GAME_MODE_OPTIONS,
                selectedMode: state.gameMode,
                onStartMode: (modeKey) => {
                    if (room) {
                        room.send("start_game_request", { mode: modeKey });
                    }
                },
                onAddBot: () => {
                    if (room) {
                        room.send("add_bot");
                    }
                },
                nameInput: {
                    value: resolvedName,
                    placeholder: "Ton pseudo",
                    onSubmit: (value) => {
                        const trimmed = (value || "").trim();
                        if (!trimmed) {
                            return;
                        }
                        persistPlayerName(trimmed);
                        if (room) {
                            room.send("set_name", { name: trimmed });
                        }
                    }
                }
            });
            return;
        }

        displayManager.hideNameInput();

        if (cardGame.phase === "DRAFT") {
            displayManager.updateDraftingUI(cardGame.players, localPlayerId);
        } else if (cardGame.phase.includes("GAME")) {
            displayManager.updateGameUI(cardGame, localPlayerId);
        } else if (cardGame.phase === "END") {
            displayManager.updateGameUI(cardGame, localPlayerId, { allowActions: false });
            displayManager.showEndScreenPrompt(openEndScreen, !!cardGame.finalPlayers);
        }
    }
}
