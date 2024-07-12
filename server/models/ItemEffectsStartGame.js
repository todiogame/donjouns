const h = require('./Helper.js');
const ieStartGame = {
    heart: (item, player, game) => {
        player.gainHP(3);
    },
    slayer_belt: (item, player, game) => {
        player.gainHP(12);
    },
    golem_shield: (item, player, game) => {
        player.gainHP(3);
    },
    bard: (item, player, game) => {
        player.gainHP(3);
    },
    bow: (item, player, game) => {
        player.gainHP(7);
    },
    ball: (item, player, game) => {
        player.gainHP(7);
    },
    tp: (item, player, game) => {
        player.gainHP(2);
    },
    noob_belt: (item, player, game) => {
        player.gainHP(player.medals ? 3 : 6);

    },
    noob_geta: (item, player, game) => {
        player.gainHP(2);
    },
    sacred_book: (item, player, game) => {
        player.gainHP(2);
    },
    noob_amu: (item, player, game) => {
        player.gainHP(3);
    },
    pest: (item, player, game) => {
        player.gainHP(3);
    },
    slayer_shield: (item, player, game) => {
        player.gainHP(2);
    },
    slayer_bike: (item, player, game) => {
        player.gainHP(6);
        //rentre en premier
    },
    tattoo: (item, player, game) => {
        player.gainHP(6);
        // effet sur les des
    },
    leather_armor: (item, player, game) => {
        player.gainHP(5);
    },
    chainmail: (item, player, game) => {
        player.gainHP(4);
    },
    fire_armor: (item, player, game) => {
        player.gainHP(4);
    },
    tunic: (item, player, game) => {
        player.gainHP(4);
    },
    lich_armor: (item, player, game) => {
        player.gainHP(3);
    },
    damned_plate: (item, player, game) => {
        player.gainHP(7);
    },
    honor_armor: (item, player, game) => {
        player.gainHP(3);
    },
    purse: (item, player, game) => {
        player.gainHP(3);
    },
    soul_stone: (item, player, game) => {
        player.gainHP(3);
    },
    golem_heart: (item, player, game) => {
        player.gainHP(3);
    },
    // Item has an effect at the beginning of the game
    sceptre: (item, player, game) => {
        // Au début de la partie, choisissez un adversaire.
        // Vous avez accès aux pouvoirs de son héros.
    },
    // Item has an effect before entering the dungeon
    vorpal_sword: (item, player, game) => {
        // Avant d'entrer dans le donjon, choisissez un chiffre.
        // Exécutez tous les monstres de cette puissance.
    },
    // Item has an effect before entering the dungeon
    vorpal_dagger: (item, player, game) => {
        // Avant d'entrer dans le donjon, choisissez un type de monstre.
        // Exécutez tous les monstres de ce type.
    },
    // Item has an effect before entering the dungeon
    printer: (item, player, game) => {
        // Avant d'entrer dans le donjon, choisissez un de vos autre objets.
        // L'Imprimante en devient une copie.
    },
    // The number of players in the game is required
    living_armor: (item, player, game) => {
        player.gainHP(1 + game.players.length); // Plus number of players in the game
    }
};

module.exports = ieStartGame;
