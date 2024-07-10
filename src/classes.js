export class Game {
    constructor() {
        this.phase = "DRAFT";
        this.itemDeck = [];
        this.players = [];
        this.currentPlayerIndex = 0;
        this.dungeon = [];
        this.dungeonLength = 0;
        this.discardPile = [];
        this.turnNumber = 0;
    }
}

export class Player {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.hand = [];
        this.stuff = [];
        this.selectedItemCardIndex = -1;
        this.medals = 0;
        this.hp = 0;
        this.baseHp = 0;
        this.defeatedMonstersPile = [];
        this.score = 0;
        this.dead = false;
        this.fled = false;
        this.monstersAddedThisTurn = 0;
    }

}

export class ItemCard {
    constructor(id, title, active, color, image, description) {
        this.id = id;
        this.texture = 'items_' + String(id).padStart(3, '0');
        this.title = title;
        this.active = active;
        this.color = color;
        this.image = image;
        this.description = description;

        // Extract hp from description if it contains "PV + "
        const hpMatch = description.match(/PV \+ (\d+)/);
        this.hp = hpMatch ? parseInt(hpMatch[1], 10) : 0;
        // Extract escape roll modifier from description if it contains "Jet de fuite + "
        const escapeRollModMatch = description.match(/Jet de fuite \+ (\d+)/);
        this.escapeRollModifier = escapeRollModMatch ? parseInt(escapeRollModMatch[1], 10) : 0;
    }
}


export class DungeonCard {
    constructor(id) {
        this.id = id;
        this.texture = 'dungeon_' + String(id).padStart(3, '0');
        this.title = title;
        this.description = description;
        this.effect = effect;
    }
}

export class MonsterCard extends DungeonCard {
    constructor(title, power, types = [title], description = "", effect = null) {
        super(title, description, effect);
        this.power = power;
        this.types = types;
        this.damage = 0;
    }
}

export class EventCard extends DungeonCard {
    constructor(title, description, effect = null) {
        super(title, description, effect);
        this.event = true;
    }
}

