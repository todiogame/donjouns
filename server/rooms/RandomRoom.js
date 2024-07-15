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

class RandomRoom extends colyseus.Room {
    onCreate(options) {
        console.log("Room created!");
        this.maxClients = nb_players;
        this.setState(new GameState(this));

        // Initialize room-specific data
        this.allDungeonCards = options.dungeon || [];
        this.allItemsCards = options.itemsCards || [];

        this.state.initializeItemsDeck(this.allItemsCards);

        this.onMessage("pick_dungeon", (client, message) => {
            console.log(`Received pick_dungeon message from ${client.sessionId}:`, message);
            this.state.pickDungeonCard(client.sessionId);
        })
        this.onMessage("take_damage", (client, message) => {
            console.log(`Received take_damage message from ${client.sessionId}:`, message);
            this.state.faceMonster(client.sessionId);
        })

        this.onMessage("pass_turn", (client, message) => {
            console.log(`Received pass_turn message from ${client.sessionId}:`, message);
            this.state.wantToPassTurn(client.sessionId);
        })

        this.onMessage("use_item", (client, message) => {
            console.log(`Received use_item message from ${client.sessionId}:`, message.item_id);
            this.state.wantToUseItem(client.sessionId, message.item_id);
        })

        this.onMessage("escape_roll", (client, message) => {
            console.log(`Received escape_roll message from ${client.sessionId}:`, message);
            // Simulate a delay before broadcasting the result
            const escapeRoll = this.state.wantToEscape(client.sessionId);
            if (escapeRoll > -1) { // if allowed to escape roll
                setTimeout(() => {
                    console.log(`broadcast escape_roll result for ${client.sessionId}:`, escapeRoll);
                    this.state.tryToEscape(client.sessionId, escapeRoll);
                    this.broadcast('escapeRollResult', { result: escapeRoll });
                }, 1000); // 1000 milliseconds delay
            }
        })
    }

    onJoin(client, options) {
        console.log(client.sessionId, "joined!");
        const player = new Player(client.sessionId, `Player ${this.state.players.length + 1}`);
        this.state.addPlayer(player);
        console.log("player", player.id, player.name, player.stuff.length);

        if (this.state.players.length === this.maxClients) {
            this.lock();
            console.log("start_game");
            this.state.dealItemsCardsRandom();
            this.state.setUpDungeonGame(this.allDungeonCards);
            this.broadcast("start_game_random", this.state);
            this.state.gameLoop()
        }
    }

    onLeave(client, consented) {
        console.log(client.sessionId, "left!");
        // const playerIndex = this.state.players.findIndex(p => p.id === client.sessionId);
        // if (playerIndex !== -1) {
        //     this.state.players.splice(playerIndex, 1);
        // }
        // Handle additional cleanup if necessary
    }

    onDispose() {
        console.log("Dispose RandomRoom");
    }
}

module.exports = RandomRoom;
