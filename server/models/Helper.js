
function execute(player, game) {
    if (game.currentCard?.dungeonCardType == "monster") {
        game.room.broadcast("game_action", { action: 'animate_execute', playerId: player.id });
        //trigger effects on special monster beaten
        game.currentCard.onBeatenMonster(player, game)

        player.addDefeatedMonster(game.currentCard, game)
        player.lastDamageTaken = 0;
        game.afterDoneWithMonster(player)
    }
}

function executeAndDiscard(player, game) {
    if (game.currentCard?.dungeonCardType == "monster") {
        game.room.broadcast("game_action", { action: 'animate_execute', playerId: player.id });
        //trigger effects on special monster beaten
        game.currentCard.onBeatenMonster(player, game)

        game.discard(player, game.currentCard)
        player.monstersBeatenThisTurn++;
        player.lastDamageTaken = 0;
        game.afterDoneWithMonster(player)
    }
}

function surviveWith(player, game, hp) {
    player.setHP(hp)
    if (game.inFight()) {
        player.lastDamageTaken = Math.min(game.currentCard.damage, player.hp);
        //trigger effects on special monster beaten
        game.currentCard.onBeatenMonster(player, game)

        player.addDefeatedMonster(game.currentCard, game)
        game.afterDoneWithMonster(player)
    }
}

function executeAndLeech(player, game) {
    if (game.inFight() && parseInt(game.currentCard?.power) > 0)
        player.gainHP(game.currentCard.power)
    execute(player, game)
}

function playerPileContainsType(player, type) {
    return player.defeatedMonstersPile.some(card => card.types.includes(type));
}

function currentCardHasType(game, type) {
    return game.currentCard?.types.includes(type)
}

function currentCardHasTitle(game, title) {
    return game.currentCard?.title === title;
}

function reduceDamage(game, item, player, value, minDamage = 0) {
    if (game.currentCard?.dungeonCardType == "monster" && !player.alreadyUsedItems.includes(item.key)
        && game.currentCard.damage > minDamage) {
        console.log("reduce damage by " + value);
        let damage = game.currentCard.damage - value
        game.currentCard.damage = (damage > minDamage) ? damage : minDamage;
        player.alreadyUsedItems.push(item.key)
    }
}

function scout(game, player, nbCards, position = 0) {
    const targetClient = game.room.clients.find(c => c.id === player.id);
    if (targetClient) {
        const cards = game.dungeon.slice(-position - nbCards, -position || undefined).reverse();
        targetClient.send("game_action", { action: "scout", cards });
    }
}

function selectDungeonCard(game, player, cards = game.dungeon) {
    const targetClient = game.room.clients.find(c => c.id === player.id);
    if (targetClient) {
        game.canPickSpecificCard = true
        targetClient.send("game_action", { action: "scout_pick", cards });
    }
}

function pickSpecificCard(game, cardId) {
    console.log('Initial dungeon:', game.dungeon.map(obj => obj.id).join(', '));
    const card = game.dungeon.find(c => c.id == cardId)
    console.log('card picked:', card.id);
    const dungeonBackUp = [];
    dungeonBackUp.push(...game.dungeon);
    game.dungeon.clear()
    game.dungeon.push(...dungeonBackUp.filter(c => c.id != cardId));
    game.shuffleDungeon();
    game.dungeonLength = game.dungeon.length;
    console.log('Updated dungeon:', game.dungeon.map(obj => obj.id).join(', '));
    console.log('Dungeon length:', game.dungeonLength);
    return card;
}

function discardFromPile(cardId, player, game) {
    const card = player.defeatedMonstersPile.find(c => c.id === cardId)
    // // find the index of the item you'd like to remove
    const cardIndex = player.defeatedMonstersPile.findIndex(c => c.id === cardId)
    player.defeatedMonstersPile.splice(cardIndex, 1);
    game.discard(player, card)
}

function playerRollDice(game, player, callback) {
    game.room.broadcast('game_action', { action: 'animate_roll', playerId: player.id });
    let diceRoll = player.rollDice();
    setTimeout(() => {
        console.log(`broadcast dice_roll result for ${player.id}:`, diceRoll);
        game.room.broadcast('game_action', { action: 'roll_result', result: diceRoll });
        callback(diceRoll);
    }, 1000); // 1000 milliseconds delay
}

module.exports = {
    execute,
    executeAndDiscard,
    executeAndLeech,
    playerPileContainsType,
    currentCardHasType,
    currentCardHasTitle,
    surviveWith,
    reduceDamage,
    scout,
    pickSpecificCard,
    selectDungeonCard,
    discardFromPile,
    playerRollDice,
};