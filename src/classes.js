export class Game {
    constructor() {
        this.phase = "DRAFT";
        this.players = [];
        this.itemDeck = [];
        this.currentPlayerIndex = 0;
        this.dungeon = [];
        this.dungeonLength = 0;
        this.currentCard = null;
        this.discardPile = [];
        this.turnNumber = 0;
    }
    noCurrentCard() {
        return !this.currentCard || this.currentCard._id === undefined
    }
    isMyTurn(myId){
        return this.players[this.currentPlayerIndex].id === myId
    }
    getCurrentPlayer(){
        return this.players[this.currentPlayerIndex];
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
        this.baseHP = 0;
        this.canPass = false;
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
}


export class DungeonCard {
    constructor(id, title, dungeonCardType, description, effect = "") {
        this.id = id;
        this.texture = dungeonCardType + '_' + String(id).padStart(2, '0');
        this.title = title;
        this.dungeonCardType = dungeonCardType;
        this.description = description;
        this.effect = effect;
    }
}

export class MonsterCard extends DungeonCard {
    constructor(id, title, power, types = [], description = "", effect = "") {
        super(id, title, "monster", description, effect);
        this.power = power;
        this.types = types;
        this.damage = 0;
    }
}

export class EventCard extends DungeonCard {
    constructor(id, title, description, effect = "") {
        super(id, title, "event", description, effect);
        this.event = true;
    }
}
