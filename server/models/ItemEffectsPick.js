const h = require('./Helper.js');
const iePick = {
    crystal: (item, player, game) => {
        item.indication = null
    },
    
    dragon_shield: (item, player, game) => {
        if (item.broken && game.inFight() && h.currentCardHasType(game, "Dragon")) {
            item.fix()
        }
    },
    
    fairy_potion: (item, player, game) => {
        if (item.broken && game.inFight() && h.currentCardHasTitle(game, "Fairy")) {
            item.fix()
        }
    },
};
// Example usage
// const key = 'midas';
// items[key]?.(item, player, game);
module.exports = iePick;