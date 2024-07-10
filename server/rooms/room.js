const colyseus = require("colyseus");
const schema = require("@colyseus/schema");
const Schema = schema.Schema;
const type = schema.type;
const ArraySchema = schema.ArraySchema;
const fs = require('fs');
const path = require('path');
const { GameState } = require('../models/GameState');
const { Player } = require('../models/Player');

// Load config file
const configPath = path.resolve(__dirname, '../config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Access config parameters
const nb_players = config.nb_players;
const nb_items_deck = config.nb_items_deck;
const nb_items_draft = config.nb_items_draft;
const nb_items_starting = config.nb_items_starting;

class MyRoom extends colyseus.Room {
    onCreate(options) {
        console.log("Room created!");
        this.maxClients = nb_players;
        this.setState(new GameState());

        // Initialize room-specific data
        this.allDungeonCards = options.dungeon || [];
        this.allItemsCards = options.itemsCards || [];

        this.state.initializeItemsDeck(this.allItemsCards);
        
        // Listen to messages from clients
        this.onMessage("select_card", (client, message) => {
            console.log(`Received select_card message from ${client.sessionId}:`, message);
            const player = this.state.players.find(p => p.id === client.sessionId);
            if (player) {
                player.selectCard(message.cardIndex);

                if (this.state.allPlayersSelected()) {
                    this.state.addSelectedItemCardsToStuff();
                    if (this.state.players[0].stuff.length < nb_items_starting) {
                        this.state.rotateHands();
                    } else {
                        this.state.discardHands();
                        this.broadcast("end_draft", this.state);

                        setTimeout(() => {
                            this.state.setUpAndPlayDungeon(this.allDungeonCards);
                        }, 1000);
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
        console.log("player", player.id, player.name, player.stuff.length);

        if (this.state.players.length === this.maxClients) {
            console.log("start_game");
            this.state.phase = "DRAFT";
            this.state.dealItemsCards();
            this.broadcast("start_game", this.state);
        }
    }

    onLeave(client, consented) {
        console.log(client.sessionId, "left!");
        const playerIndex = this.state.players.findIndex(p => p.id === client.sessionId);
        if (playerIndex !== -1) {
            this.state.players.splice(playerIndex, 1);
        }
        // Handle additional cleanup if necessary
    }

    onDispose() {
        console.log("Dispose MyRoom");
    }
}

module.exports = MyRoom;
