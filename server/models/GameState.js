const schema = require("@colyseus/schema");
const { Schema, type, ArraySchema } = schema;
const { ItemCard } = require('./ItemCard');
const { Player } = require('./Player');
const { MonsterCard } = require('./MonsterCard');
const { DungeonCard } = require('./DungeonCard');
const fs = require('fs');
const path = require('path');

const configPath = path.resolve(__dirname, '../config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const { nb_items_deck, nb_items_draft, nb_items_starting } = config;
const ieStartGame = require('./ItemEffectsStartGame');

class GameState extends Schema {
    constructor() {
        super();
        this.phase = "WAITING";
        this.players = new ArraySchema();
        this.itemDeck = new ArraySchema();
        this.currentPlayerIndex = 0;
        this.dungeon = new ArraySchema();
        this.dungeonLength = 0;
        this.currentCard = null;
        this.currentCardDamage = 0;
        this.discardPile = new ArraySchema();
        this.turnNumber = 0;
    }

    findPlayerById(id) {
        return this.players.find(p => p.id === id);
    }

    // DRAFT PHASE
    initializeItemsDeck(itemsCards) {
        // debug LA SOLUTION : IL FAUT REFAIRE DES NOUVEAUX ITEMCARD DANS CHAQUE NOUVELLE INSTANCE DE GAME
        // DEBUG ON NE VAS PLUS CREER DIRECT D'ITEMCARD DEPUIS LE DATA FEED
        this.itemDeck.clear();
        this.itemDeck.push(...itemsCards.filter(item => item.id > 0 && item.id <= nb_items_deck)
            .map(i => new ItemCard(i.id, i.title, i.active, i.color, i.key, i.description)));
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

    dealItemsCardsDraft() {
        for (let i = 0; i < nb_items_draft; i++) {
            this.players.forEach(player => {
                player.addItemCardDraft(this.itemDeck.pop());
            });
        }
    }
    dealItemsCardsRandom() {
        for (let i = 0; i < nb_items_starting; i++) {
            this.players.forEach(player => {
                player.addItemCardRandom(this.itemDeck.pop());
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

    setUpAndPlayDungeon(allDungeonCards) {
        this.setUpDungeonGame(allDungeonCards)
        this.gameLoop();
    }

    setUpDungeonGame(allDungeonCards) {
        this.phase = "GAME_SETUP";
        //set up dungeon cards      
        this.dungeon.clear();
        this.dungeon.push(...allDungeonCards.filter(card => card.dungeonCardType === "monster" && card.id <= 26)
            .map(d => new MonsterCard(d.id, d.title, d.power, d.types, d.description, d.effects)));
        this.shuffleDungeon();
        this.dungeonLength = this.dungeon.length;
        // set up HP and start of game effects
        this.players.forEach(player => {
            player.baseHp = 3;
            player.hp = player.baseHp
            player.stuff.forEach(item => ieStartGame[item.key]?.(item, player, this));
        })
        this.currentPlayerIndex = Math.floor(Math.random() * this.players.length);

        console.log("donjon set up ok")
    }

    shuffleDungeon() {
        for (let i = this.dungeon.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.dungeon[i], this.dungeon[j]] = [this.dungeon[j], this.dungeon[i]];
        }
    }
    noCurrentCard() {
        return !this.currentCard || this.currentCard._id === undefined
    }
    inFight() {
        return this.currentCard?.dungeonCardType == "monster";
    }
    inEvent() {
        return this.currentCard?.dungeonCardType == "event";
    }
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }
    isMyTurn(myId) {
        return this.getCurrentPlayer().id === myId
    }
    discard(card) {
        this.discardPile.push(card);
    }
    returnCardToDungeon(){
        this.dungeon.push(this.currentCard);
        this.currentCard = null;
    }

    pickDungeonCard(playerId) {
        // Logic to handle picking a dungeon card
        if (this.dungeon.length && this.noCurrentCard() && this.isMyTurn(playerId)) {
            this.currentCard = this.dungeon.pop();
            if (this.inFight())
                this.currentCardDamage = this.currentCard.calculateDamage()
            console.log(`${playerId} picked dungeon card ${this.currentCard.title} :  ${this.currentCardDamage} damage!`);
        }
    }

    takeDamage(playerId) {
        // Logic to handle picking a dungeon card
        if (this.currentCard.dungeonCardType == "monster" && this.players[this.currentPlayerIndex].id === playerId) {
            this.currentCardDamage = this.currentCard.calculateDamage()
            console.log(`${playerId} takes ${this.currentCardDamage} damage!`);
            let player = this.findPlayerById(playerId)
            player.loseHP(this.currentCardDamage)
            player.addToPile(this.currentCard)
            this.currentCard = null;
            player.canPass = true;
        }
    }

    wantToPassTurn(playerId) {
        let player = this.findPlayerById(playerId)
        if (player.canPass) {
            this.passTurn()
        }
    }
    passTurn(reversed = false) {
        let player = this.getCurrentPlayer();
        console.log(`${player} passes turn.`);

        let originalIndex = this.currentPlayerIndex;
        let newPlayer;
        let foundPlayerInDungeon = false;
        let totalPlayers = this.players.length;

        for (let i = 0; i < totalPlayers; i++) {
            let nextIndex = reversed
                ? (originalIndex - 1 - i + totalPlayers) % totalPlayers
                : (originalIndex + 1 + i) % totalPlayers;
            newPlayer = this.players[nextIndex];
            if (newPlayer.inDungeon()) {
                this.currentPlayerIndex = nextIndex;
                foundPlayerInDungeon = true;
                break;
            }
        }

        if (!foundPlayerInDungeon) {
            this.endGame();
        } else {
            newPlayer.canPass = false;
        }
    }

    wantToEscape(playerId) {
        let player = this.findPlayerById(playerId)
        return player.rollToEscape();
    }

    tryToEscape(playerId, escapeRoll) {
        let player = this.findPlayerById(playerId)
        this.pickDungeonCard(playerId)
        if(this.inFight() && this.currentCard.power <= escapeRoll) {
            player.flee(this)
        }
    }

    wantToUseItem(playerId, itemId) {
        console.log("wantToUseItem")
        let player = this.findPlayerById(playerId)
        let item = player.stuff.find(i => i.id === itemId)
        if (this.isMyTurn(playerId) && item) { // it's his turn and he got the item
            item.tryToUse(player, this)
        }
    }

    gameLoop() {
        this.phase = "GAME_LOOP";
        console.log("game loop")
        //     while (this.dungeon.length > 0 && this.players.some(player => player.inDungeon())) {
        //         this.turnNumber++;
        //         this.log(`Turn ${this.turnNumber}`);
        //         this.currentPlayerIndex = this.currentPlayerIndex % this.players.length;

        //         let player = this.players[this.currentPlayerIndex];
        //         while (!player.inDungeon()) {
        //             this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        //             player = this.players[this.currentPlayerIndex];
        //         }

        //         this.playerTurn(player);

        //         if (!this.players.some(player => player.inDungeon())) {
        //             this.log("All players are out of the dungeon.");
        //             break;
        //         }

        //         this.currentPlayerIndex++;
        //     }

        //     this.endGame();
        // }

        // playerTurn(player) {
        //     this.log(`Player ${player.name}'s turn, ${player.hp} HP`);
        //     const card = this.dungeon.shift();
        //     this.log(`Drew card: ${card.title}`);

        //     if (card.isEvent) {
        //         this.handleEventCard(player, card);
        //     } else if (card.isMonster) {
        //         this.handleMonsterCard(player, card);
        //     }

        //     if (player.inDungeon()) {
        //         this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        //     }
        // }

        // handleEventCard(player, card) {
        //     this.log(`Event: ${card.title}`);
        //     switch (card.effect) {
        //         case "HEAL":
        //             player.hp += 3;
        //             this.log(`${player.name} gains 3 HP from ${card.title}. Total HP: ${player.hp}`);
        //             this.players.forEach(otherPlayer => {
        //                 if (otherPlayer !== player && otherPlayer.inDungeon()) {
        //                     otherPlayer.hp += 2;
        //                     this.log(`${otherPlayer.name} gains 2 HP from ${card.title}. Total HP: ${otherPlayer.hp}`);
        //                 }
        //             });
        //             break;
        //         case "REPAIR":
        //             const brokenItems = player.stuff.filter(item => !item.intact);
        //             if (brokenItems.length > 0) {
        //                 const repairedItem = brokenItems[Math.floor(Math.random() * brokenItems.length)];
        //                 repairedItem.repair();
        //                 player.hp += repairedItem.hpBonus;
        //                 this.log(`Repaired ${repairedItem.name} with ${card.title}, gaining ${repairedItem.hpBonus} HP. Total HP: ${player.hp}`);
        //             } else {
        //                 this.log(`${card.title} has nothing to repair.`);
        //             }
        //             break;
        //         // Handle other effects similarly...
        //     }
    }

    // handleMonsterCard(player, card) {
    //     this.log(`Monster: ${card.title}, Power: ${card.power}`);
    //     card.damage = card.power;
    //     if (card.effect) {
    //         switch (card.effect) {
    //             case "MIRROR":
    //                 this.log(`Evil Mirror drawn.`);
    //                 if (player.defeatedMonstersPile.length > 0) {
    //                     const copiedCard = player.defeatedMonstersPile[player.defeatedMonstersPile.length - 1];
    //                     card.power = copiedCard.power;
    //                     this.log(`Evil Mirror copies ${copiedCard.title} with power ${card.power}.`);
    //                 } else {
    //                     card.power = 0;
    //                     this.log(`Evil Mirror has no card to copy, power set to zero.`);
    //                 }
    //                 break;
    //             // Handle other monster effects similarly...
    //         }
    //     }

    //     // Handle combat logic
    //     if (player.fleeAttempted) {
    //         if (player.fleeRoll >= card.power) {
    //             this.log(`Successful flee from ${card.title} with a roll of ${player.fleeRoll} against power ${card.power}.`);
    //             player.flee();
    //             this.dungeon.unshift(card);
    //             return;
    //         } else {
    //             this.log(`Failed to flee from ${card.title}.`);
    //             player.fleeAttempted = false;
    //         }
    //     }

    //     player.stuff.forEach(item => item.useInCombat(player, card, this));
    //     if (!card.executed && card.damage > 0) {
    //         player.hp -= card.damage;
    //         this.log(`Fought ${card.title}, lost ${card.damage} HP, remaining ${player.hp} HP.`);
    //         if (player.hp <= 0) {
    //             player.die();
    //             this.log(`Player ${player.name} has died.`);
    //         }
    //     }

    //     // Post-combat logic
    //     player.stuff.forEach(item => item.useAfterCombat(player, card, this));
    // }


    // log(info) {
    //     console.log(info);
    // }
}

schema.defineTypes(GameState, {
    phase: "string",
    players: [Player],
    itemDeck: [ItemCard],
    currentPlayerIndex: "number",
    dungeon: [DungeonCard],
    dungeonLength: "number",
    currentCard: DungeonCard,
    currentCardDamage: "number",
    discardPile: [DungeonCard],
    turnNumber: "number",
});

module.exports = { GameState };
