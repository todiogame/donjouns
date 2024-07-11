const schema = require("@colyseus/schema");
const { Schema, type } = schema;
const ie = require('./ItemEffects');

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
        this.hp = 0;
        this.escapeRollModifier = 0;
        // Extract hp from description if it contains "PV + "
        const hpMatch = description.match(/PV \+ (\d+)/);
        this.hp = hpMatch ? parseInt(hpMatch[1], 10) : 0;
        // Extract escape roll modifier from description if it contains "Jet de fuite + "
        const escapeRollModMatch = description.match(/Jet de fuite \+ (\d+)/);
        this.escapeRollModifier = escapeRollModMatch ? parseInt(escapeRollModMatch[1], 10) : 0;
    }
    break() {
        this.broken = true
    }
    tryToUse(player, game) {
        ie[this.key]?.(this, player, game);
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
    hp: "number",
    escapeRollModifier: "number"
});

module.exports = { ItemCard };
