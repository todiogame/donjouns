import { Game, Player } from './classes';
import { DisplayManager } from './display';

let cardGame;
let displayManager;
let draftRounds = 6; // Number of rounds in the draft
let currentDraftRound = 0;

export function create() {
    console.log("Creating the scene...");

    this.playcardSound = this.sound.add('playcard');
    this.drawSound = this.sound.add('draw');
    this.shuffleSound = this.sound.add('shuffle');

    this.shuffleSound.play();


    cardGame = new Game();
    cardGame.initializeDeck();
    cardGame.addPlayer(new Player('Player 1'));
    cardGame.addPlayer(new Player('AI'));
    cardGame.addPlayer(new Player('AI2')); // Add the third player

    cardGame.players[0].isPlayer = true;
    cardGame.players[1].isPlayer = false;
    cardGame.players[1].id = 'AI';
    cardGame.players[2].id = 'AI2';

    cardGame.dealCards();


    displayManager = new DisplayManager(this);
    displayManager.initializeBackground();
    displayManager.updatePlayerHandsAndSelectedCards(cardGame.players);

    this.input.on('pointerdown', (pointer, gameObjects) => {
        if (displayManager.zoomedCard) {
            displayManager.closeZoom();
        } else if (gameObjects.length > 0) {
            const cardImage = gameObjects[0];

            if (cardImage.isInStuff) {
                displayManager.zoomCard(cardImage);
            } else if (cardImage.isPlayer) {
                const playerIndex = cardImage.isPlayer ? 0 : cardImage.cardIndex;
                const cardIndex = cardImage.cardIndex;

                if (playerIndex === 0 && cardGame.players[0].hand.length > 0) {
                    const card = cardGame.players[0].selectCard(cardIndex);
                    if (!card) {
                        console.error('Selected card is undefined');
                        return;
                    }
                    cardGame.players[0].selectedCards.push(card);
                    card.cardIndex = cardGame.players[0].selectedCards.length - 1;
                    card.isPlayer = true;
                    card.isSelected = true;
                    card.isInStuff = true;

                    // AI players select a random card if there are cards left
                    [1, 2].forEach(index => {
                        if (cardGame.players[index].hand.length > 0) {
                            const randomIndex = Math.floor(Math.random() * cardGame.players[index].hand.length);
                            const aiCard = cardGame.players[index].selectCard(randomIndex);
                            if (aiCard) {
                                cardGame.players[index].selectedCards.push(aiCard);
                                aiCard.cardIndex = cardGame.players[index].selectedCards.length - 1;
                                aiCard.isPlayer = false;
                                aiCard.isSelected = true;
                                aiCard.isInStuff = true;
                            } else {
                                console.error('AI selected card is undefined');
                            }
                        }
                    });

                    currentDraftRound++;
                    if (currentDraftRound >= draftRounds) {
                        endDraft();
                    } else {
                        // Swap hands only if there are cards left to swap
                        if (cardGame.players[0].hand.length > 0 || cardGame.players[1].hand.length > 0 || cardGame.players[2].hand.length > 0) {
                            [cardGame.players[0].hand, cardGame.players[1].hand, cardGame.players[2].hand] = [cardGame.players[1].hand, cardGame.players[2].hand, cardGame.players[0].hand];
                        }

                        displayManager.updatePlayerHandsAndSelectedCards(cardGame.players);
                    }
                }
            }
        }
    });
}

function endDraft() {
    cardGame.players.forEach(player => {
        player.hand = [];
    });
    console.log("Draft completed. All remaining cards have been discarded.");
    displayManager.updatePlayerHandsAndSelectedCards(cardGame.players);
}
