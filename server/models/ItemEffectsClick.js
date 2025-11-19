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
            game.afterDoneWithMonster(player)
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
        if (!game.trap && !item.broken) {
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
        if (!item.broken && player.canPass && game.noCurrentCard()) {//check if that works
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
        if (!game.trap && !item.broken && game.inFight()) {
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
            game.afterDoneWithMonster(player)
        }
    },
    hex: (item, player, game, arg) => {
        if (!item.broken && game.inFight()) {
            game.discard(player, game.currentCard)
            game.currentCard = null;
            h.selectDungeonCard(game, player, game.dungeon.filter(d => d.dungeonCardType === "monster"))
            item.break();
        }
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
        if (!item.broken && game.noCurrentCard()) {
            h.selectDungeonCard(game, player)
            item.break();
        }
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
            const card = player.defeatedMonstersPile.find(c => c.id === arg)
            if (card.basePower > game.currentCard.power) {
                h.discardFromPile(arg, player, game)
                h.execute(player, game)
            }
        }
    },
    eternity_leaf: (item, player, game) => {
        if (!game.trap && !item.broken && game.inFight() &&
            (h.currentCardHasType(game, "Demon") || h.currentCardHasType(game, "Dragon"))) {
            player.loseHP(game, 1)
            h.execute(player, game)
        }
    },
    luck_potion: (item, player, game) => {
        if (!item.brokem) {
            player.gainHP(3)
            //todo modify dice
            item.break();
        }
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
        if (!item.broken) {
            player.gainHP(2)
            card = game.currentCard;
            if (game.inFight()) {
                if (["MIMIC", "SLEEPING_DRAGON", "EVIL_MIRROR", "MEDAL_GRINDER", "SCAVENGER_RAT", "SPECTRE",]
                    .includes(card.baseEffect))
                    card.power = 0
                card.effect = ""
                card.bonusDamage = 0
                card.timesDealDamage = 1
                card.damage = card.calculateDamage()
            } else if (game.inEvent()) {
                card.effect = ""
            }
            item.break();
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
const ieCanUse = {
    aegis: (item, player, game) => !item.broken,
    midas: (item, player, game) => !game.trap && !item.broken && game.inFight() && game.currentCard.power >= 4 && game.currentCard.power <= 5,
    bahn: (item, player, game) => !game.trap && !item.broken && game.inFight(),
    hammer: (item, player, game) => !game.trap && !item.broken && game.inFight() && (h.currentCardHasType(game, "Skeleton") || h.currentCardHasType(game, "Golem")),
    cake: (item, player, game) => !item.broken,
    swiss: (item, player, game) => !item.broken && player.stuff.some(i => i.broken),
    hourglass: (item, player, game) => !item.broken && game.inFight(),
    box: (item, player, game) => !game.trap && !item.broken && game.inFight() && !player.alreadyUsedItems.includes(item.key),
    lich_bane: (item, player, game) => !game.trap && !item.broken && game.inFight() && h.currentCardHasType(game, "Lich"),
    anvil: (item, player, game) => !item.broken && game.players.some(p => p.id !== player.id && p.stuff.some(i => i.broken)),
    golem_shield: (item, player, game) => !game.trap && !item.broken && game.inFight() && h.currentCardHasType(game, "Golem") && !h.playerPileContainsType(player, "Golem"),
    bard: (item, player, game) => !game.trap && !item.broken,
    dragon_mask: (item, player, game) => !game.trap && !item.broken && game.inFight() && h.currentCardHasType(game, "Dragon"),
    dragon_shield: (item, player, game) => !item.broken && game.inFight(),
    mana_potion: (item, player, game) => !item.broken && game.inFight() && player.defeatedMonstersPile.length > 0,
    kebab: (item, player, game) => !item.broken && player.turnNumber >= 3,
    glass_axe: (item, player, game) => !game.trap && !item.broken && game.inFight(),
    tp: (item, player, game) => !item.broken && player.canPass && game.noCurrentCard(),
    fairy_potion: (item, player, game) => !item.broken && game.inFight(),
    ice_potion: (item, player, game) => !item.broken && game.inFight(),
    vorpal_sword: (item, player, game) => (!item.indication) || (!game.trap && !item.broken && game.inFight() && item.indication && (game.currentCard.power === parseInt(item.indication))),
    vorpal_dagger: (item, player, game) => (!item.indication) || (!game.trap && !item.broken && game.inFight() && item.indication && (h.currentCardHasType(game, item.indication))),
    dragon_potion: (item, player, game) => !item.broken,
    pickaxe: (item, player, game) => !item.broken && game.inFight() && game.currentCard.power % 2 === 1,
    totem: (item, player, game) => !game.trap && !item.broken && game.inFight(),
    sacred_book: (item, player, game) => !game.trap && !item.broken && game.inFight() && h.currentCardHasType(game, "Skeleton"),
    noob_amu: (item, player, game) => !game.trap && !item.broken && game.inFight() && !player.medals && h.currentCardHasType(game, "Goblin"),
    noob_ring: (item, player, game) => !item.broken,
    noob_hat: (item, player, game) => !game.trap && !item.broken && game.inFight() && !player.medals && h.currentCardHasType(game, "Orc"),
    noob_cape: (item, player, game) => !game.trap && !item.broken && game.inFight() && (!player.medals || game.currentCard.odd()),
    rat_lich: (item, player, game) => !game.trap && !item.broken && game.inFight() && (h.currentCardHasType(game, "Rat") || h.currentCardHasType(game, "Lich")),
    adam: (item, player, game) => !item.broken,
    pest: (item, player, game) => !game.trap && !item.broken && game.inFight() && (h.currentCardHasType(game, "Rat")),
    slayer_shield: (item, player, game) => !game.trap && !item.broken && game.inFight() && (h.currentCardHasType(game, "Orc")),
    shells: (item, player, game) => !game.trap && !item.broken && game.inFight(),
    pirate_pistol: (item, player, game) => !game.trap && !item.broken && game.inFight() && (game.currentCard.power == 2 || game.currentCard.power == 3),
    mage_robe: (item, player, game) => !game.trap && !item.broken && game.inFight() && (h.currentCardHasType(game, "Demon")),
    fire_armor: (item, player, game) => !item.broken && game.inFight() && h.currentCardHasType(game, "Dragon"),
    fire_hammer: (item, player, game) => !item.broken && game.inFight() && (h.currentCardHasType(game, "Golem") || h.currentCardHasType(game, "Dragon")),
    '13_16': (item, player, game) => !game.trap && !item.broken && game.inFight() && (game.currentCard.power === 1 || ((!h.playerPileContainsType(player, "Dragon") && game.currentCard.power === 3) || (h.playerPileContainsType(player, "Dragon") && game.currentCard.power === 6))),
    scuba: (item, player, game) => !item.broken && game.inFight(),
    chainsaw: (item, player, game) => !game.trap && !item.broken && game.inFight(),
    laser: (item, player, game) => !game.trap && !item.broken && game.inFight() && game.currentCard.odd(),
    monkey_grenade: (item, player, game) => !item.broken && game.inFight(),
    hex: (item, player, game) => !item.broken && game.inFight(),
    heal: (item, player, game) => !item.broken && player.lastDamageTaken > 0,
    mage_armor: (item, player, game) => !item.broken && game.inFight() && (h.currentCardHasType(game, "Lich") || h.currentCardHasType(game, "Demon")),
    divination: (item, player, game) => !item.broken && game.noCurrentCard(),
    adrenaline: (item, player, game) => true,
    pirate_bomb: (item, player, game) => !item.broken && game.inFight() && player.stuff.some(i => i.id != item.id),
    ocean_ring: (item, player, game) => !game.trap && !item.broken && game.inFight() && game.currentCard.power >= 8,
    fire_ring: (item, player, game) => !game.trap && !item.broken && game.inFight() && h.currentCardHasType(game, "Vampire"),
    boomerang: (item, player, game) => !game.trap && !item.broken && game.inFight(),
    ice_ring: (item, player, game) => !item.broken && game.inFight(),
    magic_ring: (item, player, game) => !game.trap && !item.broken && game.inFight() && (game.currentCard.power === 1 || game.currentCard.power === 2),
    sorcerer_hat: (item, player, game) => !game.trap && !item.broken && game.inFight() && (h.currentCardHasType(game, "Goblin") || h.currentCardHasType(game, "Vampire")),
    pizza: (item, player, game) => !game.trap && !item.broken && game.inFight(),
    lich_skull: (item, player, game) => !game.trap && !item.broken && game.inFight() && h.currentCardHasType(game, "Lich"),
    lich_armor: (item, player, game) => !game.trap && !item.broken && game.inFight() && h.currentCardHasType(game, "Lich"),
    red_torch: (item, player, game) => !game.trap && !item.broken && game.inFight() && (h.currentCardHasType(game, "Goblin") || h.currentCardHasType(game, "Skeleton") || h.currentCardHasType(game, "Orc")),
    blue_torch: (item, player, game) => !game.trap && !item.broken && game.inFight() && game.currentCard.power <= 2,
    future: (item, player, game) => !item.broken && !player.lastDamageTaken && game.noCurrentCard(),
    rat_ring: (item, player, game) => !game.trap && !item.broken && game.inFight() && h.currentCardHasType(game, "Rat"),
    crystal: (item, player, game) => !game.trap && !item.broken && !player.alreadyUsedItems.includes(item.key),
    whip: (item, player, game) => !game.trap && !item.broken && game.inFight(),
    seashell: (item, player, game) => !item.broken,
    purple_skull: (item, player, game) => !item.broken && game.inFight() && player.defeatedMonstersPile.length > 0,
    eternity_leaf: (item, player, game) => !game.trap && !item.broken && game.inFight() && (h.currentCardHasType(game, "Demon") || h.currentCardHasType(game, "Dragon")),
    luck_potion: (item, player, game) => !item.broken,
    genius_glasses: (item, player, game) => !item.broken && player.lastDamageTaken && game.noCurrentCard(),
    katana: (item, player, game) => !game.trap && !item.broken && game.inFight() && game.currentCard.power >= 7,
    silence: (item, player, game) => !item.broken,
    golem_heart: (item, player, game) => !item.broken && game.inFight() && player.defeatedMonstersPile.some(m => m.types.includes("Golem")),
    dragon_blade: (item, player, game) => !item.broken && game.inFight(),
    axe: (item, player, game) => !game.trap && !item.broken && game.inFight() && game.currentCard.even(),
};

module.exports = { ieClick, ieCanUse };