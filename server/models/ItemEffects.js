const h = require('./Helper.js');
const ie = {
    midas: (item, player, game) => {
        if(!item.broken && game.inFight() && game.currentCard.power >= 4 && game.currentCard.power <= 5){
            h.executeAndLeech(player, game) 
            item.break()
        }
    },
    bahn: (item, player, game) => {

    },
    hammer: (item, player, game) => {

    },
    monkey: (item, player, game) => {

    },
    cake: (item, player, game) => {

    },
    swiss: (item, player, game) => {

    },
    hourglass: (item, player, game) => {

    },
    heart: (item, player, game) => {

    },
    box: (item, player, game) => {

    },
    lich_bane: (item, player, game) => {

    },
    anvil: (item, player, game) => {

    },
    chest: (item, player, game) => {

    },
    slayer_belt: (item, player, game) => {

    },
    golem_shield: (item, player, game) => {

    },
    bard: (item, player, game) => {

    },
    dragon_mask: (item, player, game) => {

    },
    dragon_shield: (item, player, game) => {

    },
    mana_potion: (item, player, game) => {

    },
    kebab: (item, player, game) => {

    },
    bow: (item, player, game) => {

    },
    glass_axe: (item, player, game) => {

    },
    printer: (item, player, game) => {

    },
    ball: (item, player, game) => {

    },
    tp: (item, player, game) => {

    },
    fairy_potion: (item, player, game) => {

    },
    ice_potion: (item, player, game) => {

    },
    vorpal_sword: (item, player, game) => {

    },
    vorpal_dagger: (item, player, game) => {

    },
    dragon_potion: (item, player, game) => {

    },
    pickaxe: (item, player, game) => {

    },
    totem: (item, player, game) => {

    },
    noob_belt: (item, player, game) => {

    },
    noob_geta: (item, player, game) => {

    },
    sacred_book: (item, player, game) => {

    },
    noob_amu: (item, player, game) => {

    },
    noob_ring: (item, player, game) => {

    },
    noob_hat: (item, player, game) => {

    },
    noob_cape: (item, player, game) => {

    },
    rat_lich: (item, player, game) => {

    },
    adam: (item, player, game) => {

    },
    pest: (item, player, game) => {

    },
    sceptre: (item, player, game) => {

    },
    slayer_shield: (item, player, game) => {

    },
    slayer_bike: (item, player, game) => {

    },
    shells: (item, player, game) => {

    },
    tattoo: (item, player, game) => {

    },
    pirate_pistol: (item, player, game) => {

    },
    leather_armor: (item, player, game) => {

    },
    chainmail: (item, player, game) => {

    },
    mage_robe: (item, player, game) => {

    },
    fire_armor: (item, player, game) => {

    },
    fire_hammer: (item, player, game) => {

    },
    eternity_hammer: (item, player, game) => {

    },
    '13_16': (item, player, game) => {

    },
    scuba: (item, player, game) => {

    },
    chainsaw: (item, player, game) => {

    },
    laser: (item, player, game) => {

    },
    monkey_grenade: (item, player, game) => {

    },
    hex: (item, player, game) => {

    },
    tunic: (item, player, game) => {

    },
    heal: (item, player, game) => {

    },
    mage_armor: (item, player, game) => {

    },
    divination: (item, player, game) => {

    },
    adrenaline: (item, player, game) => {

    },
    pirate_bomb: (item, player, game) => {

    },
    life_ring: (item, player, game) => {

    },
    ocean_ring: (item, player, game) => {

    },
    fire_ring: (item, player, game) => {

    },
    boomerang: (item, player, game) => {

    },
    ice_ring: (item, player, game) => {

    },
    magic_ring: (item, player, game) => {

    },
    wind_ring: (item, player, game) => {

    },
    sorcerer_hat: (item, player, game) => {

    },
    pizza: (item, player, game) => {

    },
    lich_skull: (item, player, game) => {

    },
    lich_armor: (item, player, game) => {

    },
    red_torch: (item, player, game) => {

    },
    blue_torch: (item, player, game) => {

    },
    future: (item, player, game) => {

    },
    rat_ring: (item, player, game) => {

    },
    crystal: (item, player, game) => {

    },
    damned_plate: (item, player, game) => {

    },
    whip: (item, player, game) => {

    },
    seashell: (item, player, game) => {

    },
    purple_skull: (item, player, game) => {

    },
    eternity_leaf: (item, player, game) => {

    },
    luck_potion: (item, player, game) => {

    },
    honor_armor: (item, player, game) => {

    },
    genius_glasses: (item, player, game) => {

    },
    lootbox: (item, player, game) => {

    },
    purse: (item, player, game) => {

    },
    katana: (item, player, game) => {

    },
    silence: (item, player, game) => {

    },
    soul_stone: (item, player, game) => {

    },
    golem_heart: (item, player, game) => {

    },
    chalice: (item, player, game) => {

    },
    breach: (item, player, game) => {

    },
    dragon_blade: (item, player, game) => {

    },
    axe: (item, player, game) => {

    },
    living_armor: (item, player, game) => {

    }
};
// Example usage
// const key = 'midas';
// items[key]?.(item, player, game);
module.exports = ie;