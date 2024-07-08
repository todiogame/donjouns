export class Card {
    constructor(id) {
        this.id = id;
        this.texture = 'items_' + String(id).padStart(3, '0');
    }
}

export class Player {
    constructor(name) {
        this.name = name;
        this.hand = [];
        this.selectedCards = [];
    }

    addCard(card) {
        this.hand.push(card);
    }

    selectCard(index) {
        return this.hand.splice(index, 1)[0]; // Correctly remove and return the card
    }
}

export class Game {
    constructor() {
        this.deck = [];
        this.players = [];
        this.currentPlayerIndex = 0;
    }

    initializeDeck() {
        for (let i = 1; i <= 100; i++) {
            this.deck.push(new Card(i));
        }
        Phaser.Utils.Array.Shuffle(this.deck);
    }

    addPlayer(player) {
        this.players.push(player);
    }

    dealCards() {
        for (let i = 0; i < 7; i++) { // Change to 7 items
            this.players.forEach(player => {
                player.addCard(this.deck.pop());
            });
        }
    }

    nextPlayer() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    }
}
