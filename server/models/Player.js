const schema = require("@colyseus/schema");
const { Schema, type, ArraySchema } = schema;
const { ItemCard } = require('./ItemCard');
const { DungeonCard } = require('./DungeonCard');
const ieScore = require('./ItemEffectsScore');

class Player extends Schema {
    constructor(id, name) {
        super();
        this.id = id;
        this.name = name;
        this.hand = new ArraySchema(); // for drafting only
        this.stuff = new ArraySchema();
        this.selectedItemCardIndex = -1;
        this.medals = 0;
        this.hp = 0;
        this.baseHP = 3;
        this.canPass = false;
        this.defeatedMonstersPile = new ArraySchema();
        this.score = 0;
        this.always_count = false;
        this.dead = false;
        this.fled = false;
        this.turnNumber = 0;
        this.monstersAddedThisTurn = 0;
        
        this.lastDamageTaken = 0;
        this.alreadyUsedItems = [];
    }
    // DRAFT PHASE
    addItemCardDraft(itemCard) {
        this.hand.push(itemCard);
    }
    addItemCardRandom(itemCard) {
        this.stuff.push(itemCard);
    }

    selectCard(index) {
        this.selectedItemCardIndex = index;
    }

    pickCard() {
        if (this.selectedItemCardIndex !== -1) {
            const itemCard = this.hand.splice(this.selectedItemCardIndex, 1)[0];
            this.selectedItemCardIndex = -1;
            return itemCard;
        } else {
            console.error("bug selectedItemCardIndex = -1");
        }
    }

    // DUNGEON PHASE
    inDungeon() {
        return !this.dead && !this.fled;
    }


    addItem(item) {
        this.stuff.push(item);
        // this.hp += item.hp;
        ieStartGame[item.key]?.(item, player, this);
    }

    loseHP(game, damage) {
        this.hp -= damage
        if (this.hp <= 0) {
            this.hp = 0;
            this.die(game)
        }
    }
    gainHP(heal) {
        this.hp += heal
    }

    setHP(value) {
        this.hp = value
    }

    pickItem(game) {
        this.addItem(game.itemDeck.pop());
    }

    rollToEscape() {
        const diceRoll = Math.floor(Math.random() * 6) + 1;
        return diceRoll;
    }
    
    rollDice() {
        const diceRoll = Math.floor(Math.random() * 6) + 1;
        return diceRoll;
    }

    flee(game) {
        console.log(this.name + "flee!")
        this.fled = true;
        game.passTurn()
    }

    die(game) {
        console.log(this.name + "died!")
        this.dead = true;
        game.passTurn()
    }

    addDefeatedMonster(card) {
        this.defeatedMonstersPile.push(card);
        this.monstersAddedThisTurn += 1;
    }

    scoreBonus(value) {
        if (!this.score_blocked)
            this.score = this.score + value
    }

    calculateScore(game) {
        //calculate score - non final
        this.score = this.defeatedMonstersPile.length;
        if (this.defeatedMonstersPile.some(monster => monster.effect && monster.effect.includes("GOLD"))) {
            // console.log("+1 pour le Golem d'or");
            this.score += 1;
        }
        this.stuff.forEach(item => {
            ieScore[item.key]?.(item, player, game, false);
        });
    }
    async calculateFinalScore(game) {
        //calculate score - final
        console.log(`Calcul du score de ${this.name} : ${this.defeatedMonstersPile.length} monstres vaincus.`);
        this.score = this.defeatedMonstersPile.length;
        if (this.defeatedMonstersPile.some(monster => monster.effect && monster.effect.includes("GOLD"))) {
            console.log("+1 pour le Golem d'or");
            this.score += 1;
        }
        for (const item of this.stuff) {
            if (ieScore[item.key]) {
                await ieScore[item.key](item, this, game, true);
            }
        }
    }

}

schema.defineTypes(Player, {
    id: "string",
    name: "string",
    hand: [ItemCard],
    stuff: [ItemCard],
    selectedItemCardIndex: "number",
    medals: "number",
    hp: "number",
    baseHP: "number",
    canPass: "boolean",
    defeatedMonstersPile: [DungeonCard],
    score: "number",
    dead: "boolean",
    fled: "boolean",
    turnNumber: "number",
    monstersAddedThisTurn: "number"
});

module.exports = { Player };
