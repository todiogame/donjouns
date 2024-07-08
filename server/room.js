const colyseus = require("colyseus");
const schema = require("@colyseus/schema");
const Schema = schema.Schema;
const type = schema.type;

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
        this.hand = new schema.ArraySchema();
        this.selectedCards = new schema.ArraySchema();
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
        this.deck = new schema.ArraySchema();
        this.players = new schema.ArraySchema();
        this.currentPlayerIndex = 0;
    }

    initializeDeck() {
        for (let i = 1; i <= 22; i++) {
            this.deck.push(new Card(i));
        }
        this.shuffleDeck();
    }

    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    addPlayer(player) {
        this.players.push(player);
    }

    dealCards() {
        for (let i = 0; i < 7; i++) {
            this.players.forEach(player => {
                player.addCard(this.deck.pop());
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
        const lastHand = this.players[this.players.length - 1].hand;
        for (let i = this.players.length - 1; i > 0; i--) {
            this.players[i].hand = this.players[i - 1].hand;
        }
        this.players[0].hand = lastHand;

        // Reset the isPicked property for each card in the new hands
        this.players.forEach(player => {
            player.hand.forEach(card => {
                card.isPicked = false;
            });
        });
    }

}
schema.defineTypes(GameState, {
    deck: [Card],
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
                    // this.state.rotateHands();
                    this.broadcast("update_state", this.state);
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

        const expectedNumberOfPlayers = 3; // Define the number of expected players here
        if (this.state.players.length === expectedNumberOfPlayers) {
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
