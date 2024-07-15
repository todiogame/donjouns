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
        // Handle dice roll results from the server
        room.onMessage('escapeRollResult', (message) => {
            const diceScene = this.game.scene.getScene('DiceScene');
            if (diceScene) {
                diceScene.showDiceResult(message.result);
            }
            cardGame.isDiceRolling = false; // Re-enable interactions after dice roll completes
        });

        room.onMessage("endScores", (message) => {
            console.log("Received end scores data:", message);
            const { winner, finalPlayers } = message;
            displayManager.updateEndUI(winner, finalPlayers, localPlayerId);
        });

        
        room.onMessage("scout", (message) => {
            console.log("Received scout cards:", message);
            displayManager.displayScoutInterface(message.cards)
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
                const cardImage = gameObjects[0];
                console.log(cardImage)
                if (cardImage.getData("type") === "dungeon") {
                    console.log("pick donjon")
                    room.send("pick_dungeon");
                    // displayManager.displayNumberInputInterface((number) => console.log(`Selected number: ${number}`))
                } else if (cardImage.getData("type") === "take_damage") {
                    console.log(`Player takes ${cardGame.currentCard.damage} damage.`);
                    room.send("take_damage")
                } else if (cardImage.getData("type") === "pass_turn") {
                    room.send("pass_turn")
                } else if (cardImage.getData("type") === "opponent_item") {
                    displayManager.zoomCard(cardImage);
                } else if (cardImage.getData("type") === "my_item") {
                    room.send("use_item", { item_id: cardImage.getData("item_id") })
                } else if (cardImage.getData("type") === "escape_roll") {
                    cardGame.isDiceRolling = true; // Set flag to disable interactions during dice roll
                    displayManager.updateGameUI(cardGame, localPlayerId);
                    this.rollDieSound.play();
                    displayManager.displayDice()
                    room.send("escape_roll")
                }
            }
        }
    });

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
        player.monstersAddedThisTurn = playerState.monstersAddedThisTurn;
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
        cardGame.discardPile = state.discardPile; // Direct assignment
        cardGame.turnNumber = state.turnNumber;

        if (cardGame.phase === "DRAFT") {
            displayManager.updateDraftingUI(cardGame.players, localPlayerId);
        } else if (cardGame.phase.includes("GAME")) {
            displayManager.updateGameUI(cardGame, localPlayerId);
        }
        //  else if (cardGame.phase === "END") {
        //     displayManager.updateEndUI(null, [], localPlayerId);
        // }
    }
}
