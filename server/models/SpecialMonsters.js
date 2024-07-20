const h = require('./Helper.js');
const { ItemCard } = require('./ItemCard');

const onMeet = {
    MIMIC: (card, player, game) => {
        card.power = player.stuff.filter(i => !i.broken).length;
        card.damage = card.calculateDamage()
    },
    SLEEPING_DRAGON: (card, player, game) => {
        h.playerRollDice(game, player, (roll) => {
            if (roll >= 4) {
                console.log("sleeping...")
                card.power = 0
                card.damage = card.calculateDamage()
            } else {
                console.log("wake up!")
                card.power = 9
                card.damage = card.calculateDamage()
            }
        })
    },
    EVIL_MIRROR: (card, player, game) => {
        if (player.defeatedMonstersPile.length) {
            const mirroredCard = player.defeatedMonstersPile[player.defeatedMonstersPile.length - 1]
            card.power = mirroredCard.power
            card.types = mirroredCard.types
            card.bonusDamage = mirroredCard.bonusDamage
            card.damage = mirroredCard.damage
            card.effect = mirroredCard.effect
            if (card.effect && typeof onMeet[card.effect] === 'function') {
                onMeet[card.effect](card, player, game);
            }
            card.damage = card.calculateDamage();
            //todo animations ?
        }
    },
    NOOB_POWNER: (card, player, game) => {
        if (player.medals)
            card.power = 2
    },
    MEDAL_GRINDER: (card, player, game) => {
        card.power = game.players.reduce((acc, p) => acc + p.medals, 0);
    },
    RAT_RIDER: (card, player, game) => {
        card.bonusDamage = 2
    },
    BIG_DISGUSTING_RAT: (card, player, game) => {
        card.bonusDamage = 2
    },
    SCAVENGER_RAT: (card, player, game) => {
        card.power = player.defeatedMonstersPile.length
    },
    VAMPIRE_LORD: (card, player, game) => {
        if (player.medals)
            card.bonusDamage = 4
    },
    KRAKEN: (card, player, game) => {
        if (!card.isKrakenAwake) {
            card.isKrakenAwake = true
            card.specialUI = true
        }
    },
    SPECTRE: (card, player, game) => {
        card.power = Math.floor(player.hp / 2);
    },
    GUARDIAN_ANGEL: (card, player, game) => {
        card.specialUI = true
        // Prompt discard
    },
    MONKEY_TEAM: (card, player, game) => {
        h.playerRollDice(game, player, (roll) => {
            card.timesDealDamage = roll
        })
    },
    SHAPESHIFTER: (card, player, game) => {
        card.specialUI = true
        // Prompt choose type
    },
};

const onFaceBeforeDamage = {
    MEDAL_GRINDER: (card, player, game) => {
        if (card.damage && player.medals) player.medals--;
    },
    THE_PULLER: (card, player, game) => {
        if (card.damage && player.defeatedMonstersPile.length) {
            const pulledCard = player.defeatedMonstersPile.pop()
            game.dungeonLength = game.dungeon.push(pulledCard);
        }
    },
    GLUTTONOUS_OOZE: (card, player, game, itemToOoze) => {
        let item = player.stuff.find(i => !i.broken && i.id === itemToOoze)
        if (item) item.break(player, game)
        // try to cheat the ooze? destroy all the stuff
        else player.stuff.filter(i => !item.broken).forEach(i => item.break(player, game))
    },
};


const onFaceAfterDamage = {
    FAIRY: (card, player, game) => {
        player.addDefeatedMonster(game.currentCard)
        game.currentCard = null;
        game.passTurn()
    },
    GHOST_GOBLIN: (card, player, game) => {
        game.discard(game.currentCard)
        player.monstersBeatenThisTurn++;
        game.currentCard = null;
        player.canPass = true;
        game.canTryToEscape = true;
        game.canExecute = false;
    },
};

const onBeaten = {
    GUARDIAN_ANGEL: (card, player, game) => {
        console.log("GUARDIAN ANGEL BEATEN")
        const aegisData = game.room.allItemsCards.find(item => item.key === "aegis")
        const aegis = new ItemCard(aegisData.id, aegisData.title, aegisData.active, aegisData.color, aegisData.key, aegisData.description)
        player.addItem(aegis, game)
    },
    SHAPESHIFTER: (card, player, game) => {
        card.types.clear();
    },
};

const onScore = {
    GOLDEN_GOLEM: (card, player, game) => {
        // Fill in the code
    }
};

module.exports = { onMeet, onFaceBeforeDamage, onFaceAfterDamage, onBeaten, onScore };