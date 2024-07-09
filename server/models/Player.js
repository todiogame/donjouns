const schema = require("@colyseus/schema");
const { Schema, type, ArraySchema } = schema;
const ItemCard = require('./ItemCard');
const DungeonCard = require('./DungeonCard');

class Player extends Schema {
    constructor(id, name) {
        super();
        this.id = id;
        this.name = name;
        this.hand = new ArraySchema();
        this.selectedItemCards = new ArraySchema();
        this.selectedItemCardIndex = -1;
        this.medals = 0;
        this.hp = 0;
        this.base_hp = 0;
        this.monstersPile = new ArraySchema();
        this.score = 0;
        this.dead = false;
        this.fled = false;
    }

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
}

schema.defineTypes(Player, {
    id: "string",
    name: "string",
    hand: [ItemCard],
    selectedItemCards: [ItemCard],
    selectedItemCardIndex: "number",
    medals: "number",
    hp: "number",
    base_hp: "number",
    monstersPile: [DungeonCard],
    score: "number",
    dead: "boolean",
    fled: "boolean"
});

module.exports = Player;
