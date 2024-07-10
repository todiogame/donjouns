const schema = require("@colyseus/schema");
const { Schema, type } = schema;
const {DungeonCard} = require('./DungeonCard');

class EventCard extends DungeonCard {
    constructor(id, title, description, effect = null) {
        super(id, title, "event", description, effect);
        this.event = true;
    }
}

schema.defineTypes(EventCard, {
    event: "boolean"
});

module.exports = { EventCard };
