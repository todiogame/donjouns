const schema = require("@colyseus/schema");
const { Schema, type } = schema;

class ItemCard extends Schema {
    constructor(id, title, active, color, image, description = "") {
        super();
        this.id = parseInt(id);
        this.texture = 'items_' + String(id).padStart(3, '0');
        this.title = title;
        this.active = active;
        this.color = color;
        this.image = image;
        this.description = description;
        this.hp = 0;
        this.escapeRollModifier = 0;
        // Extract hp from description if it contains "PV + "
        const hpMatch = description.match(/PV \+ (\d+)/);
        this.hp = hpMatch ? parseInt(hpMatch[1], 10) : 0;
        // Extract escape roll modifier from description if it contains "Jet de fuite + "
        const escapeRollModMatch = description.match(/Jet de fuite \+ (\d+)/);
        this.escapeRollModifier = escapeRollModMatch ? parseInt(escapeRollModMatch[1], 10) : 0;

    }
}

schema.defineTypes(ItemCard, {
    id: "number",
    texture: "string",
    title: "string",
    active: "string",
    color: "string",
    image: "string",
    description: "string",
    hp: "number",
    escapeRollModifier : "number"
});

module.exports = { ItemCard };
