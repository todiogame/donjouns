const schema = require("@colyseus/schema");
const { Schema, type } = schema;
const { DungeonCard } = require('./DungeonCard');
const { onMeet, onSpecialEffect, onFaceBeforeDamage, onFaceAfterDamage, onBeaten, onScore } = require('./SpecialMonsters');

class MonsterCard extends DungeonCard {
    constructor(id, title, power, types = [], description = "", effect = "") {
        super(id, title, "monster", description, effect);
        this.power = power;
        this.basePower = power;
        this.types = types;
        this.bonusDamage = 0;
        this.timesDealDamage = 1;
        this.damage = this.calculateDamage();
        this.baseEffect = this.effect;
        this.specialUI = ["KRAKEN","GUARDIAN_ANGEL","SHAPESHIFTER"].includes(this.effect)
    }

    calculateDamage() {
        return this.power + this.bonusDamage
    }

    odd() {
        return this.power % 2 !== 0
    }
    even() {
        return this.power % 2 == 0
    }

    onMeetMonster(player, game) {
        if (onMeet[this.effect]) {
            onMeet[this.effect](this, player, game);
        }
    }
    onSpecialEffect(player, game, shapeshifterType) {
        if (onSpecialEffect[this.effect]) {
            onSpecialEffect[this.effect](this, player, game, shapeshifterType);
        }
    }
    onFaceBeforeDamageMonster(player, game, itemToOoze) {
        if (onFaceBeforeDamage[this.effect]) {
            onFaceBeforeDamage[this.effect](this, player, game, itemToOoze);
        }
    }
    onFaceAfterDamageMonster(player, game) {
        if (onFaceAfterDamage[this.effect]) {
            onFaceAfterDamage[this.effect](this, player, game);
        }
    }
    onBeatenMonster(player, game) {
        if (onBeaten[this.effect]) {
            onBeaten[this.effect](this, player, game);
        }
    }
    onScoreMonster(player, game) {
        if (onScore[this.effect]) {
            onScore[this.effect](this, player, game);
        }
    }
}

schema.defineTypes(MonsterCard, {
    power: "number",
    types: ["string"],
    damage: "number",
    timesDealDamage: "number",
    specialUI:"boolean"
});

module.exports = { MonsterCard };
