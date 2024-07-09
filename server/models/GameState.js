const schema = require("@colyseus/schema");
const { Schema, type, ArraySchema } = schema;
const ItemCard = require('./ItemCard');
const Player = require('./Player');
const DungeonCard = require('./DungeonCard');

const fs = require('fs');
const path = require('path');

const configPath = path.resolve(__dirname, '../config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const { nb_items_deck, nb_items_draft, nb_items_starting } = config;

class GameState extends Schema {
    constructor() {
        super();
        this.phase = "WAITING";
        this.itemDeck = new ArraySchema();
        this.players = new ArraySchema();
        this.currentPlayerIndex = 0;
        this.dungeon = new ArraySchema();
        this.dungeonLength = 0;
        this.discardPile = new ArraySchema();
        this.turnNumber = 0;
    }

    initializeDeck() {
        for (let i = 1; i <= nb_items_deck; i++) {
            this.itemDeck.push(new ItemCard(i));
        }
        this.shuffleDeck();
    }

    shuffleDeck() {
        for (let i = this.itemDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.itemDeck[i], this.itemDeck[j]] = [this.itemDeck[j], this.itemDeck[i]];
        }
    }

    addPlayer(player) {
        this.players.push(player);
    }

    dealCards() {
        for (let i = 0; i < nb_items_draft; i++) {
            this.players.forEach(player => {
                player.addItemCard(this.itemDeck.pop());
            });
        }
    }

    allPlayersSelected() {
        return this.players.every(player => player.selectedItemCardIndex !== -1);
    }

    addSelectedItemCardsToStuff() {
        this.players.forEach(player => {
            const itemCard = player.pickCard();
            if (itemCard) {
                player.selectedItemCards.push(itemCard);
            }
        });
    }

    nextPlayer() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    }

    rotateHands() {
        const lastHand = this.players[this.players.length - 1].hand.slice();
        for (let i = this.players.length - 1; i > 0; i--) {
            this.players[i].hand.clear();
            this.players[i].hand.push(...this.players[i - 1].hand);
        }
        this.players[0].hand.clear();
        this.players[0].hand.push(...lastHand);
    }

    discardHands() {
        this.players.forEach(p => p.hand.clear());
    }

    setUpDungeonGame() {
        this.phase = "GAME";
        this.dungeonLength = 50;
    }
}

schema.defineTypes(GameState, {
    phase: "string",
    itemDeck: [ItemCard],
    players: [Player],
    currentPlayerIndex: "number",
    dungeon: [DungeonCard],
    dungeonLength: "number",
    discardPile: [DungeonCard],
    turnNumber: "number"
});

module.exports = GameState;
