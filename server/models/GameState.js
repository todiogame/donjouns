const schema = require("@colyseus/schema");
const { Schema, type, ArraySchema } = schema;
const { ItemCard } = require('./ItemCard');
const { Player } = require('./Player');
const { DungeonCard } = require('./DungeonCard');
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

    // DRAFT PHASE
    initializeItemsDeck(items) {
        this.itemDeck.clear();
        this.itemDeck.push(...items.filter(item => item.id > 0 && item.id <= nb_items_deck));
        this.shuffleItemsDeck();
    }

    shuffleItemsDeck() {
        for (let i = this.itemDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.itemDeck[i], this.itemDeck[j]] = [this.itemDeck[j], this.itemDeck[i]];
        }
    }

    addPlayer(player) {
        this.players.push(player);
    }

    dealItemsCards() {
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
                player.stuff.push(itemCard);
            }
        });
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

    // DUNGEON PHASE
    setUpDungeonGame(allDungeonCards) {
        this.phase = "GAME";
        //set up dungeon cards      
        this.dungeon.clear();
        this.dungeon.push(...allDungeonCards);
        this.shuffleDungeon();
        this.dungeonLength = this.dungeon.length;
        // set up HP
        this.players.forEach(player => {
            player.baseHp = 3;
            player.hp = player.baseHp + player.stuff.reduce((totalHp, item) => totalHp + item.hp, 0);
            console.log(player.name, player.hp, " HP")
        })

    }

    shuffleDungeon() {
        for (let i = this.dungeon.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.dungeon[i], this.dungeon[j]] = [this.dungeon[j], this.dungeon[i]];
        }
    }

    gameLoop() {
        while (this.dungeon.length > 0 && this.players.some(player => player.inDungeon)) {
            this.turnNumber++;
            this.log(`Turn ${this.turnNumber}`);
            this.currentPlayerIndex = this.currentPlayerIndex % this.players.length;

            let player = this.players[this.currentPlayerIndex];
            while (!player.inDungeon) {
                this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
                player = this.players[this.currentPlayerIndex];
            }

            this.playerTurn(player);

            if (!this.players.some(player => player.inDungeon)) {
                this.log("All players are out of the dungeon.");
                break;
            }

            this.currentPlayerIndex++;
        }

        this.endGame();
    }

    playerTurn(player) {
        this.log(`Player ${player.name}'s turn, ${player.totalHP} HP`);
        const card = this.dungeon.shift();
        this.log(`Drew card: ${card.title}`);

        if (card.isEvent) {
            this.handleEventCard(player, card);
        } else if (card.isMonster) {
            this.handleMonsterCard(player, card);
        }

        if (player.inDungeon) {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        }
    }

    handleEventCard(player, card) {
        this.log(`Event: ${card.title}`);
        switch (card.effect) {
            case "HEAL":
                player.totalHP += 3;
                this.log(`${player.name} gains 3 HP from ${card.title}. Total HP: ${player.totalHP}`);
                this.players.forEach(otherPlayer => {
                    if (otherPlayer !== player && otherPlayer.inDungeon) {
                        otherPlayer.totalHP += 2;
                        this.log(`${otherPlayer.name} gains 2 HP from ${card.title}. Total HP: ${otherPlayer.totalHP}`);
                    }
                });
                break;
            case "REPAIR":
                const brokenItems = player.items.filter(item => !item.intact);
                if (brokenItems.length > 0) {
                    const repairedItem = brokenItems[Math.floor(Math.random() * brokenItems.length)];
                    repairedItem.repair();
                    player.totalHP += repairedItem.hpBonus;
                    this.log(`Repaired ${repairedItem.name} with ${card.title}, gaining ${repairedItem.hpBonus} HP. Total HP: ${player.totalHP}`);
                } else {
                    this.log(`${card.title} has nothing to repair.`);
                }
                break;
            // Handle other effects similarly...
        }
    }

    handleMonsterCard(player, card) {
        this.log(`Monster: ${card.title}, Power: ${card.power}`);
        card.damage = card.power;
        if (card.effect) {
            switch (card.effect) {
                case "MIRROR":
                    this.log(`Evil Mirror drawn.`);
                    if (player.defeatedMonstersPile.length > 0) {
                        const copiedCard = player.defeatedMonstersPile[player.defeatedMonstersPile.length - 1];
                        card.power = copiedCard.power;
                        this.log(`Evil Mirror copies ${copiedCard.title} with power ${card.power}.`);
                    } else {
                        card.power = 0;
                        this.log(`Evil Mirror has no card to copy, power set to zero.`);
                    }
                    break;
                // Handle other monster effects similarly...
            }
        }

        // Handle combat logic
        if (player.fleeAttempted) {
            if (player.fleeRoll >= card.power) {
                this.log(`Successful flee from ${card.title} with a roll of ${player.fleeRoll} against power ${card.power}.`);
                player.flee();
                this.dungeon.unshift(card);
                return;
            } else {
                this.log(`Failed to flee from ${card.title}.`);
                player.fleeAttempted = false;
            }
        }

        player.items.forEach(item => item.useInCombat(player, card, this));
        if (!card.executed && card.damage > 0) {
            player.totalHP -= card.damage;
            this.log(`Fought ${card.title}, lost ${card.damage} HP, remaining ${player.totalHP} HP.`);
            if (player.totalHP <= 0) {
                player.die();
                this.log(`Player ${player.name} has died.`);
            }
        }

        // Post-combat logic
        player.items.forEach(item => item.useAfterCombat(player, card, this));
    }


    log(info) {
        console.log(info);
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
    turnNumber: "number",
});

module.exports = { GameState };
