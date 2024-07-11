const schema = require("@colyseus/schema");
const { Schema, type } = schema;
const { DungeonCard } = require('./DungeonCard');

class MonsterCard extends DungeonCard {
    constructor(id, title, power, types = [], description = "", effect = "") {
        super(id, title, "monster", description, effect);
        this.power = power;
        this.types = types;
        this.damage = 0;
    }

    calculateDamage() {
        return this.power
    }
}

schema.defineTypes(MonsterCard, {
    power: "number",
    types: ["string"],
    damage: "number"
});

module.exports = { MonsterCard };
