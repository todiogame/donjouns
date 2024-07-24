const { GameState } = require('../models/GameState');
const { Player } = require('../models/Player');

class GameController {
    constructor(room) {
        this.room = room;
        this.state = new GameState(room);
        this.room.setState(this.state);
    }

    initialize(options) {
        this.allDungeonCards = options.dungeon || [];
        this.allItemsCards = options.itemsCards || [];

        this.state.initializeItemsDeck(this.allItemsCards);
    }

    handleMessage(type, client, message) {
        console.log(`Received ${type} message from ${client.sessionId}:`, message);
        switch (type) {
            case "pick_dungeon":
                this.state.pickDungeonCard(client.sessionId);
                break;
            case "take_damage":
                this.state.faceMonster(client.sessionId, message?.arg);
                break;
            case "special_effect":
                this.state.specialEffect(client.sessionId, message?.arg);
                break;
            case "pass_turn":
                this.state.wantToPassTurn(client.sessionId);
                break;
            case "execute":
                this.state.wantToExecuteNextMonster(client.sessionId);
                break;
            case "use_item":
                this.state.wantToUseItem(client.sessionId, message.item_id, message.arg);
                break;
            case "scout_pick":
                this.state.pickDungeonCard(client.sessionId, message.arg);
                break;
            case "escape_roll":
                this.handleEscapeRoll(client);
                break;
            case "accept_event":
                this.state.dealWithEvent(client.sessionId, true, message?.arg);
                break;
            case "decline_event":
                this.state.dealWithEvent(client.sessionId, false, message?.arg);
                break;
        }
    }

    handleEscapeRoll(client) {
        console.log(`Received escape_roll message from ${client.sessionId}`);
        this.room.broadcast('animate_roll', { playerId: client.sessionId });
        const { escapeRoll, escapeModifier } = this.state.wantToEscape(client.sessionId);
        if (escapeRoll) { // if allowed to escape roll
            setTimeout(() => {
                console.log(`Broadcast escape_roll result for ${client.sessionId}:`, { escapeRoll, escapeModifier });
                this.state.tryToEscape(client.sessionId, escapeRoll + escapeModifier);
                this.room.broadcast('roll_result', { result: escapeRoll, modifier: escapeModifier });
            }, 1000); // 1000 milliseconds delay
        }
    }

    onPlayerJoin(client) {
        const player = new Player(client.sessionId, `Player ${this.state.players.length + 1}`);
        this.state.addPlayer(player);
        console.log("player", player.id, player.name, player.stuff.length);

        if (this.state.players.length === this.room.maxClients) {
            this.room.lock();
            console.log("start_game");
            this.state.dealItemsCardsRandom();
            this.state.setUpDungeonGame(this.allDungeonCards);
            if (this.state.allPlayersSetupReady()) {
                this.state.gameLoop();
            }
            this.room.broadcast("start_game_random", this.state);
        }
    }
}

module.exports = GameController;
