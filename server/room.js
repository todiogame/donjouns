const colyseus = require("colyseus");
const schema = require("@colyseus/schema");
const Schema = schema.Schema;
const type = schema.type;
const ArraySchema = schema.ArraySchema;
const fs = require('fs');
const path = require('path');

// Load config file
const configPath = path.resolve(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Access config parameters
const nb_players = config.nb_players;
const nb_items_deck = config.nb_items_deck;
const nb_items_draft = config.nb_items_draft;
const nb_items_starting = config.nb_items_starting;

class Card extends Schema {
    constructor(id) {
        super();
        this.id = id;
        this.texture = 'items_' + String(id).padStart(3, '0');
    }
}
schema.defineTypes(Card, {
    id: "number",
    texture: "string"
});

class Player extends Schema {
    constructor(id, name) {
        super();
        this.id = id;
        this.name = name;
        this.hand = new ArraySchema();
        this.selectedCards = new ArraySchema();
        this.selectedCardIndex = -1;
    }

    addCard(card) {
        this.hand.push(card);
    }

    selectCard(index) {
        this.selectedCardIndex = index;
    }

    pickCard() {
        if (this.selectedCardIndex !== -1) {
            const card = this.hand.splice(this.selectedCardIndex, 1)[0];
            this.selectedCardIndex = -1;
            return card;
        } else {
            console.error("bug selectedCardIndex = -1")
        }
        return null;
    }
}
schema.defineTypes(Player, {
    id: "string",
    name: "string",
    hand: [Card],
    selectedCards: [Card],
    selectedCardIndex: "number"
});

class GameState extends Schema {
    constructor() {
        super();
        this.itemDeck = new ArraySchema();
        this.players = new ArraySchema();
        this.currentPlayerIndex = 0;
    }

    initializeDeck() {
        for (let i = 1; i <= nb_items_deck; i++) {
            this.itemDeck.push(new Card(i));
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
                player.addCard(this.itemDeck.pop());
            });
        }
    }

    allPlayersSelected() {
        return this.players.every(player => player.selectedCardIndex !== -1);
    }

    addSelectedCardsToStuff() {
        this.players.forEach(player => {
            const card = player.pickCard();
            if (card) {
                player.selectedCards.push(card);
            }
        });
    }

    nextPlayer() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    }

    rotateHands() {
        // Rotate hands among players
        const lastHand = this.players[this.players.length - 1].hand.slice(); // Create a copy of the last hand
        for (let i = this.players.length - 1; i > 0; i--) {
            this.players[i].hand.clear();
            this.players[i].hand.push(...this.players[i - 1].hand);
        }
        this.players[0].hand.clear();
        this.players[0].hand.push(...lastHand);
    }

    discardHands(){
        this.players.forEach(p => p.hand.clear());
    }

}
schema.defineTypes(GameState, {
    itemDeck: [Card],
    players: [Player],
    currentPlayerIndex: "number"
});
class MyRoom extends colyseus.Room {
    onCreate(options) {
        console.log("Room created!", options);
        this.setState(new GameState());
        this.state.initializeDeck();

        // Listen to messages from clients
        this.onMessage("select_card", (client, message) => {
            console.log(`Received select_card message from ${client.sessionId}:`, message);
            const player = this.state.players.find(p => p.id === client.sessionId);
            if (player) {
                player.selectCard(message.cardIndex);

                if (this.state.allPlayersSelected()) {
                    this.state.addSelectedCardsToStuff();
                    if (this.state.players[0].selectedCards.length < nb_items_starting) {
                        this.state.rotateHands();
                        // broadcast of the state change is automatic, no need to call this function
                        // this.broadcast("update_state", this.state);
                    }
                    else {
                        this.state.discardHands();
                        this.broadcast("end_draft", this.state);
                    }
                }
            } else {
                console.error(`Player with id ${client.sessionId} not found`);
            }
        });
    }

    onJoin(client, options) {
        console.log(client.sessionId, "joined!");
        const player = new Player(client.sessionId, `Player ${this.state.players.length + 1}`);
        this.state.addPlayer(player);

        if (this.state.players.length === nb_players) {
            this.state.dealCards();
            this.broadcast("start_game", this.state);
        }
    }

    onLeave(client, consented) {
        console.log(client.sessionId, "left!");
        // Handle player leaving
    }

    onDispose() {
        console.log("Dispose MyRoom");
    }
}

module.exports = MyRoom;
