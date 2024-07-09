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
        this.selectedItemCards = [];
        this.selectedItemCardIndex = -1;
        this.medals = 0;
        this.hp = 0;
        this.base_hp = 0;
        this.monstersPile = [];
        this.score = 0;
        this.dead = false;
        this.fled = false;
    }

}

export class ItemCard {
    constructor(id) {
        this.id = id;
        this.texture = 'items_' + String(id).padStart(3, '0');
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

