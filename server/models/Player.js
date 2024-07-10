const schema = require("@colyseus/schema");
const { Schema, type, ArraySchema } = schema;
const {ItemCard} = require('./ItemCard');
const {DungeonCard} = require('./DungeonCard');

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
        this.baseHp = 0;
        this.defeatedMonstersPile = new ArraySchema();
        this.score = 0;
        this.dead = false;
        this.fled = false;
        this.monstersAddedThisTurn = 0;
    }
    // DRAFT PHASE
    addItemCard(itemCard) {
        this.hand.push(itemCard);
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
        return null;
    }

    // DUNGEON PHASE
    inDungeon(){
        return !this.dead && !this.fled;
    }

    
    addItem(item) {
        this.stuff.push(item);
        this.totalHP += item.hp;
    }

    calculateEscapeRollModifiers() {
        return this.stuff.reduce((modifier, item) => modifier + item.escapeRollModifier, 0);
    }

    flee() {
        this.fleeSuccessful = true;
        this.inDungeon = false;
    }

    die() {
        this.alive = false;
        this.inDungeon = false;
    }

    calculateFinalScore(logDetails) {
        // logDetails.push(`Calculating score for ${this.name}: ${this.defeatedMonstersPile.length} defeated monsters.`);
        this.finalScore = this.defeatedMonstersPile.length;
        if (this.defeatedMonstersPile.some(monster => monster.effect && monster.effect.includes("GOLD"))) {
            // logDetails.push("+1 for the Golden Golem");
            this.finalScore += 1;
        }
        this.stuff.forEach(item => item.onScore(this, logDetails));
    }


    rollDice(game, logDetails, desiredRoll = 4, reversed = false, rerolled = false) {
        desiredRoll = Math.min(6, Math.max(1, desiredRoll));
        let roll = Math.floor(Math.random() * 6) + 1;
        logDetails.push(`${this.name} rolls a ${roll}`);
        // this.stuff.forEach(item => {
        //     const newRoll = item.onRoll(this, roll, desiredRoll, reversed, rerolled, game, logDetails);
        //     if (newRoll && newRoll !== roll) {
        //         roll = newRoll;
        //     }
        // });
        return roll;
    }

    resetAddedMonsters() {
        this.monstersAddedThisTurn = 0;
    }

    addDefeatedMonster(card) {
        this.defeatedMonstersPile.push(card);
        this.monstersAddedThisTurn += 1;
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
    baseHp: "number",
    defeatedMonstersPile: [DungeonCard],
    score: "number",
    dead: "boolean",
    fled: "boolean",
    monstersAddedThisTurn : "number"
});

module.exports = { Player };
