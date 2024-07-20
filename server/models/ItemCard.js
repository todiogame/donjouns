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
        this.requireSetup = this.setRequireSetup()
        // client-side ui
        this.ui = this.pickUI()
        this.indication = null;
        this.uiCondition = null;

    }
    break() {
        this.broken = true
    }
    fix() {
        this.broken = false
    }
    tryToUse(player, game, arg = -1) {
        console.log(player.name, "tryToUse", this.title)
        ieClick[this.key]?.(this, player, game, arg);
    }

    pickUI() {
        if (["crystal", "vorpal_sword", "wind_ring"].includes(this.key)) return "number"
        if (["swiss"].includes(this.key)) return "my_items_broken"
        if (["anvil"].includes(this.key)) return "opponent_items_broken"
        if (["mana_potion", "purple_skull"].includes(this.key)) return "my_pile"
        // if (["divination"].includes(this.key)) return "dungeon_pile"
        if ([].includes(this.key)) return "discard_pile"
        if (["printer", "pirate_bomb"].includes(this.key)) return "my_items_intact"
        if (["vorpal_dagger"].includes(this.key)) return "monster_type"
        if (["sceptre"].includes(this.key)) return "opponent_hero"
    }

    setRequireSetup() {
        if (["vorpal_dagger", "vorpal_sword", "printer", "sceptre"].includes(this.key)) return true
    }

    setIndication(indication, game) {
        //have to cast to a string
        this.indication = (indication || indication == 0) ? "" + indication : null;
        if (game.phase === "GAME_SETUP" && game.allPlayersSetupReady()) {
            game.gameLoop()
        }
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
    requireSetup: "boolean",
    ui: "string",
    indication: "string",
});

module.exports = { ItemCard };
