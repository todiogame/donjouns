const colyseus = require("colyseus");
const fs = require('fs');
const path = require('path');
const GameController = require('../controllers/GameController');

// Load config file
const configPath = path.resolve(__dirname, '../config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Access config parameters
const nb_players = config.nb_players;
const min_players_to_start = config.min_players_to_start || nb_players;

class RandomRoom extends colyseus.Room {
    onCreate(options) {
        console.log("Room created!");
        this.maxClients = nb_players;

        this.gameController = new GameController(this, min_players_to_start);
        this.gameController.initialize(options);
        this.gameController.state.minPlayersToStart = min_players_to_start;
        this.gameController.state.maxPlayers = this.maxClients;

        // Centralize message handling
        this.onMessage("*", (client, type, message) => {
            this.gameController.handleMessage(type, client, message);
        });
    }

    onJoin(client, options) {
        console.log(client.sessionId, "joined!");
        this.gameController.onPlayerJoin(client);
    }

    onLeave(client, consented) {
        console.log(client.sessionId, "left!");
        this.gameController.state.removePlayer(client.sessionId);
    }

    onDispose() {
        console.log("Dispose RandomRoom");
    }
}

module.exports = RandomRoom;
