const schema = require("@colyseus/schema");
const { Schema, type, ArraySchema } = schema;
const { ItemCard } = require('./ItemCard');
const { Player } = require('./Player');
const { MonsterCard } = require('./MonsterCard');
const { DungeonCard } = require('./DungeonCard');
const h = require('./Helper.js');
const fs = require('fs');
const path = require('path');

const configPath = path.resolve(__dirname, '../config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const { nb_items_deck, nb_items_draft, nb_items_starting, disabled_items, include_items } = config;
const ieStartGame = require('./ItemEffectsStartGame');
const iePick = require("./ItemEffectsPick");
const ieEndTurn = require("./ItemEffectsEndTurn");
const { EventCard } = require("./EventCard");
const ieTakeDamage = require("./ItemEffectsTakeDamage.js");
const ieDiscard = require("./ItemEffectsDiscard.js");
const ieCanUse = require('./ItemEffectsClick').ieCanUse;



class GameState extends Schema {
    constructor(room) {
        super();
        this.room = room;
        this.phase = "WAITING";
        this.players = new ArraySchema();
        this.hostId = "";
        this.minPlayersToStart = config.min_players_to_start || config.nb_players;
        this.maxPlayers = (room && room.maxClients) ? room.maxClients : config.nb_players;
        this.gameMode = "";
        this.itemDeck = new ArraySchema();
        this.currentPlayerIndex = null;
        this.dungeon = new ArraySchema();
        this.dungeonLength = 0;
        this.currentCard = null;
        this.canTryToEscape = true;
        this.canExecute = false;
        this.trap = false;
        this.discardPile = new ArraySchema();

        this.nextMonsterCondition = null;
        this.nextMonsterAction = null;

        this.canPickSpecificCard = false; // allow to choose the card id to pick in the dungeon
    }

    findPlayerById(id) {
        return this.players.find(p => p.id === id);
    }

    // DRAFT PHASE
    initializeItemsDeck(itemsCards) {
        // debug LA SOLUTION : IL FAUT REFAIRE DES NOUVEAUX ITEMCARD DANS CHAQUE NOUVELLE INSTANCE DE GAME
        // DEBUG ON NE VAS PLUS CREER DIRECT D'ITEMCARD DEPUIS LE DATA FEED
        this.itemDeck.clear();
        const freshItems = itemsCards
            .filter(item => item.id > 0 && item.id <= nb_items_deck)
            .map(i => new ItemCard(i.id, i.title, i.active, i.color, i.key, i.description));
        this.itemDeck.push(...freshItems);

        // Remove disabled items without losing the ArraySchema instance
        const enabledItems = this.itemDeck.filter(item => !disabled_items.includes(item.key));
        this.itemDeck.clear();
        this.itemDeck.push(...enabledItems);

        this.shuffleItemsDeck();

        // Move specified items to the end while keeping ArraySchema intact
        const remaining = this.itemDeck.filter(item => !include_items.includes(item.key));
        const forcedEndItems = this.itemDeck.filter(item => include_items.includes(item.key));
        this.itemDeck.clear();
        this.itemDeck.push(...remaining, ...forcedEndItems);
    }


    shuffleItemsDeck() {
        for (let i = this.itemDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.itemDeck[i], this.itemDeck[j]] = [this.itemDeck[j], this.itemDeck[i]];
        }
    }

    addPlayer(player) {
        this.players.push(player);
        if (!this.hostId) {
            this.hostId = player.id;
        }
    }

    addBot() {
        console.log("GameState.addBot called");
        const botId = `bot-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const botName = `Bot ${Math.floor(Math.random() * 1000)}`;
        const bot = new Player(botId, botName, true);
        this.addPlayer(bot);
        console.log("Bot added:", bot.id, bot.name);
    }

    removePlayer(playerId) {
        const index = this.players.findIndex(player => player.id === playerId);
        if (index === -1) {
            return;
        }

        const player = this.players[index];
        const isLobbyPhase = this.phase === "WAITING" || this.phase === "DRAFT";
        const isGamePhase = typeof this.phase === "string" && this.phase.includes("GAME");

        if (isLobbyPhase) {
            this.players.splice(index, 1);
            if (this.hostId === playerId) {
                this.hostId = this.players.length ? this.players[0].id : "";
            }
        } else if (isGamePhase) {
            const currentPlayer = (typeof this.currentPlayerIndex === "number") ? this.getCurrentPlayer() : null;
            const wasCurrentPlayer = currentPlayer && currentPlayer.id === playerId;
            if (typeof player.calculateScore === "function") {
                player.calculateScore(this);
            }
            player.dead = true;
            player.hp = 0;
            player.disconnected = true;

            // Check if only bots remain after this player leaves
            if (this.onlyBotsRemain()) {
                console.log("Only bots remain - ending game");
                this.endGame();
                return;
            }

            if (wasCurrentPlayer && typeof this.passTurn === "function") {
                this.passTurn();
            }
        } else {
            player.dead = true;
            player.hp = 0;
            player.disconnected = true;
        }
    }

    setPlayerName(playerId, rawName = "") {
        const player = this.findPlayerById(playerId);
        if (!player || typeof rawName !== "string") {
            return;
        }
        const sanitized = rawName.replace(/\s+/g, " ").trim();
        if (!sanitized) {
            return;
        }
        player.name = sanitized.substring(0, 24);
    }

    onlyBotsRemain() {
        // Check if game is in active phase
        const isGamePhase = typeof this.phase === "string" && this.phase.includes("GAME");
        if (!isGamePhase) {
            return false;
        }
        // Check if all connected players are bots
        // If a player is NOT a bot and NOT disconnected, then humans are still present
        const humansConnected = this.players.some(p => !p.isBot && !p.disconnected);
        return !humansConnected;
    }

    dealItemsCardsDraft() {
        for (let i = 0; i < nb_items_draft; i++) {
            this.players.forEach(player => {
                player.addItemCardDraft(this.itemDeck.pop());
            });
        }
    }
    dealItemsCardsRandom(handSize = nb_items_starting) {
        for (let i = 0; i < handSize; i++) {
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

    setUpAndPlayDungeon(allDungeonCards) {
        this.setUpDungeonGame(allDungeonCards)
        this.gameLoop();
    }

    // DUNGEON PHASE

    allPlayersSetupReady() {
        return this.players.every(player => player.stuff.every(item =>
            !item.requireSetup || item.indication
        ));
    }

    setUpDungeonGame(allDungeonCards) {
        this.phase = "GAME_SETUP";
        //set up dungeon cards      
        this.dungeon.clear();
        this.dungeon.push(...allDungeonCards
            // .filter(card => card.id >= 45)
            .map(d => d.event ? new EventCard(d.id, d.title, d.description, d.effect, d.optional)
                : new MonsterCard(d.id, d.title, d.power, d.types, d.description, d.effect)));
        this.shuffleDungeon();
        this.dungeonLength = this.dungeon.length;

        // set up HP, panos and start of game effects
        this.players.forEach(player => {
            player.hp = player.baseHP;
            const colorCount = {};

            player.stuff.forEach(item => {
                item.hp = 0; // Ensure default hp is set
                colorCount[item.color] = (colorCount[item.color] || 0) + 1;
                if (ieStartGame[item.key]) {
                    // set up the start of game effect, and set startGame to true if an item makes the player start first
                    player.startGame = ieStartGame[item.key](item, player, this) || player.startGame;
                    player.gainHP(item.hp); // Apply the HP gain after setting item.hp
                }
            });

            Object.values(colorCount).forEach(count => {
                if (count >= 3) player.hp += 1;
            });
        });

        // preparation phase

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
    discard(player, card) {
        this.discardPile.push(card);
        //trigger effects on discarded cards
        this.players.filter(p => p.inDungeon()).forEach(owner => owner.stuff.forEach(item =>
            ieDiscard[item.key]?.(item, player, owner, this)))

    }
    returnCurrentCardToDungeon() {
        console.log('Initial dungeon:', this.dungeon.map(obj => obj.id).join(', '));
        console.log('Current card:', this.currentCard.id);
        this.currentCard.power = this.currentCard.basePower
        this.dungeonLength = this.dungeon.push(this.currentCard);
        this.currentCard = null;

        console.log('Updated dungeon:', this.dungeon.map(obj => obj.id).join(', '));
        console.log('Dungeon length:', this.dungeonLength);
    }

    returnCurrentCardUnderDungeon() {
        console.log('Initial dungeon:', this.dungeon.map(obj => obj.id).join(', '));
        console.log('Current card:', this.currentCard.id);
        this.currentCard.power = this.currentCard.basePower
        const dungeonBackUp = [];
        this.dungeon.forEach(c => dungeonBackUp.push(c))
        this.dungeon.clear()
        this.dungeon.push(this.currentCard)
        dungeonBackUp.forEach(c => this.dungeon.push(c))
        this.dungeonLength = this.dungeon.length;
        this.currentCard = null;

        console.log('Updated dungeon:', this.dungeon.map(obj => obj.id).join(', '));
        console.log('Dungeon length:', this.dungeonLength);
    }

    pickDungeonCard(playerId, cardId = null) {
        console.log('Picking', cardId)
        let player = this.findPlayerById(playerId)
        // Logic to handle picking a dungeon card
        if (this.dungeon.length && this.noCurrentCard() && this.isMyTurn(playerId)) {
            player.alreadyUsedItems = [];
            this.canTryToEscape = false;
            if (cardId && this.canPickSpecificCard)
                this.currentCard = h.pickSpecificCard(this, cardId);
            else
                this.currentCard = this.dungeon.pop();

            this.dungeonLength = this.dungeon.length;
            this.canPickSpecificCard = false;

            //trigger special monster effects
            if (this.inFight()) this.currentCard.onMeetMonster(player, this)

            // trigger "on pick" items
            player.stuff.forEach(item => {
                iePick[item.key]?.(item, player, this);
            });
            if (this.inFight()) {
                this.currentCard.damage = this.currentCard.calculateDamage()
                console.log(`${playerId} picked dungeon card ${this.currentCard.title} :  ${this.currentCard.damage} damage!`);
                this.givePromptExecuteNextMonster()
            } else if (this.inEvent()) {
                console.log('picked event')
            }
            this.updateItemsUsability();
        }
    }

    faceMonster(playerId, itemToOoze) {
        if (this.inFight() && this.isMyTurn(playerId)) {
            let player = this.findPlayerById(playerId)
            this.canExecute = false;
            //trigger effects before taking damage
            this.currentCard.onFaceBeforeDamageMonster(player, this, itemToOoze)

            console.log(`${playerId} takes ${this.currentCard.damage} damage!`);
            player.lastDamageTaken = Math.min(this.currentCard.timesDealDamage * this.currentCard.damage, player.hp);

            for (let i = 0; i < this.currentCard.timesDealDamage; i++) {
                player.loseHP(this, this.currentCard.damage)
            }

            // trigger items on-damage effects
            this.players.filter(p => p.inDungeon()).forEach(owner => owner.stuff.forEach(item =>
                ieTakeDamage[item.key]?.(item, player, owner, this)))

            //trigger special monster effects after taking damage
            this.currentCard.onFaceAfterDamageMonster(player, this)

            if (this.isMyTurn(playerId) && player.inDungeon()) {
                if (this.currentCard) {
                    player.addDefeatedMonster(this.currentCard, this)
                    //trigger effects on special monster beaten
                    this.currentCard.onBeatenMonster(player, this)
                }
                this.afterDoneWithMonster(player)
            }
            this.updateItemsUsability();
        }
    }

    afterDoneWithMonster(player) {
        if (this.dungeon.length <= 0) {
            this.endGame()
        }
        this.currentCard = null;
        player.canPass = true;
        this.canTryToEscape = true;
        this.canExecute = false;
        this.nextMonsterCondition = null;
        this.nextMonsterAction = null;
        this.trap = false;
        this.updateItemsUsability();
    }

    async dealWithEvent(playerId, isAccepted, itemId) {
        if (this.currentCard.dungeonCardType === "event") {
            let player = this.findPlayerById(playerId)
            this.canExecute = false;
            this.nextMonsterCondition = null;
            this.nextMonsterAction = null;
            this.trap = false;

            if (isAccepted)
                await this.currentCard.onAcceptEvent(player, this, itemId)

            this.discard(player, this.currentCard)
            if (this.dungeon.length <= 0) {
                this.endGame()
            }
            this.currentCard = null;
            player.canPass = false;
            this.canTryToEscape = true;
            this.updateItemsUsability();
        }
    }

    givePromptExecuteNextMonster() {
        console.log("try to givePromptExecuteNextMonster ")
        if (this.nextMonsterCondition && this.nextMonsterAction && this.nextMonsterCondition(this)) {
            console.log("givePromptExecuteNextMonster ")
            this.canExecute = true;
        }
        this.updateItemsUsability();
    }

    wantToExecuteNextMonster(playerId) {
        if (this.isMyTurn(playerId) && this.inFight()) {
            if (this.nextMonsterCondition && this.nextMonsterAction
                && this.nextMonsterCondition(this)) {
                this.nextMonsterAction(this);
            }
            this.canExecute = false;
            this.nextMonsterCondition = null;
            this.nextMonsterAction = null;
            this.updateItemsUsability();
        }
    }

    specialEffect(playerId, arg) {
        let player = this.findPlayerById(playerId)
        this.currentCard.onSpecialEffect(player, this, arg)
        this.updateItemsUsability();
    }

    wantToPassTurn(playerId) {
        let player = this.findPlayerById(playerId)
        if (player.canPass) {
            return this.passTurn()
        }
    }
    async passTurn(reversed = false) {
        let player = this.getCurrentPlayer();
        console.log(`${player.name} passes turn.`);

        if (player.inDungeon()) {
            // trigger "on end turn" items
            for (let item of player.stuff) {
                if (ieEndTurn[item.key]) {
                    await ieEndTurn[item.key](item, player, this);
                }
            }
        }

        player.lastDamageTaken = 0;
        player.monstersBeatenThisTurn = 0;
        player.alreadyUsedItems = [];

        this.nextMonsterCondition = null;
        this.nextMonsterAction = null;
        this.canExecute = false;
        this.trap = false;

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
                this.currentCard.power = this.currentCard.basePower;
                this.currentCard.bonusDamage = 0;
                //trigger effects
                if (this.currentCard.onMeetMonster)
                    this.currentCard.onMeetMonster(newPlayer, this)
                this.currentCard.damage = this.currentCard.calculateDamage();
            }

        } else {
            this.endGame();
        }
        this.updateItemsUsability();

        // Check if only bots remain
        if (foundPlayerInDungeon && this.onlyBotsRemain()) {
            console.log("Only bots remain - ending game");
            this.endGame();
        }

        // Automatically trigger bots when the next player is a bot
        if (foundPlayerInDungeon && this.phase === "GAME_LOOP") {
            const controller = this.room?.gameController;
            if (controller && typeof controller.triggerBotTurnIfNeeded === "function") {
                controller.triggerBotTurnIfNeeded();
            }
        }
    }

    wantToEscape(playerId) {
        if (this.canTryToEscape) {
            let player = this.findPlayerById(playerId)
            return {
                escapeRoll: player.rollToEscape(),
                escapeModifier: player.getEscapeModifier(this)
            }
        } else return {}
    }

    tryToEscape(playerId, escapeRoll) {
        let player = this.findPlayerById(playerId)
        // If no monster is currently faced, treat the escape as an immediate flee (do not draw a new card)
        if (!this.inFight()) {
            console.log("player escaped before drawing")
            player.flee(this);
            this.updateItemsUsability();
            return;
        }

        if (this.currentCard.power <= escapeRoll) {
            console.log("player escaped")
            player.flee(this)
            if (this.players.every(p => !p.inDungeon()))
                this.endGame();
        } else {
            console.log("escape roll failed")
            this.canTryToEscape = false;
        }
        this.updateItemsUsability();
    }

    wantToUseItem(playerId, itemId, arg) {
        console.log("wantToUseItem")
        let player = this.findPlayerById(playerId)
        let item = player.stuff.find(i => i.id === itemId)
        if (((this.phase == "GAME_SETUP") || (this.phase == "GAME_LOOP" && this.isMyTurn(playerId)))
            && item) { // it's his turn (or we're setting up the game) and he got the item
            item.tryToUse(player, this, arg);
            this.updateItemsUsability();
        }
    }

    updateItemsUsability() {
        const player = this.getCurrentPlayer();
        if (!player) return;
        player.stuff.forEach(item => {
            if (ieCanUse[item.key]) {
                item.canBeUsed = ieCanUse[item.key](item, player, this);
                if (item.canBeUsed) console.log(`Item ${item.title} (${item.key}) is usable for ${player.name}`);
            } else {
                item.canBeUsed = false;
            }
        });
    }

    gameLoop() {
        this.phase = "GAME_LOOP";
        console.log("game loop")

        if (!this.players.length) {
            console.warn("No players available to start the game loop");
            return;
        }

        const preferredIndex = this.players.findIndex(player => player.startGame);
        const randomIndex = Math.floor(Math.random() * this.players.length);
        this.currentPlayerIndex = preferredIndex >= 0 ? preferredIndex : randomIndex;
        const currentPlayer = this.players[this.currentPlayerIndex];
        currentPlayer.turnNumber++;

        console.log("donjon set up ok")
    }

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
                    console.log(`- ${player.name} `);
                });
                finalPlayers = playersInDungeon;
                console.log("Des joueurs sont arrivés vivants au bout du donjon, les fuyards sont exclus.");
            } else {
                finalPlayers = this.players.filter(player => !player.dead);
                if (finalPlayers.length > 0) {
                    console.log("Aucun joueur n'a poncé le donjon, tous les joueurs vivants comptent.");
                } else {
                    console.log("Tous les joueurs sont morts.");
                }
            }
            // Include players with always_count attribute
            const alwaysCountPlayers = this.players.filter(player => player.always_count);
            alwaysCountPlayers.forEach(player => {
                if (!finalPlayers.includes(player)) {
                    finalPlayers.push(player);
                }
            });
            // case no one won
            if (!finalPlayers.length) {
                console.log("Personne ne gagne.");
                this.room.broadcast("endScores", { "winner": null, "finalPlayers": [] });
                return;
            }

            this.players.forEach(player => {
                if (finalPlayers.includes(player)) {
                    console.log(`${player.name} est inclus dans le décompte final.`);
                } else {
                    if (player.dead) {
                        console.log(`${player.name} est exclu du décompte final car il est mort.`);
                    } else if (player.fled) {
                        console.log(`${player.name} est exclu du décompte final car il a fui le donjon.`);
                    } else {
                        console.log(`${player.name} A BUG ?? ${player.alive} ${player.fled} ${player.inDungeon} `);
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
    hostId: "string",
    minPlayersToStart: "number",
    maxPlayers: "number",
    gameMode: "string",
    itemDeck: [ItemCard],
    currentPlayerIndex: "number",
    dungeon: [DungeonCard],
    dungeonLength: "number",
    currentCard: DungeonCard,
    canTryToEscape: "boolean",
    canExecute: "boolean",
    trap: "boolean",
    discardPile: [DungeonCard],
    turnNumber: "number",
});

module.exports = { GameState };
