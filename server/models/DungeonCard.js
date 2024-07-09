const schema = require("@colyseus/schema");
const { Schema, type } = schema;

class DungeonCard extends Schema {
    constructor(id, title, description, effect = null) {
        super();
        this.id = id;
        this.texture = 'dungeon_' + String(id).padStart(3, '0');
        this.title = title;
        this.description = description;
        this.effect = effect;
    }
}

schema.defineTypes(DungeonCard, {
    id: "string",
    texture: "string",
    title: "string",
    description: "string",
    effect: "string"
});

module.exports = {DungeonCard};
