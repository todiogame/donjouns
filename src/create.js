import { Client } from "colyseus.js";
import { Game, Player } from './classes';
import { DisplayManager } from './display';

let cardGame;
let displayManager;
let client;
let room;
let currentPlayerId;

export function create() {
    console.log("Creating the scene...");

    this.playcardSound = this.sound.add('playcard');
    this.drawSound = this.sound.add('draw');
    this.shuffleSound = this.sound.add('shuffle');

    this.shuffleSound.play();

    client = new Client("ws://localhost:2567");

    client.joinOrCreate("my_room").then(roomInstance => {
        room = roomInstance;
        currentPlayerId = room.sessionId;
        console.log(room.sessionId, "joined", room.name);

        room.onStateChange((state) => {
            console.log("New state:", state);
            updateGameState(state);
        });

        room.onMessage("start_game", (state) => {
            console.log("Received start_game message:", state);
            cardGame = new Game(); // Initialize the itemCard game
            updateGameState(state);

            displayManager.displayTitle("Le Draft démarre !")
        });
        room.onMessage("end_draft", (state) => {
            displayManager.displayTitle("Fin du Draft !")
        });

        
    }).catch(e => {
        console.error("join error", e);
    });

    displayManager = new DisplayManager(this);
    displayManager.initializeBackground();

    this.input.on('pointerdown', (pointer, gameObjects) => {
        if (displayManager.zoomedItemCard) {
            displayManager.closeZoom();
        } else if (gameObjects.length > 0) { // Check if the itemCard has already been picked
            const cardImage = gameObjects[0];
    
            if (cardImage.isInStuff) {
                displayManager.zoomCard(cardImage);
            } else if (cardImage.isPlayer) {
                const cardIndex = cardImage.cardIndex;
                const currentPlayer = cardGame.players.find(p => p.id === currentPlayerId);
    
                if (!currentPlayer) {
                    console.error(`Player with id ${currentPlayerId} not found`);
                    return;
                }
    
                console.log(`Sending select_card message: { action: "select_card", cardIndex: ${cardIndex} }`);
                room.send("select_card", { cardIndex: cardIndex });
    
                // Highlight the selected itemCard
                currentPlayer.hand.forEach(c => c.isPicked = false);
                currentPlayer.hand[cardIndex].isPicked = true;
                console.log(cardIndex, "picked")
                displayManager.updateDraftingUI(cardGame.players, currentPlayerId);
            }
        }
    });
    
    function updateGameState(state) {
        console.log("updateGameState")
        if (!cardGame) {
            console.log("cardGame is not yet initialized");
            return;
        }
    
        cardGame.players = state.players.map(playerState => {
            const player = new Player(playerState.id, playerState.name);
            player.hand = playerState.hand;
            player.selectedItemCards = playerState.selectedItemCards;
            return player;
        });
    
        displayManager.updateDraftingUI(cardGame.players, currentPlayerId);
    }
    
}

