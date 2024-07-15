const h = require('./Helper.js');
const ieClick = {
    midas: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() && game.currentCard.power >= 4 && game.currentCard.power <= 5) {
            h.executeAndLeech(player, game)
            item.break()
        }
    },
    bahn: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight()) {
            h.executeAndDiscard(player, game)
            player.gainHP(1)
            item.break()
        }
    },
    hammer: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight()
            && (h.currentCardHasType(game, "Skeleton") || h.currentCardHasType(game, "Golem"))) {
            h.execute(player, game)
        }
    },
    cake: (item, player, game) => {

    },
    swiss: (item, player, game) => {

    },
    hourglass: (item, player, game) => {
        if (!item.broken && game.inFight()) {
            game.returnCardToDungeon()
            item.break()
            game.passTurn(true)
        }
    },
    box: (item, player, game) => {

    },
    lich_bane: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() && h.currentCardHasType(game, "Lich")) {
            h.execute(player, game)
            player.gainHP(6)
        }
    },
    anvil: (item, player, game) => {

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
            item.break()
        }
    },
    dragon_mask: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() && h.currentCardHasType(game, "Dragon")) {
            h.execute(player, game)
            player.pickItem(game)
            item.break()
        }
    },
    dragon_shield: (item, player, game) => {

    },
    mana_potion: (item, player, game) => {

    },
    kebab: (item, player, game) => {

    },
    glass_axe: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight()) {
            h.execute(player, game)
            item.break()
        }
    },
    tp: (item, player, game) => {

    },
    fairy_potion: (item, player, game) => {
        h.surviveWith(player, game, 1);
    },
    ice_potion: (item, player, game) => {
        if (!item.broken && game.inFight()) {
            game.currentCard.power = 0;
            game.currentCard.damage = game.currentCard.calculateDamage()
            item.break()
        }
    },
    vorpal_sword: (item, player, game) => {

    },
    vorpal_dagger: (item, player, game) => {

    },
    dragon_potion: (item, player, game) => {
        if (!item.broken) {
            if (game.inFight() && h.currentCardHasType(game, "Dragon")) {
                h.surviveWith(player, game, 9);
            } else {
                h.surviveWith(player, game, 1);
            }
            item.break()
        }
    },
    pickaxe: (item, player, game) => {
        // Exécutez un monstre de puissance impaire, ne brise pas contre un Golem
        if (!item.broken && game.inFight() && game.currentCard.power % 2 === 1) {
            const isGolem = h.currentCardHasType(game, "Golem")
            h.execute(player, game);
            if (!isGolem) {
                item.break();
            }
        }
    },
    totem: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight()) {
            h.executeAndDiscard(player, game)
            item.break()
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
            item.break();
        }
    },
    noob_hat: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() && !player.medals && h.currentCardHasType(game, "Orc")) {
            h.execute(player, game)
        } //todo execute next
    },
    noob_cape: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() && (!player.medals || game.currentCard.odd())) {
            h.execute(player, game)
        }
        item.break();
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
            item.break();
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
            h.execute(player, game)
            item.break()
            //todo dice fix pv
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
            h.reduceDamage(game, item, 5)
        }
    },
    fire_hammer: (item, player, game) => {
        if (!item.broken && game.inFight() && (h.currentCardHasType(game, "Golem") || h.currentCardHasType(game, "Dragon"))) {
            h.reduceDamage(game, item, 4)
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
            h.reduceDamage(game, item, 2)
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
            h.execute(player, game)
            item.break() //todo kill next
        }
    },
    monkey_grenade: (item, player, game) => {
        if (!item.broken && game.inFight()) {
            game.returnCardToDungeon()
            game.shuffleDungeon()
            item.break()
            game.canTryToEscape = true;
            player.canPass = true;
        }
    },
    hex: (item, player, game) => {

    },
    heal: (item, player, game) => {
        if (!item.broken && player.lastDamageTaken) {
            player.gainHP(player.lastDamageTaken)
        }
        item.break();
    },
    mage_armor: (item, player, game) => {
        if (!item.broken && game.inFight() && (h.currentCardHasType(game, "Lich") || h.currentCardHasType(game, "Demon"))) {
            h.reduceDamage(game, item, 5)
        }
    },
    divination: (item, player, game) => {

    },
    adrenaline: (item, player, game) => {
        if (player.hp === 1) {
            player.gainHP(10)
        } else {
            player.gainHP(2)
        }
        item.break()
    },
    pirate_bomb: (item, player, game) => {

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
        h.executeAndDiscard(player, game)
        //todo next monster
    },
    ice_ring: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() && h.currentCardHasType(game, "Skeleton")) {
            h.execute(player, game)
        } else if (!item.broken && game.inFight()) {
            h.reduceDamage(game, item, 1)
        }
    },
    magic_ring: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() && (game.currentCard.power === 1 || game.currentCard.power === 2)) {
            h.executeAndLeech(player, game)
        }
    },
    wind_ring: (item, player, game) => {

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
            item.break()
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
    future: (item, player, game) => {

    },
    rat_ring: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() && h.currentCardHasType(game, "Rat")) {
            h.execute(player, game)
            player.gainHP(3)
        }
    },
    crystal: (item, player, game) => {

    },
    whip: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight()) {
            h.executeAndDiscard(player, game)
            item.break()
        } //todo discard opponents
    },
    seashell: (item, player, game) => {
        player.pickItem(game)
        item.break()
    },
    purple_skull: (item, player, game) => {

    },
    eternity_leaf: (item, player, game) => {
        if (!game.trap && !item.broken && player.hp > 1 && game.inFight() &&
            (h.currentCardHasType(game, "Demon") || h.currentCardHasType(game, "Dragon"))) {
            player.loseHP(game, 1)
            h.execute(player, game)
        }
    },
    luck_potion: (item, player, game) => {

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
            if (golemCount) h.reduceDamage(game, item, golemCount)
        }
    },
    dragon_blade: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() && h.currentCardHasType(game, "Dragon")) {
            h.execute(player, game)
        } else if (!item.broken && game.inFight()) {
            const dragonCount = player.defeatedMonstersPile.filter(monster => monster.types.includes("Dragon")).length
            h.reduceDamage(game, item, dragonCount)
        }
    },
    axe: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() && game.currentCard.even()) {
            h.execute(player, game)
            item.break()
        } //todo execunte next if even
    },
};
// Example usage
// const key = 'midas';
// items[key]?.(item, player, game);
module.exports = ieClick;