
function execute(player, game) {
    if (game.currentCard?.dungeonCardType == "monster") {
        player.addToPile(game.currentCard)
        game.currentCard = null;
        player.canPass = true;
    }
}

function executeAndDiscard(player, game) {
    if (game.currentCard?.dungeonCardType == "monster") {
        game.discard(game.currentCard)
        game.currentCard = null;
        player.canPass = true;
    }
}

function executeAndLeech(player, game) {
    if (game.currentCard?.dungeonCardType == "monster") {
        if (parseInt(game.currentCard.power) > 0) player.gainHP(game.currentCard.power)
        player.addToPile(game.currentCard)
        game.currentCard = null;
        player.canPass = true;
    }
}

function surviveWith(player, game, hp) {
    player.setHP(hp)
    if (game.inFight()) {
        player.addToPile(game.currentCard)
        game.currentCard = null;
        player.canPass = true;
    }
}

function playerPileContainsType(player, type) {
    return player.defeatedMonstersPile.some(card => card.types.includes(type));
}

function currentCardHasType(game, type) {
    return game.currentCard?.types.includes(type)
}

function reduceDamage(game, item, value, minDamage = 0) {
    if (game.currentCard?.dungeonCardType == "monster" && !game.currentCard.affectedBy.includes(item.key)
        && game.currentCard.damage > minDamage) {
        console.log("reduce damage by " + value);
        let damage = game.currentCard.damage - value
        game.currentCard.damage = (damage > minDamage) ? damage : minDamage;
        game.currentCard.affectedBy.push(item.key)
    }
}




module.exports = {
    execute,
    executeAndDiscard,
    executeAndLeech,
    playerPileContainsType,
    currentCardHasType,
    surviveWith,
    reduceDamage,
};