const h = require('./Helper.js');
const ieAddMonsterToPile = {
    // CAREFUL THIS PROCS ON ALL PLAYER ITEMS
    // NEED TO CHECK THE OWNER EVERYTIME
    lich_skull: (item, player, owner, game) => {
        // steal opponents and discarded lichs
        if (player.id != owner.id && player.defeatedMonstersPile.length) {
            let beatenMonster = player.defeatedMonstersPile[player.defeatedMonstersPile.length - 1];
            if (beatenMonster?.types.includes("Lich")) {
                beatenMonster = player.defeatedMonstersPile.pop();
                owner.defeatedMonstersPile.push(beatenMonster);
            }
        }
    },
};

module.exports = ieAddMonsterToPile;