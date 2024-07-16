
function execute(player, game) {
    if (game.currentCard?.dungeonCardType == "monster") {
        game.room.broadcast("animate_execute", { playerId: player.id });
        player.addDefeatedMonster(game.currentCard)
        game.currentCard = null;
        player.canPass = true;
        player.lastDamageTaken = 0;
        game.canTryToEscape = true;
    }
}

function executeAndDiscard(player, game) {
    if (game.currentCard?.dungeonCardType == "monster") {
        game.room.broadcast("animate_execute", { playerId: player.id });
        game.discard(game.currentCard)
        game.currentCard = null;
        player.canPass = true;
        player.lastDamageTaken = 0;
        game.canTryToEscape = true;
    }
}

function executeAndLeech(player, game) {
    if (game.currentCard?.dungeonCardType == "monster") {
        game.room.broadcast("animate_execute", { playerId: player.id });
        if (parseInt(game.currentCard.power) > 0) player.gainHP(game.currentCard.power)
        player.addDefeatedMonster(game.currentCard)
        game.currentCard = null;
        player.canPass = true;
        player.lastDamageTaken = 0;
        game.canTryToEscape = true;
    }
}

function surviveWith(player, game, hp) {
    player.setHP(hp)
    if (game.inFight()) {
        player.addDefeatedMonster(game.currentCard)
        game.currentCard = null;
        player.canPass = true;
        game.canTryToEscape = true;
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

function scout(game, player, nbCards, position = 0) {
    const targetClient = game.room.clients.find(c => c.id === player.id);
    if (targetClient) {
        const cards = game.dungeon.slice(-position - nbCards, -position || undefined).reverse();
        targetClient.send("scout", { cards });
    }
}


function playerRollDice(game, player, callback) {
    game.room.broadcast("animate_roll", { playerId: player.id });
    let diceRoll = player.rollDice();
    setTimeout(() => {
        console.log(`broadcast dice_roll result for ${player.id}:`, diceRoll);
        game.room.broadcast('roll_result', { result: diceRoll });
        callback(diceRoll);
    }, 1000); // 1000 milliseconds delay
}



module.exports = {
    execute,
    executeAndDiscard,
    executeAndLeech,
    playerPileContainsType,
    currentCardHasType,
    surviveWith,
    reduceDamage,
    scout,
    playerRollDice,
};