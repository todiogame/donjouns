const schema = require("@colyseus/schema");
const { Schema, type } = schema;
const ieClick = require('./ItemEffectsClick');

class ItemCard extends Schema {
    constructor(id, title, active, color, key, description = "") {
        super();
        this.id = parseInt(id);
        this.texture = 'items_' + String(id).padStart(3, '0');
        this.title = title;
        this.active = active;
        this.color = color;
        this.key = key;
        this.description = description;
        this.broken = false;
        // client-side ui
        this.ui = null;
        this.uiCondition = null;
        // test to remove
        this.ui = this.key == "crystal" ? "number" : null

    }
    break() {
        this.broken = true
    }
    tryToUse(player, game, arg = -1) {
        console.log(player.name, "tryToUse", this.title)
        ieClick[this.key]?.(this, player, game, arg);
    }
}

schema.defineTypes(ItemCard, {
    id: "number",
    texture: "string",
    title: "string",
    active: "string",
    color: "string",
    key: "string",
    description: "string",
    broken: "boolean",
    ui: "string",
    uiCondition: "string",
});

module.exports = { ItemCard };
