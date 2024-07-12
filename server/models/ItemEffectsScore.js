const h = require('./Helper.js');
const ieScore = {
    monkey: (item, player, game) => {
        // Au décompte final, lancez le dé. Gagnez autant de Points de Victoire.
    },
    eternity_hammer: (item, player, game) => {
        // Vous comptez dans le décompte final même si vous mourrez.
        // Points de Victoire -1.
    },
    tunic: (item, player, game) => {
        // Points de Victoire + 1.
    },
    damned_plate: (item, player, game) => {
        // Points de Victoire -1.
    },
    soul_stone: (item, player, game) => {
        // Points de Victoire + 3, si vous avez au moins un Dragon dans votre pile.
    },
    purse: (item, player, game) => {
        // Points de Victoire + 1.
    },
    honor_armor: (item, player, game) => {
        // Même si vous mourrez, vous comptez dans le décompte final avec un score de 4 (pas de modifications).
    },
    living_armor: (item, player, game) => {
        // PV + le nombre de joueurs dans la partie
    }
};

module.exports = ieScore;