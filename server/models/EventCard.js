const schema = require("@colyseus/schema");
const { Schema, type } = schema;
const { DungeonCard } = require('./DungeonCard');
const h = require('./Helper.js');
const { ieCanUse } = require("./ItemEffectsClick");

const SOULSTORM_CHOICE_TIMEOUT_MS = 12000;
const BIG_MONSTER_POWER_THRESHOLD = 7;
const PASSIVE_EXECUTE_KEYS = new Set([
    'hammer', 'pickaxe', 'sacred_book', 'rat_lich', 'pest', 'slayer_shield',
    'lich_bane', 'golem_shield', 'lich_skull', 'lich_armor', 'red_torch',
    'blue_torch', 'rat_ring', 'fire_ring', 'ocean_ring', 'sorcerer_hat', 'chainsaw',
    'magic_ring', 'katana', '13_16', 'noob_cape', 'noob_hat', 'noob_amu'
]);

function getCardPower(card) {
    if (!card) return 0;
    const numeric = Number(card.power);
    return Number.isFinite(numeric) ? numeric : 0;
}

function getSmallestMonster(cards = []) {
    return cards.reduce((best, card) => {
        if (!card) return best;
        if (!best) return card;
        const power = getCardPower(card);
        const bestPower = getCardPower(best);
        if (power === bestPower) return card.id < best.id ? card : best;
        return power < bestPower ? card : best;
    }, null);
}

function pileCards(player) {
    return Array.from(player?.defeatedMonstersPile || []);
}

function hasPassiveAnswer(player, game, monster) {
    const fakeGame = {
        ...game,
        currentCard: monster,
        trap: false,
        inFight: () => true,
        noCurrentCard: () => false,
    };
    return player.stuff.some(item =>
        !item.broken
        && (item.active === 0 || item.active === "0")
        && PASSIVE_EXECUTE_KEYS.has(item.key)
        && ieCanUse[item.key]?.(item, player, fakeGame));
}

function pickSoulstormCardForBot(bot, game) {
    const pile = pileCards(bot);
    if (!pile.length) return null;

    const bigManageable = pile
        .filter(card => {
            const isBig = card.types?.includes("Dragon") || getCardPower(card) >= BIG_MONSTER_POWER_THRESHOLD;
            return isBig && hasPassiveAnswer(bot, game, card);
        })
        .sort((a, b) => getCardPower(b) - getCardPower(a));
    if (bigManageable.length) return bigManageable[0];

    if (!bot.medals) {
        const medalGrinder = pile.find(c => (c.effect || c.baseEffect) === "MEDAL_GRINDER");
        if (medalGrinder) return medalGrinder;
        const vampireLord = pile.find(c => (c.effect || c.baseEffect) === "VAMPIRE_LORD");
        if (vampireLord) return vampireLord;
    }

    return getSmallestMonster(pile);
}

function getSoulstormChoice(player, game) {
    const pile = pileCards(player);
    if (!pile.length) return Promise.resolve(null);
    if (player.isBot) return Promise.resolve(pickSoulstormCardForBot(player, game));
    if (pile.length === 1) return Promise.resolve(pile[0]);

    return new Promise((resolve) => {
        const fallback = () => getSmallestMonster(pileCards(player));
        const entry = { resolve, fallback };
        if (game.pendingSoulstormChoices?.set) {
            // Clean stale entries for this player
            game.pendingSoulstormChoices.delete(player.id);
            entry.timeout = setTimeout(() => {
                game.pendingSoulstormChoices.delete(player.id);
                resolve(fallback());
            }, SOULSTORM_CHOICE_TIMEOUT_MS);
            game.pendingSoulstormChoices.set(player.id, entry);
        }

        const targetClient = game.room.clients.find(c => c.id === player.id);
        if (targetClient) {
            targetClient.send("game_action", { action: "soulstorm_pick", cards: pile });
        } else {
            if (entry.timeout) clearTimeout(entry.timeout);
            game.pendingSoulstormChoices?.delete?.(player.id);
            resolve(fallback());
        }
    });
}

class EventCard extends DungeonCard {
    constructor(id, title, description, effect = "", optional = false) {
        super(id, title, "event", description, effect);
        this.event = true;
        this.baseEffect = this.effect;
        this.optional = optional === "1" || optional === 1 || optional === true;
        // console.log(this.id, this.title, this.dungeonCardType, this.texture, this.effect, optional, this.optional)
    }


    async onAcceptEvent(player, game, itemId) {
        console.log("onAcceptEvent", player.name, itemId)
        // console.log(this.title, this.optional)
        if (onEvent[this.effect]) {
            return await onEvent[this.effect](this, player, game, itemId);
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
                player.pickItem(game);
                item.discard(player, game)
            }
        }
    },
    WHEEL_OF_FORTUNE: async (card, player, game) => {
        await new Promise((resolve) => {
            h.playerRollDice(game, player, (roll) => {
                if (roll <= 2) {
                    player.loseHP(game, 2);
                } else if (roll >= 5) {
                    player.gainHP(2);
                }
                resolve();
            });
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
        //todo (all events?) block items usage to stop someone from having a free use on an item
        let item = player.stuff.find(i => i.broken && i.id === itemToFix)
        if (item) item.fix(player, game)
    },
    INCEPTION: (card, player, game, itemId) => {
        const lastEventCard = game.discardPile.reverse().find(c => c.type === 'event');
        if (lastEventCard) {
            card.effect = lastEventCard.effect
            card.optional = lastEventCard.optional
            onEvent[this.effect](this, player, game, itemId);
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
    SOULSTORM: async (card, player, game) => {
        if (game.pendingSoulstormChoices?.clear) {
            game.pendingSoulstormChoices.clear();
        }
        const participants = game.players.filter(p => p.inDungeon() && p.defeatedMonstersPile.length);
        if (!participants.length) return;

        const choices = await Promise.all(participants.map(p => getSoulstormChoice(p, game)));
        let added = 0;
        choices.forEach((pickedCard, idx) => {
            if (!pickedCard) return;
            const owner = participants[idx];
            const selectedIdx = owner.defeatedMonstersPile.findIndex(c => c.id === pickedCard.id);
            const [removed] = selectedIdx >= 0 ? owner.defeatedMonstersPile.splice(selectedIdx, 1) : [];
            const cardToReturn = removed || pickedCard;
            game.dungeon.push(cardToReturn);
            added += 1;
        });
        if (added > 0) {
            game.shuffleDungeon();
            game.dungeonLength = game.dungeon.length;
        }
        if (game.pendingSoulstormChoices?.clear) {
            game.pendingSoulstormChoices.clear();
        }
    }
};

schema.defineTypes(EventCard, {
    event: "boolean",
    optional: "boolean"
});

module.exports = { EventCard };
