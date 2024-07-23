const h = require('./Helper.js');
const ieTakeDamage = {
    // CAREFUL THIS PROCS ON ALL PLAYER ITEMS
    // NEED TO CHECK THE OWNER EVERYTIME
    chalice: (item, player, owner, game) => {
        if (!item.broken && player.id != owner.id && player.lastDamageTaken >= 3) {
            owner.gainHP(1)
        }
    },
    breach: (item, player, owner, game) => {
        if (!item.broken && player.id != owner.id && game.inFight() && h.currentCardHasType(game, "Golem") && player.lastDamageTaken) {
            owner.gainHP(player.lastDamageTaken)
        }
    },
};

module.exports = ieTakeDamage;