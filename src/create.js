import { Client } from "colyseus.js";
import { Game, Player } from './classes';
import { DisplayManager } from './display';
let cardGame;
let displayManager;
let client;
let room;
let localPlayerId;

export function create() {
    console.log("Creating the scene...");

    this.playcardSound = this.sound.add('playcard');
    this.drawSound = this.sound.add('draw');
    this.shuffleSound = this.sound.add('shuffle');
    this.rollDieSound = this.sound.add('rolldie');

    this.shuffleSound.play();

    client = new Client("ws://localhost:2567");

    client.joinOrCreate("room").then(roomInstance => {
        room = roomInstance;
        localPlayerId = room.sessionId;
        console.log(room.sessionId, "joined", room.name);

        room.onStateChange((state) => {
            console.log("New state:", state);
            updateGameState(state);
        });

        room.onMessage("start_game", (state) => {
            console.log("Received start_game message:", state);
            cardGame = new Game(); // Initialize the card game
            updateGameState(state);

            displayManager.displayTitle("Le Draft démarre !")
        });
        room.onMessage("start_game_random", (state) => {
            console.log("Received start_game_random message:", state);
            cardGame = new Game(); // Initialize the card game
            updateGameState(state);

            displayManager.displayTitle("La partie démarre !")

        });
        room.onMessage("end_draft", (state) => {
            displayManager.displayTitle("Fin du Draft !")
        });

        room.onMessage("animate_roll", (message) => {
            cardGame.isDiceRolling = true; // Set flag to disable interactions during dice roll
            displayManager.updateGameUI(cardGame, localPlayerId, cardGame.phase);
            this.rollDieSound.play();
            const playerId = message.playerId
            displayManager.displayDice(displayManager.getPlayerPositionAroundTable(playerId, localPlayerId, cardGame.players))
        });


        room.onMessage("animate_execute", () => {
            const animScene = this.game.scene.getScene('AnimScene');
            if (animScene) animScene.executeAnimation();
        });

        // Handle dice roll results from the server
        room.onMessage('roll_result', (message) => {
            const diceScene = this.game.scene.getScene('DiceScene');
            console.log("rolled a", message.result)
            if (diceScene) diceScene.showDiceResult(message.result, message.modifier);
            cardGame.isDiceRolling = false; // Re-enable interactions after dice roll completes
            if (cardGame.phase.includes("GAME")) displayManager.updateGameUI(cardGame, localPlayerId, cardGame.phase);
        });

        room.onMessage("endScores", (message) => {
            console.log("Received end scores data:", message);
            const { winner, finalPlayers } = message;
            cardGame.winner = winner;
            cardGame.finalPlayers = finalPlayers;
            displayManager.updateEndUI(cardGame.winner, cardGame.finalPlayers, localPlayerId);
        });


        room.onMessage("scout", (message) => {
            console.log("Received scout cards:", message);
            displayManager.displayScoutInterface(message.cards)
        });

        room.onMessage("scout_pick", (message) => {
            console.log("Received scout cards, pick 1:", message);
            const callback = (id) => room.send("scout_pick", { arg: id });
            displayManager.displayScoutInterface(message.cards, callback)
        });
    }).catch(e => {
        console.error("join error", e);
    });

    displayManager = new DisplayManager(this);
    displayManager.initializeBackground();

    this.input.on('pointerdown', (pointer, gameObjects) => {
        if (displayManager.zoomedItemCard) {
            displayManager.closeZoom();
        } else if (cardGame.isDiceRolling) {
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
                    if (cardGame.currentCard.effect === "GLUTTONOUS_OOZE"
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
                    if (cardGame.currentCard.effect === "SECRET_SHOP"
                        && (cardGame.players.find(p => p.id === localPlayerId).stuff.filter(i => !i.broken).length > 3)) {
                        console.log("Pick an item to discard:");
                        const callback = (number) => room.send("accept_event", { arg: number });
                        displayManager.displayPickItemInterface(cardGame, localPlayerId, (i) => !i.broken, callback, true)
                    }
                    // special case for HANDYMAN: have to fix 1 item
                    else if (cardGame.currentCard.effect === "HANDYMAN"
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

    function copyPlayerState(playerState) {
        const player = new Player(playerState.id, playerState.name);
        player.hand = playerState.hand; // Direct assignment
        player.stuff = playerState.stuff; // Direct assignment
        player.selectedCardIndex = playerState.selectedCardIndex;
        player.medals = playerState.medals;
        player.hp = playerState.hp;
        player.baseHP = playerState.baseHP;
        player.canPass = playerState.canPass;
        player.defeatedMonstersPile = playerState.defeatedMonstersPile; // Direct assignment
        player.score = playerState.score;
        player.dead = playerState.dead;
        player.fled = playerState.fled;
        player.monstersBeatenThisTurn = playerState.monstersBeatenThisTurn;
        return player;
    }
    function updateGameState(state) {
        if (!cardGame) {
            console.log("cardGame is not yet initialized");
            return;
        }

        cardGame.phase = state.phase;
        cardGame.players = state.players.map(copyPlayerState);
        cardGame.itemDeck = state.itemDeck; // Direct assignment
        cardGame.currentPlayerIndex = state.currentPlayerIndex;
        cardGame.dungeon = state.dungeon; // Direct assignment
        cardGame.dungeonLength = state.dungeonLength;
        cardGame.currentCard = state.currentCard;
        cardGame.canTryToEscape = state.canTryToEscape;
        cardGame.canExecute = state.canExecute;
        cardGame.discardPile = state.discardPile; // Direct assignment
        cardGame.turnNumber = state.turnNumber;

        if (cardGame.phase === "DRAFT") {
            displayManager.updateDraftingUI(cardGame.players, localPlayerId);
        } else if (cardGame.phase.includes("GAME")) {
            displayManager.updateGameUI(cardGame, localPlayerId, cardGame.phase);
        }
        else if (cardGame.phase === "END") {
            displayManager.updateEndUI(cardGame.winner, cardGame.finalPlayers, localPlayerId);
        }
    }
}
