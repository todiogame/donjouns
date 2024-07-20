const h = require('./Helper.js');
const ieEscapeRoll = {
    hammer: (item, player, game, escapeModifier) => {
        return - 1
    },
    monkey: (item, player, game, escapeModifier) => {
        return - 2
    },
    ball: (item, player, game, escapeModifier) => {
        return - 1
    },
    noob_geta: (item, player, game, escapeModifier) => {
        return 2
        //todo reroll if no medal
    },
    scuba: (item, player, game, escapeModifier) => {
        return - 3
    },
    tunic: (item, player, game, escapeModifier) => {
        return - 1
    },
    tp: (item, player, game, escapeModifier) => {
        // Todo: Escape mechanic at end of turn
    },
    slayer_belt: (item, player, game, escapeModifier) => {
        // Todo: Block escape if less than 6 HP
    }
};

module.exports = ieEscapeRoll;
