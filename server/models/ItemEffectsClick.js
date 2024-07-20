const h = require('./Helper.js');
const ieClick = {

    aegis: (item, player, game) => {
        if (!item.broken) {
            h.surviveWith(player, game, player.baseHP)
            item.break(player, game)
        }
    },
    midas: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() && game.currentCard.power >= 4 && game.currentCard.power <= 5) {
            h.executeAndLeech(player, game)
            item.break(player, game)
        }
    },
    bahn: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight()) {
            h.executeAndDiscard(player, game)
            player.gainHP(1)
            item.break(player, game)
        }
    },
    hammer: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight()
            && (h.currentCardHasType(game, "Skeleton") || h.currentCardHasType(game, "Golem"))) {
            h.execute(player, game)
        }
    },
    cake: (item, player, game) => {
        if (!item.broken) {
            h.playerRollDice(game, player, (roll) => {
                if (roll >= 1) {
                    player.gainHP(roll);
                } else {
                    player.flee(game);
                }
                item.break(player, game);
            });
        }
    },
    swiss: (item, player, game, arg) => {
        if (!item.broken && arg != null) {
            const itemToFix = player.stuff.find(i => i.id == arg)
            if (itemToFix) {
                itemToFix.fix(player, game);
                item.break(player, game);
            }
        }
    },
    hourglass: (item, player, game) => {
        if (!item.broken && game.inFight()) {
            game.returnCurrentCardToDungeon()
            item.break(player, game)
            game.passTurn(true)
        }
    },
    box: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() && !player.alreadyUsedItems.includes(item.key)) {
            h.playerRollDice(game, player, (roll) => {
                if (roll >= game.currentCard.power)
                    h.execute(player, game)
                if (roll == 1)
                    item.break(player, game);
            })
            player.alreadyUsedItems.push(item.key)
        }
    },
    lich_bane: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() && h.currentCardHasType(game, "Lich")) {
            h.execute(player, game)
            player.gainHP(6)
        }
    }, anvil: (item, player, game, arg) => {
        if (!item.broken && arg != null) {
            // Find the owner of the item with the given ID
            const owner = game.players.find(p => p.stuff.some(i => i.id == arg));
            if (owner) {
                const itemToSteal = owner.stuff.find(i => i.id == arg);
                if (itemToSteal) {
                    // Remove the item from the owner's stuff
                    owner.stuff = owner.stuff.filter(i => i.id != arg);
                    // Add the item to the player's stuff
                    player.stuff.push(itemToSteal);
                    itemToSteal.fix(player, game);
                    // Break the current item
                    item.break(player, game);
                }
            }
        }
    },
    golem_shield: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() && h.currentCardHasType(game, "Golem") && !h.playerPileContainsType(player, "Golem")) {
            h.execute(player, game)
        }
    },
    bard: (item, player, game) => {
        if (!game.trap && !item.broken && player.hp > 3) {
            player.loseHP(game, 3)
            h.execute(player, game)
            item.break(player, game)
        }
    },
    dragon_mask: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() && h.currentCardHasType(game, "Dragon")) {
            h.execute(player, game)
            player.pickItem(game)
            item.break(player, game)
        }
    },
    dragon_shield: (item, player, game) => {
        if (!item.broken && game.inFight()) {
            h.playerRollDice(game, player, (roll1) => {
                h.playerRollDice(game, player, (roll2) => {
                    h.reduceDamage(game, item, player, roll1 + roll2)
                    item.break(player, game);
                })
            })
        }
    },
    mana_potion: (item, player, game, arg) => {
        if (!item.broken && game.inFight() && arg != null) {
            h.discardFromPile(arg, player, game)
            h.surviveWith(player, game, player.baseHP)
            item.break(player, game)
        }
    },
    kebab: (item, player, game) => {
        if (!item.broken && player.turnNumber >= 3) {
            player.gainHP(7)
            item.break(player, game);
        }
    },
    glass_axe: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight()) {
            h.execute(player, game)
            item.break(player, game)
        }
    },
    tp: (item, player, game) => {
        if (!item.broken && player.canPass) {//check if that works
            player.flee(game)
        }
    },
    fairy_potion: (item, player, game) => {
        if (!item.broken && game.inFight()) {
            h.surviveWith(player, game, 1);
            item.break(player, game)
        }
    },
    ice_potion: (item, player, game) => {
        if (!item.broken && game.inFight()) {
            game.currentCard.power = 0;
            game.currentCard.damage = game.currentCard.calculateDamage()
            item.break(player, game)
        }
    },
    vorpal_sword: (item, player, game, arg) => {
        if (!item.indication) { //fisrt time setup
            item.setIndication(arg, game);
            item.ui = null;
        }
        if (!game.trap && !item.broken && game.inFight() && item.indication
            && (game.currentCard.power === parseInt(item.indication))) {
            h.execute(player, game)
        }
    },
    vorpal_dagger: (item, player, game, arg) => {
        if (!item.indication) { //fisrt time setup
            item.setIndication(arg, game);
            item.ui = null;
        }
        if (!game.trap && !item.broken && game.inFight() && item.indication
            && (h.currentCardHasType(game, item.indication))) {
            h.execute(player, game)
        }
    },
    dragon_potion: (item, player, game) => {
        if (!item.broken) {
            if (game.inFight() && h.currentCardHasType(game, "Dragon")) {
                h.surviveWith(player, game, 9);
            } else {
                h.surviveWith(player, game, 1);
            }
            item.break(player, game)
        }
    },
    pickaxe: (item, player, game) => {
        // Exécutez un monstre de puissance impaire, ne brise pas contre un Golem
        if (!item.broken && game.inFight() && game.currentCard.power % 2 === 1) {
            const isGolem = h.currentCardHasType(game, "Golem")
            h.execute(player, game);
            if (!isGolem) {
                item.break(player, game);
            }
        }
    },
    totem: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight()) {
            h.executeAndDiscard(player, game)
            item.break(player, game)
        }
    },
    noob_geta: (item, player, game) => {

    },
    sacred_book: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() && h.currentCardHasType(game, "Skeleton")) {
            h.execute(player, game)
        }
    },
    noob_amu: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() && !player.medals && h.currentCardHasType(game, "Goblin")) {
            h.execute(player, game)
        }
    },
    noob_ring: (item, player, game) => {
        if (!item.broken) {
            h.surviveWith(player, game, player.medals ? 1 : player.baseHP);
            item.break(player, game);
        }
    },
    noob_hat: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() && !player.medals && h.currentCardHasType(game, "Orc")) {
            h.execute(player, game)
            if (!player.medals) {
                game.nextMonsterCondition = (state) => state.inFight();
                game.nextMonsterAction = (state) => h.execute(player, state);
            }
        }
    },
    noob_cape: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() && (!player.medals || game.currentCard.odd())) {
            h.execute(player, game)
        }
        item.break(player, game);
    },
    rat_lich: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() && (h.currentCardHasType(game, "Rat") || h.currentCardHasType(game, "Lich"))) {
            h.execute(player, game)
        }
    },
    adam: (item, player, game) => {
        if (!item.broken) {
            player.gainHP(3)
            h.scout(game, player, 3)
            item.break(player, game);
        }
    },
    pest: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() && (h.currentCardHasType(game, "Rat"))) {
            h.execute(player, game)
        }
    },
    sceptre: (item, player, game) => {

    },
    slayer_shield: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() && (h.currentCardHasType(game, "Orc"))) {
            h.execute(player, game)
        }
    },
    shells: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight()) {
            h.playerRollDice(game, player, (roll) => {
                player.setHP(roll)
                h.execute(player, game)
                item.break(player, game);
            });
        }
    },
    pirate_pistol: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() && (game.currentCard.power == 2 || game.currentCard.power == 3)) {
            h.execute(player, game)
        }
    },
    mage_robe: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() && (h.currentCardHasType(game, "Demon"))) {
            h.execute(player, game)
            player.gainHP(5)
        }
    },
    fire_armor: (item, player, game) => {
        if (!item.broken && game.inFight() && h.currentCardHasType(game, "Dragon")) {
            h.reduceDamage(game, item, player, 5)
        }
    },
    fire_hammer: (item, player, game) => {
        if (!item.broken && game.inFight() && (h.currentCardHasType(game, "Golem") || h.currentCardHasType(game, "Dragon"))) {
            h.reduceDamage(game, item, player, 4)
        }
    },
    '13_16': (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() &&
            (game.currentCard.power === 1 ||
                ((!h.playerPileContainsType(player, "Dragon") && game.currentCard.power === 3) ||
                    (h.playerPileContainsType(player, "Dragon") && game.currentCard.power === 6)))) {
            h.execute(player, game)
        }
    },
    scuba: (item, player, game) => {
        if (!item.broken && game.inFight()) {
            h.reduceDamage(game, item, player, 2)
        }
    },
    chainsaw: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() && player.hp > 3) {
            player.loseHP(game, 3)
            h.execute(player, game)
        }
    },
    laser: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() && game.currentCard.odd()) {
            const currentPower = game.currentCard.power;
            h.execute(player, game)
            game.nextMonsterCondition = (state) => (state.inFight() && state.currentCard.power < currentPower);
            game.nextMonsterAction = (state) => h.execute(player, state);
            item.break(player, game)
        }
    },
    monkey_grenade: (item, player, game) => {
        if (!item.broken && game.inFight()) {
            game.returnCurrentCardToDungeon()
            game.shuffleDungeon()
            item.break(player, game)
            game.canTryToEscape = true;
            player.canPass = true;
        }
    },
    hex: (item, player, game, arg) => {
        //todo
    },
    heal: (item, player, game) => {
        if (!item.broken && player.lastDamageTaken > 0) {
            player.gainHP(player.lastDamageTaken)
            item.break(player, game);
        }
    },
    mage_armor: (item, player, game) => {
        if (!item.broken && game.inFight() && (h.currentCardHasType(game, "Lich") || h.currentCardHasType(game, "Demon"))) {
            h.reduceDamage(game, item, player, 5)
        }
    },
    divination: (item, player, game) => {
        //todo
    },
    adrenaline: (item, player, game) => {
        if (player.hp === 1) {
            player.gainHP(10)
        } else {
            player.gainHP(2)
        }
        item.break(player, game)
    },
    pirate_bomb: (item, player, game, arg) => {
        if (!item.broken && game.inFight() && arg != null) {
            const itemToBreak = player.stuff.find(i => i.id != item.id && i.id == arg)
            if (itemToBreak) {
                itemToBreak.break(player, game);
                h.execute(player, game)
            }
        }
    },
    ocean_ring: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() && game.currentCard.power >= 8) {
            h.execute(player, game)
        }
    },
    fire_ring: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() && h.currentCardHasType(game, "Vampire")) {
            h.execute(player, game)
            player.gainHP(2)
        }
    },
    boomerang: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight()) {
            h.executeAndDiscard(player, game)
            game.nextMonsterCondition = (state) => state.inFight();
            game.nextMonsterAction = (state) => h.execute(player, state);
            item.break(player, game)
        }
    },
    ice_ring: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() && h.currentCardHasType(game, "Skeleton")) {
            h.execute(player, game)
        } else if (!item.broken && game.inFight()) {
            h.reduceDamage(game, item, player, 1)
        }
    },
    magic_ring: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() && (game.currentCard.power === 1 || game.currentCard.power === 2)) {
            h.executeAndLeech(player, game)
        }
    },
    wind_ring: (item, player, game, arg) => {

    },
    sorcerer_hat: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() &&
            (h.currentCardHasType(game, "Goblin") || h.currentCardHasType(game, "Vampire"))) {
            h.execute(player, game)
        }
    },
    pizza: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight()) {
            h.executeAndDiscard(player, game)
            player.setHP(6)
            item.break(player, game)
        }
    },
    lich_skull: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() && h.currentCardHasType(game, "Lich")) {
            h.execute(player, game)
        } //todo steal opponents lichs
    },
    lich_armor: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() && h.currentCardHasType(game, "Lich")) {
            h.execute(player, game)
        }
    },
    red_torch: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() &&
            (h.currentCardHasType(game, "Goblin") || h.currentCardHasType(game, "Skeleton") || h.currentCardHasType(game, "Orc"))) {
            h.execute(player, game)
        }
    },
    blue_torch: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() && game.currentCard.power <= 2) {
            h.execute(player, game)
        }
    },
    future: (item, player, game) => { //todo start of turn
        if (!item.broken && !player.lastDamageTaken && game.noCurrentCard())
            h.scout(game, player, 1, 2)
    },
    rat_ring: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() && h.currentCardHasType(game, "Rat")) {
            h.execute(player, game)
            player.gainHP(3)
        }
    },
    crystal: (item, player, game, arg) => {
        if (!game.trap && !item.broken && !player.alreadyUsedItems.includes(item.key)) {
            const originalNextMonsterCondition = game.nextMonsterCondition;
            game.nextMonsterCondition = (state) =>
                (originalNextMonsterCondition ? originalNextMonsterCondition(state) : false) ||
                (state.inFight() && state.currentCard.power === arg);

            game.nextMonsterAction = (state) => h.execute(player, state);
            player.alreadyUsedItems.push(item.key)
            item.setIndication(arg, game);
        }
    },
    whip: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight()) {
            h.executeAndDiscard(player, game)
            item.break(player, game)
        } //todo discard opponents
    },
    seashell: (item, player, game) => {
        if (!item.broken) {
            player.pickItem(game)
            item.break(player, game)
        }
    },
    purple_skull: (item, player, game, arg) => {
        if (!item.broken && game.inFight() && arg != null) {
            const card = player.defeatedMonstersPile.find(c => c.id === cardId)
            if (card.basePower > game.currentCard.power) {
                h.discardFromPile(arg, player, game)
                h.surviveWith(player, game, player.baseHP)
                item.break(player, game)
            }
        }
    },
    eternity_leaf: (item, player, game) => {
        if (!game.trap && !item.broken && player.hp > 1 && game.inFight() &&
            (h.currentCardHasType(game, "Demon") || h.currentCardHasType(game, "Dragon"))) {
            player.loseHP(game, 1)
            h.execute(player, game)
        }
    },
    luck_potion: (item, player, game) => {
        //todo
    },
    genius_glasses: (item, player, game) => {
        if (!item.broken && player.lastDamageTaken && game.noCurrentCard())
            h.scout(game, player, 1)
    },
    katana: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() && game.currentCard.power >= 7) {
            h.executeAndDiscard(player, game)
        }
    },
    silence: (item, player, game) => {
        if (!item.broken && game.inFight()) {
            player.gainHP(2)
            //todo
        }
    },
    golem_heart: (item, player, game) => {
        if (!item.broken && game.inFight()) {
            const golemCount = player.defeatedMonstersPile.filter(monster => monster.types.includes("Golem")).length
            if (golemCount) h.reduceDamage(game, item, player, golemCount)
        }
    },
    dragon_blade: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() && h.currentCardHasType(game, "Dragon")) {
            h.execute(player, game)
        } else if (!item.broken && game.inFight()) {
            const dragonCount = player.defeatedMonstersPile.filter(monster => monster.types.includes("Dragon")).length
            h.reduceDamage(game, item, player, dragonCount)
        }
    },
    axe: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() && game.currentCard.even()) {
            h.execute(player, game)
            game.nextMonsterCondition = (state) => state.inFight() && state.currentCard.even();
            game.nextMonsterAction = (state) => h.execute(player, state);
            item.break(player, game)
        }
    },
};
// Example usage
// const key = 'midas';
// items[key]?.(item, player, game);
module.exports = ieClick;