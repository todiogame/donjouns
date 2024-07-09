const schema = require("@colyseus/schema");
const { Schema, type } = schema;

class ItemCard extends Schema {
    constructor(id) {
        super();
        this.id = id;
        this.texture = 'items_' + String(id).padStart(3, '0');
    }
}

schema.defineTypes(ItemCard, {
    id: "number",
    texture: "string"
});

module.exports = { ItemCard };
