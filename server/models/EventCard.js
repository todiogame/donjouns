const schema = require("@colyseus/schema");
const { Schema, type } = schema;
const { DungeonCard } = require('./DungeonCard');
const h = require('./Helper.js');

class EventCard extends DungeonCard {
    constructor(id, title, description, effect = "", optional = false) {
        super(id, title, "event", description, effect);
        this.event = true;
        this.optional = optional === "1" || optional === 1 || optional === true;
        console.log(this.id, this.title, this.dungeonCardType, this.texture, this.effect, optional, this.optional)
    }


    onAcceptEvent(player, game, itemId) {
        console.log("onAcceptEvent", player.name, itemId)
        // console.log(this.title, this.optional)
        if (onEvent[this.effect]) {
            onEvent[this.effect](this, player, game, itemId);
        }
    }
}

const onEvent = {
    SECRET_SHOP: (card, player, game, itemId) => {
        const intactItems = player.stuff.filter(i => !i.broken);
        if (intactItems.length < 4) {
            player.pickItem(game);
        } else if (itemId != null) {
            let item = player.stuff.find(i => !i.broken && i.id === itemId)
            if (item) {
                item.discard(player, game)
                player.pickItem(game);
            }
        }
    },
    WHEEL_OF_FORTUNE: (card, player, game) => {
        h.playerRollDice(game, player, (roll) => {
            if (roll <= 2) {
                player.loseHP(game, 2);
            } else if (roll >= 5) {
                player.gainHP(2);
            }
        });
    },
    HEALING_ANGEL: (card, player, game) => {
        player.gainHP(3);
        game.players.filter(p => p.inDungeon()).forEach(p => {
            if (p !== player) p.gainHP(2);
        });
    },
    EVIL_TRAP: (card, player, game) => {
        game.trap = true;
    },
    ALLY: (card, player, game) => {
        game.nextMonsterCondition = (state) => state.inFight();
        game.nextMonsterAction = (state) => h.execute(player, state);
    },
    HANDYMAN: (card, player, game, itemToFix) => {
        let item = player.stuff.find(i => !i.broken && i.id === itemToFix)
        if (item) item.fix(player, game)
    },
    INCEPTION: (card, player, game) => {
        const lastEventCard = game.discardPile.reverse().find(c => c.type === 'event');
        if (lastEventCard) {
            //todo
            console.log(lastEventCard?.effect);
        }
    },
    DRAGON_SKINNER: (card, player, game) => {
        //todo give a choice?
        game.players.filter(p => p.inDungeon()).forEach(p => {
            const dragonCards = p.defeatedMonstersPile.filter(c => c.types.includes('Dragon'));
            dragonCards.forEach(dragonCard => {
                h.discardFromPile(dragonCard.id, p, game);
                p.pickItem(game);
            });
        });
    },
    CLAY_INJECTION: (card, player, game) => {
        game.players.filter(p => p.inDungeon()).forEach(p => {
            const golemCards = p.defeatedMonstersPile.filter(c => c.types.includes('Golem'));
            p.gainHP(golemCards.length * 2);
        });
    },
    SOULSTORM: (card, player, game) => {
        game.players.forEach(p => {
            //todo let players pick
            const monsterCard = p.defeatedMonstersPile.pop();
            if (monsterCard) {
                game.dungeon.push(monsterCard);
                game.shuffleDungeon();
            }
        });
    }
};

schema.defineTypes(EventCard, {
    event: "boolean",
    optional: "boolean"
});

module.exports = { EventCard };
