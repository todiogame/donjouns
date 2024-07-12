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
        this.canPass = false;
        this.defeatedMonstersPile = new ArraySchema();
        this.score = 0;
        this.dead = false;
        this.fled = false;
        this.monstersAddedThisTurn = 0;
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
    inDungeon(){
        return !this.dead && !this.fled;
    }

    
    addItem(item) {
        this.stuff.push(item);
        this.hp += item.hp;
    }

    loseHP(damage){
        this.hp -= damage
        if(this.hp <=0){
            this.hp = 0;
            this.die()
        }
    }
    gainHP(heal){
        this.hp += heal
    }

    addToPile(monsterCard){
        this.defeatedMonstersPile.push(monsterCard)
    }

    pickItem(game) {
        this.addItem(game.itemDeck.pop());
    }

    rollToEscape(){
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
        // game.passTurn()
    }

    calculateFinalScore(logDetails) {
        // logDetails.push(`Calculating score for ${this.name}: ${this.defeatedMonstersPile.length} defeated monsters.`);
        this.score = this.defeatedMonstersPile.length;
        if (this.defeatedMonstersPile.some(monster => monster.effect && monster.effect.includes("GOLD"))) {
            // logDetails.push("+1 for the Golden Golem");
            this.score += 1;
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
    canPass: "boolean",
    defeatedMonstersPile: [DungeonCard],
    score: "number",
    dead: "boolean",
    fled: "boolean",
    monstersAddedThisTurn : "number"
});

module.exports = { Player };
