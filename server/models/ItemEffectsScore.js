const h = require('./Helper.js');
const ieScore = {
    monkey: (item, player, game, final = false) => {
        if (!item.broken) {
            // Au décompte final, lancez le dé. Gagnez autant de Points de Victoire.
            if (final) {
                //todo dice effect
            }
        }
    },
    eternity_hammer: (item, player, game, final = false) => {
        if (!item.broken) {
            // Vous comptez dans le décompte final même si vous mourrez.
            player.scoreBonus(-1)
            if (final) {
                player.always_count = true;
            }
        }
    },
    tunic: (item, player, game, final = false) => {
        if (!item.broken) {
            player.scoreBonus(1)
        }
    },
    damned_plate: (item, player, game, final = false) => {
        if (!item.broken) {
            player.scoreBonus(-1)
        }
    },
    soul_stone: (item, player, game, final = false) => {
        if (!item.broken) {
            if (h.playerPileContainsType(player, "Dragon")) player.scoreBonus(3)
        }
    },
    purse: (item, player, game, final = false) => {
        if (!item.broken) {
            player.scoreBonus(1)
        }
    },
    honor_armor: (item, player, game, final = false) => {
        if (!item.broken) {
            if (player.dead) {
                player.score = 4
                player.score_blocked = true;
                if (final) player.always_count = true;
            }
        }
    },
};

module.exports = ieScore;