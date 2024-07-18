const schema = require("@colyseus/schema");
const { Schema, type } = schema;
const { DungeonCard } = require('./DungeonCard');

class MonsterCard extends DungeonCard {
    constructor(id, title, power, types = [], description = "", effect = "") {
        super(id, title, "monster", description, effect);
        this.power = power;
        this.originalPower = power;
        this.types = types;
        this.damage = this.calculateDamage();
    }

    calculateDamage() {
        return this.power //add bonus damage
    }

    odd(){
        return this.power % 2 !== 0
    }
    even(){
        return this.power % 2 == 0
    }
}

schema.defineTypes(MonsterCard, {
    power: "number",
    types: ["string"],
    damage: "number"
});

module.exports = { MonsterCard };
