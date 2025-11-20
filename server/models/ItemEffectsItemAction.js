const h = require('./Helper.js');

function rollForAnimatedChest(ownerItem, actingPlayer, owner, game, targetItem) {
    if (!ownerItem || ownerItem.broken) return;
    if (!actingPlayer || !targetItem || !owner) return;
    if (owner.id === actingPlayer.id) return;
    if (typeof actingPlayer.inDungeon === "function" && !actingPlayer.inDungeon()) return;
    if (!targetItem.broken) return;

    h.playerRollDice(game, owner, (roll) => {
        if (roll === 6 && owner.inDungeon()) {
            const stolen = game.stealItemFromPlayer(targetItem, actingPlayer, owner);
            if (stolen) {
                game.updateItemsUsability();
            }
        }
    });
}

const ieItemActivated = {};

const ieItemBroken = {
    chest: (ownerItem, actingPlayer, owner, game, targetItem) => {
        rollForAnimatedChest(ownerItem, actingPlayer, owner, game, targetItem);
    },
};

module.exports = { ieItemActivated, ieItemBroken };
