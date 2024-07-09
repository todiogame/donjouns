export class Card {
    constructor(id) {
        this.id = id;
        this.texture = 'items_' + String(id).padStart(3, '0');
    }
}

export class Player {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.hand = [];
        this.selectedCards = [];
    }

}

export class Game {
    constructor() {
        this.itemDeck = [];
        this.players = [];
        this.currentPlayerIndex = 0;
    }

}
