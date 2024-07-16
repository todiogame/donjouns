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
const { nb_items_deck, nb_items_draft, nb_items_starting, include_items } = config;
const ieStartGame = require('./ItemEffectsStartGame');

class GameState extends Schema {
    constructor(room) {
        super();
        this.room = room;
        this.phase = "WAITING";
        this.players = new ArraySchema();
        this.itemDeck = new ArraySchema();
        this.currentPlayerIndex = 0;
        this.dungeon = new ArraySchema();
        this.dungeonLength = 0;
        this.currentCard = null;
        this.canTryToEscape = true;
        this.discardPile = new ArraySchema();

        this.nextMonsterCondition = null;
        this.nextMonsterAction = null;
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
        // Step 2: Move specified items to the end
        const endItems = this.itemDeck.filter(item => include_items.includes(item.key));
        this.itemDeck = this.itemDeck.filter(item => !include_items.includes(item.key));
        this.itemDeck.push(...endItems);
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
        // set up HP, panos and start of game effects
        this.players.forEach(player => {
            player.hp = player.baseHP;
            const colorCount = {};

            player.stuff.forEach(item => {
                colorCount[item.color] = (colorCount[item.color] || 0) + 1;
                ieStartGame[item.key]?.(item, player, this);
            });

            Object.values(colorCount).forEach(count => {
                if (count >= 3) player.hp += 1;
            });
        });

        this.currentPlayerIndex = Math.floor(Math.random() * this.players.length);
        this.players[this.currentPlayerIndex].turnNumber++

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
    returnCardToDungeon() {
        this.dungeonLength = this.dungeon.unshift(this.currentCard);
        this.currentCard = null;
    }

    pickDungeonCard(playerId) {
        // Logic to handle picking a dungeon card
        if (this.dungeon.length && this.noCurrentCard() && this.isMyTurn(playerId)) {
            this.canTryToEscape = false;
            this.currentCard = this.dungeon.shift();
            this.dungeonLength = this.dungeon.length;
            if (this.inFight()) {
                this.currentCard.damage = this.currentCard.calculateDamage()
                console.log(`${playerId} picked dungeon card ${this.currentCard.title} :  ${this.currentCard.damage} damage!`);
                this.tryToExecuteNextMonster()
            }

            this.nextMonsterCondition = null;
            this.nextMonsterAction = null;
        }
    }

    faceMonster(playerId) {
        if (this.inFight() && this.isMyTurn(playerId)) {
            let player = this.findPlayerById(playerId)
            this.canTryToEscape = true; //either if player dies or if monster dies, we can try to escape

            console.log(`${playerId} takes ${this.currentCard.damage} damage!`);
            player.loseHP(this, this.currentCard.damage)
            player.lastDamageTaken = this.currentCard.damage;
            if (player.inDungeon()) {
                player.addDefeatedMonster(this.currentCard)
                this.currentCard = null;
                player.canPass = true;
            }
        }
    }

    afterBeatMonster() {
        if (this.dungeon.length <= 0) {
            this.endGame()
        }
    }

    tryToExecuteNextMonster() {
        if (this.nextMonsterCondition && this.nextMonsterAction && this.nextMonsterCondition(this)) {
            this.nextMonsterAction(this);
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
        //todo use items end of turn ?
        player.lastDamageTaken = 0;
        player.monstersAddedThisTurn = 0;

        //calculate next player
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

        if (foundPlayerInDungeon) {
            newPlayer.turnNumber++
            newPlayer.canPass = false;
            this.canTryToEscape = true;

            //if there is an active card, reset its stats
            if (this.inFight()) {
                this.currentCard.power = this.currentCard.originalPower;
                this.currentCard.damage = this.currentCard.calculateDamage();
                this.currentCard.affectedBy = [];
            }

        } else {
            this.endGame();
        }
    }

    wantToEscape(playerId) {
        if (this.canTryToEscape) {
            let player = this.findPlayerById(playerId)
            return player.rollToEscape();
        } else return -1
    }

    tryToEscape(playerId, escapeRoll) {
        let player = this.findPlayerById(playerId)
        if (!this.inFight()) this.pickDungeonCard(playerId)
        if (this.inFight() && this.currentCard.power <= escapeRoll) {
            console.log("player escaped")
            player.flee(this)
            if (this.players.every(p => !p.inDungeon()))
                this.endGame();
        } else {
            console.log("escape roll failed")
            this.canTryToEscape = false;
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


    async endGame() {
        if (this.phase != "END") {
            this.phase = "END"
            console.log("\nFIN DE LA PARTIE !\nCalcul des scores:");

            for (const player of this.players) {
                await player.calculateFinalScore(this);
                console.log(`Score final: ${player.name} : ${player.score}, ${!player.dead ? 'vivant' : player.fled ? 'fui' : 'mort'}.`);
            }

            const playersInDungeon = this.players.filter(player => player.inDungeon());
            let finalPlayers;

            if (playersInDungeon.length > 0) {
                console.log("Les joueurs suivants ont poncé le donjon :");
                playersInDungeon.forEach(player => {
                    console.log(`- ${player.name}`);
                });
                finalPlayers = playersInDungeon;
                console.log("Des joueurs sont arrivés vivants au bout du donjon, les fuyards sont exclus.");
            } else {
                finalPlayers = this.players.filter(player => !player.dead);
                console.log("Aucun joueur n'a poncé le donjon, tous les joueurs vivants comptent.");
            }
            // Include players with always_count attribute
            const alwaysCountPlayers = this.players.filter(player => player.always_count);
            alwaysCountPlayers.forEach(player => {
                if (!finalPlayers.includes(player)) {
                    finalPlayers.push(player);
                }
            });
            this.players.forEach(player => {
                if (finalPlayers.includes(player)) {
                    console.log(`${player.name} est inclus dans le décompte final.`);
                } else {
                    if (player.dead) {
                        console.log(`${player.name} est exclu du décompte final car il est mort.`);
                    } else if (player.fled) {
                        console.log(`${player.name} est exclu du décompte final car il a fui le donjon.`);
                    } else {
                        console.log(`${player.name} A BUG ?? ${player.alive} ${player.fled} ${player.inDungeon}`);
                    }
                }
            });

            finalPlayers.sort((a, b) => b.score - a.score);
            const topScore = finalPlayers[0].score;
            const tiedPlayers = finalPlayers.filter(player => player.score === topScore);

            let winner;
            if (tiedPlayers.length > 1) {
                const playersWithTiebreaker = this.players.filter(player => player.tiebreaker && player.alive);
                if (playersWithTiebreaker.length > 0) {
                    winner = playersWithTiebreaker[0];
                    console.log(`${winner.name} remporte la manche grâce à son avantage en cas d'égalité.`);
                } else {
                    winner = tiedPlayers[Math.floor(Math.random() * tiedPlayers.length)];
                    console.log(`${winner.name} remporte la manche suite à un tirage au sort parmi les joueurs avec le même score.`);
                }
            } else {
                winner = tiedPlayers[0];
            }


            finalPlayers.forEach((player, index) => {
                const medal = player === winner ? "MEDAILLE" : "";
                console.log(`${player.name} : ${player.score} points, PV restant ${player.hp}. ${medal}`);
            });

            console.log("\n");

            this.room.broadcast("endScores", { "winner": winner, "finalPlayers": finalPlayers })
        }
    }

}


schema.defineTypes(GameState, {
    phase: "string",
    players: [Player],
    itemDeck: [ItemCard],
    currentPlayerIndex: "number",
    dungeon: [DungeonCard],
    dungeonLength: "number",
    currentCard: DungeonCard,
    canTryToEscape: "boolean",
    discardPile: [DungeonCard],
    turnNumber: "number",
});

module.exports = { GameState };
