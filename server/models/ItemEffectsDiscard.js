const h = require('./Helper.js');
const ieDiscard = {
    // CAREFUL THIS PROCS ON ALL PLAYER ITEMS
    // NEED TO CHECK THE OWNER EVERYTIME
    lich_skull: (item, player, owner, game) => {
        // steal opponents and discarded lichs
        if (player.id != owner.id && game.discardPile.length) {
            let discarded = game.discardPile[game.discardPile.length - 1];
            if (discarded?.dungeonCardType === "monster" && discarded.types.includes("Lich")) {
                discarded = game.discardPile.pop();
                owner.defeatedMonstersPile.push(discarded);
            }
        }
    },
};

module.exports = ieDiscard;