// models/Ordonancer.js
const { Schema, type } = require("@colyseus/schema");

class Ordonancer extends Schema {
    constructor(players, dungeon, items) {
        super();
        this.players = players;
        this.dungeon = dungeon;
        this.items = items;
        this.logDetails = [];
        // this.initializeGame();
    }

    initializeGame() {
        // Shuffle the dungeon deck
        this.dungeon.shuffle();

        // Initialize player states
        this.players.forEach(player => {
            player.sortItemsByPriority();
            player.items.forEach(item => item.startGame(player, this));
        });

        // Additional initialization logic
        this.turn = 0;
        this.currentPlayerIndex = 0;
    }

    gameLoop() {
        while (!this.dungeon.isEmpty()) {
            this.turn++;
            this.log(`Turn ${this.turn}`);

            if (!this.players.some(player => player.inDungeon)) {
                this.log("All players are out of the dungeon.");
                break;
            }

            let player = this.players[this.currentPlayerIndex];

            // Skip players not in the dungeon
            while (!player.inDungeon) {
                this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
                player = this.players[this.currentPlayerIndex];
            }

            this.playerTurn(player);
        }

        this.endGame();
    }

    playerTurn(player) {
        this.log(`Player ${player.name}'s turn, ${player.totalHP} HP`);

        // Player draws a card
        const card = this.dungeon.drawCard();
        this.log(`Drew card: ${card.title}`);

        // Handle card effects
        if (card.isEvent) {
            this.handleEventCard(player, card);
        } else if (card.isMonster) {
            this.handleMonsterCard(player, card);
        }

        // Pass turn to next player
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    }

    handleEventCard(player, card) {
        // Implement event card effects
    }

    handleMonsterCard(player, card) {
        // Implement monster card effects
    }

    log(message) {
        this.logDetails.push(message);
        console.log(message);
    }

    endGame() {
        this.log("\nGame Over!\nCalculating final scores...");
        this.calculateFinalScores();
    }

    calculateFinalScores() {
        this.players.forEach(player => {
            player.calculateFinalScore(this.logDetails);
        });

        // Determine winner
        const winner = this.determineWinner();
        this.log(`Winner: ${winner.name}`);
    }

    determineWinner() {
        // Determine the winner based on final scores and other criteria
        return this.players.reduce((prev, current) => (prev.finalScore > current.finalScore) ? prev : current);
    }
}

module.exports = { Ordonancer };
