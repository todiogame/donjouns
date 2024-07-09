const DungeonCard = require('./DungeonCard');

class MonsterCard extends DungeonCard {
    constructor(id, title, power, types = [title], description = "", effect = null) {
        super(id, title, description, effect);
        this.power = power;
        this.types = types;
        this.executed = false;
        this.damage = 0;
    }
}

schema.defineTypes(MonsterCard, {
    power: "number",
    types: ["string"],
    executed: "boolean",
    damage: "number"
});

module.exports = MonsterCard;
