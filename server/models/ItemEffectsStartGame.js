const ieStartGame = {
    heart: (item, player, game) => {
        item.hp = 3;
    },
    slayer_belt: (item, player, game) => {
        item.hp = 12;
    },
    golem_shield: (item, player, game) => {
        item.hp = 3;
    },
    bard: (item, player, game) => {
        item.hp = 3;
    },
    bow: (item, player, game) => {
        item.hp = 7;
    },
    ball: (item, player, game) => {
        item.hp = 7;
    },
    tp: (item, player, game) => {
        item.hp = 2;
    },
    noob_belt: (item, player, game) => {
        item.hp = player.medals ? 3 : 6;
    },
    noob_geta: (item, player, game) => {
        item.hp = 2;
    },
    sacred_book: (item, player, game) => {
        item.hp = 2;
    },
    noob_amu: (item, player, game) => {
        item.hp = 3;
    },
    pest: (item, player, game) => {
        item.hp = 3;
    },
    slayer_shield: (item, player, game) => {
        item.hp = 2;
    },
    slayer_bike: (item, player, game) => {
        item.hp = 6;
        return true; // player starts the game
    },
    tattoo: (item, player, game) => {
        item.hp = 6;
        // todo effet sur les des
    },
    leather_armor: (item, player, game) => {
        item.hp = 5;
    },
    chainmail: (item, player, game) => {
        item.hp = 4;
    },
    fire_armor: (item, player, game) => {
        item.hp = 4;
    },
    tunic: (item, player, game) => {
        item.hp = 4;
    },
    lich_armor: (item, player, game) => {
        item.hp = 3;
    },
    damned_plate: (item, player, game) => {
        item.hp = 7;
    },
    honor_armor: (item, player, game) => {
        item.hp = 3;
    },
    purse: (item, player, game) => {
        item.hp = 3;
    },
    soul_stone: (item, player, game) => {
        item.hp = 3;
    },
    golem_heart: (item, player, game) => {
        item.hp = 3;
    },
    living_armor: (item, player, game) => {
        item.hp = 1 + game.players.length; // Plus number of players in the game
    }
};

module.exports = ieStartGame;
