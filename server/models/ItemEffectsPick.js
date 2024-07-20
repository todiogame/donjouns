const h = require('./Helper.js');
const iePick = {
    crystal: (item, player, game) => {
        item.setIndication(null, game);
    },

    dragon_shield: (item, player, game) => {
        if (item.broken && game.inFight() && h.currentCardHasType(game, "Dragon")) {
            item.fix(player, game)
        }
    },

    fairy_potion: (item, player, game) => {
        if (item.broken && game.inFight() && h.currentCardHasTitle(game, "Fairy")) {
            item.fix(player, game)
        }
    },
};
// Example usage
// const key = 'midas';
// items[key]?.(item, player, game);
module.exports = iePick;