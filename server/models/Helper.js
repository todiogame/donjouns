
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

module.exports = {
    execute,
    executeAndDiscard,
    executeAndLeech,
};