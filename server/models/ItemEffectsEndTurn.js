const h = require('./Helper.js');
const ieEndTurn = {
    life_ring: (item, player, game) => {
        if (!item.broken && player.hp >= 6 && player.monstersBeatenThisTurn >= 1) {
            player.gainHP(1)
        }
    },

    heart: (item, player, game) => {
        if (!item.broken && player.monstersBeatenThisTurn >= 2) {
            player.gainHP(1)
        }
    },
    lootbox: async (item, player, game) => {
        if (!item.broken) {
            for (let i = 0; i < player.monstersBeatenThisTurn; i++) {
                await new Promise((resolve) => {
                    h.playerRollDice(game, player, (roll) => {
                        if (roll === 6) {
                            player.pickItem(game);
                        }
                        resolve();
                    });
                });
            }
        }
        return Promise.resolve();
    },

    crystal: (item, player, game) => {
        item.setIndication(null, game);
    },
};
// Example usage
// const key = 'midas';
// items[key]?.(item, player, game);
module.exports = ieEndTurn;