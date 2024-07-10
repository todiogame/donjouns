const schema = require("@colyseus/schema");
const { Schema, type } = schema;

class DungeonCard extends Schema {
    constructor(id, title, dungeonCardType, description, effect = "") {
        super();
        this.id = id;
        this.texture = dungeonCardType + '_' + String(id).padStart(2, '0');
        this.title = title;
        this.dungeonCardType = dungeonCardType;
        this.description = description;
        this.effect = effect;
    }
}

schema.defineTypes(DungeonCard, {
    id: "string",
    texture: "string",
    title: "string",
    dungeonCardType: "string",
    description: "string",
    effect: "string"
});

module.exports = {DungeonCard};
