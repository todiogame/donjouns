import { createDice } from './dice.js';
import Phaser from 'phaser';

export class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene', active: true });
    }

    preload() {
        // Preload any assets if needed
    }

    create() {
        // Placeholder for title text
        this.titleText = null;
    }

    displayTitle(message, duration = 5000, onComplete) {
        if (this.titleText) {
            this.titleText.destroy();
        }

        this.titleText = this.add.text(this.cameras.main.centerX, 100, message, { fontFamily: 'Arial Black', fontSize: 80 });

        const gradient = this.titleText.context.createLinearGradient(0, 0, 0, this.titleText.height);
        gradient.addColorStop(0, '#f26522');
        gradient.addColorStop(0.5, '#fff200');
        gradient.addColorStop(0.5, '#f7941d');
        gradient.addColorStop(1, '#ed1c24');
        this.titleText.setFill(gradient);
        this.titleText.setOrigin(0.5, 0.5);

        this.tweens.add({
            targets: this.titleText,
            alpha: 0,
            duration: duration,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                if (this.titleText) this.titleText.destroy(); // Remove text after blending out
                this.titleText = null;
                if (onComplete) {
                    onComplete();
                }
            }
        });
    }
}


export class DiceScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DiceScene', active: true });
    }

    preload() {
        this.load.image("dice-albedo", "assets/obj/dice/dice-albedo.png");
        this.load.obj("dice-obj", "assets/obj/dice/dice.obj");
    }

    create() {
        this.createDice(this.scale.width / 2, this.scale.height / 2, 1000);
    }

    createDice(x, y, duration) {
        let diceIsRolling = false;
        let stopDiceAnimation;

        const dice = this.add.mesh(x, y, "dice-albedo").setVisible(false);
        const shadowFX = dice.postFX.addShadow(0, 0, 0.006, 2, 0x111111, 10, .8);

        dice.addVerticesFromObj("dice-obj", 0.25);
        dice.panZ(6);

        dice.modelRotation.x = Phaser.Math.DegToRad(0);
        dice.modelRotation.y = Phaser.Math.DegToRad(-90);

        const startDiceAnimation = (position) => {
            if (!diceIsRolling) {
                diceIsRolling = true;
                dice.setVisible(true);
                let xPosition = this.scale.width / 2
                let yPosition = this.scale.height + dice.height
                if (position === "top-left") {
                    xPosition = 0
                    yPosition = 0
                } else if (position === "top-right") {
                    xPosition = this.scale.width
                    yPosition = 0
                }
                dice.setPosition(xPosition, yPosition);

                // Move dice to the center of the screen
                this.add.tween({
                    targets: dice,
                    x: this.scale.width / 2,
                    y: this.scale.height / 2,
                    duration: 500,
                    ease: "Sine.easeInOut",
                });

                // Shadow animation
                this.add.tween({
                    targets: shadowFX,
                    x: -8,
                    y: 10,
                    duration: duration - 250,
                    ease: "Sine.easeInOut",
                    yoyo: true,
                });

                // Dice rotation animation
                const diceTween = this.add.tween({
                    targets: dice,
                    from: 0,
                    to: 1,
                    duration: duration,
                    repeat: -1,
                    onUpdate: () => {
                        dice.modelRotation.x -= .02;
                        dice.modelRotation.y -= .08;
                    },
                    ease: "Sine.easeInOut",
                });

                // Save the function to stop the animation
                stopDiceAnimation = () => {
                    diceTween.stop();
                    diceIsRolling = false;
                };
            } else {
                console.log("Dice is already rolling");
            }
        };

        const showDiceResult = (diceRoll) => {
            if (diceIsRolling) {
                stopDiceAnimation();

                switch (diceRoll) {
                    case 1:
                        dice.modelRotation.x = Phaser.Math.DegToRad(0);
                        dice.modelRotation.y = Phaser.Math.DegToRad(-90);
                        break;
                    case 2:
                        dice.modelRotation.x = Phaser.Math.DegToRad(90);
                        dice.modelRotation.y = Phaser.Math.DegToRad(0);
                        break;
                    case 3:
                        dice.modelRotation.x = Phaser.Math.DegToRad(180);
                        dice.modelRotation.y = Phaser.Math.DegToRad(0);
                        break;
                    case 4:
                        dice.modelRotation.x = Phaser.Math.DegToRad(180);
                        dice.modelRotation.y = Phaser.Math.DegToRad(180);
                        break;
                    case 5:
                        dice.modelRotation.x = Phaser.Math.DegToRad(-90);
                        dice.modelRotation.y = Phaser.Math.DegToRad(0);
                        break;
                    case 6:
                        dice.modelRotation.x = Phaser.Math.DegToRad(0);
                        dice.modelRotation.y = Phaser.Math.DegToRad(90);
                        break;
                }

                // Show the dice value
                const textDiceValue = this.add.text(this.scale.width / 2, this.scale.height / 2, diceRoll, {
                    fontFamily: 'Arial Black',
                    fontSize: 74,
                    color: '#c51b00'
                });
                textDiceValue.setStroke('#de77ae', 16).setScale(0);
                textDiceValue.setOrigin(0.5);
                textDiceValue.setPosition(this.scale.width / 2, this.scale.height / 2);

                this.add.tween({
                    targets: textDiceValue,
                    scale: 1,
                    duration: 1000,
                    ease: Phaser.Math.Easing.Bounce.Out,
                    onComplete: () => {
                        dice.setVisible(false);
                        textDiceValue.setVisible(false);
                    }
                });
            }
        };

        this.startDiceAnimation = startDiceAnimation;
        this.showDiceResult = showDiceResult;

    }
}

export class AnimScene extends Phaser.Scene {
    constructor() {
        super({ key: 'AnimScene', active: true });
    }

    preload() {
        this.load.audio('execute', 'assets/sounds/effects/execute.mp3');
        this.load.spritesheet('hit', 'assets/anims/hit.png', {
            frameWidth: 1024, // width of each frame
            frameHeight: 1024 // height of each frame
        });
    }

    create() {
        this.anims.create({
            key: 'hitAnimation',
            frames: this.anims.generateFrameNumbers('hit', { start: 0, end: 15 }),
            frameRate: 60,
            repeat: 0
        });
        this.executeSound = this.sound.add('execute', { volume: 0.5 });
    }

    executeAnimation() {
        this.executeSound.play();
        const sprite = this.add.sprite(650, 100, 'hit');
        sprite.play('hitAnimation');
        sprite.on('animationcomplete', () => sprite.destroy());
    }
}


export class DisplayManager {
    constructor(scene) {
        this.scene = scene;
        this.backgroundContainer = null;
        this.zoomedItemCard = null; // To keep track of the zoomed-in itemCard
        this.blurryBackground = null; // To keep track of the blurry background
        this.scoutPopup = null; // To keep track of the scout popup
        this.numberInputPopup = null; // To keep track of the number input popup
    }

    displayTitle(message, duration, onComplete) {
        const titleScene = this.scene.scene.get('TitleScene');
        titleScene.displayTitle(message, duration, onComplete);
    }
    displayDice(position) {
        const diceScene = this.scene.scene.get('DiceScene');
        if (diceScene) {
            diceScene.startDiceAnimation(position);
        }
    }
    initializeBackground() {
        this.backgroundContainer = this.scene.add.container(0, 0);
        const background = this.scene.add.image(0, 0, 'background');
        background.setOrigin(0, 0);
        background.displayWidth = this.scene.sys.game.config.width;
        background.displayHeight = this.scene.sys.game.config.height;
        this.backgroundContainer.add(background);
        this.backgroundContainer.setDepth(-100)
    }

    updateDraftingUI(players, localPlayerId) {
        console.log("updateDraftingUI", players, localPlayerId);

        this.clearPreviousDisplay();
        players.forEach(player => {
            if (player.id === localPlayerId) {
                this.displayStuff(player.stuff, true, 'bottom', player);
            } else {
                const position = this.getOpponentPosition(player.id, localPlayerId, players);
                this.displayStuff(player.stuff, false, position, player);
            }
        });
        players.forEach(player => {
            if (player.id === localPlayerId) {
                this.displayHand(player.hand);
            }
        });
    }

    clearPreviousDisplay() {
        let childrenToRemove = this.scene.children.list.filter(child =>
            child !== this.backgroundContainer &&
            child !== this.zoomedItemCard &&
            child !== this.blurryBackground &&
            child !== this.scoutPopup &&
            child !== this.numberInputPopup
        );
        while (childrenToRemove.length > 0) {
            const child = childrenToRemove.pop();
            if (child.input) {
                child.removeInteractive();
            }
            child.destroy();
        }
    }

    displayHand(hand) {
        const yPosition = this.scene.sys.game.config.height - 430; // Bottom of the screen for human player
        const desiredWidth = 200; // Adjust as needed
        const desiredHeight = 280; // Adjust as needed

        const scaleX = desiredWidth / 750; // 750 is the original width of the images
        const scaleY = desiredHeight / 1050; // 1050 is the original height of the images

        const totalWidth = hand.length * (desiredWidth - 20) + 20; // Total width of all cards including spacing
        const startX = (this.scene.game.config.width - totalWidth) / 2; // Center the cards

        hand.forEach((itemCard, index) => {
            const rotationAngle = (index - (hand.length - 1) / 2) * 0.02; // Adjust the 0.1 value to your desired rotation amount

            const cardX = startX + index * (desiredWidth - 20) + desiredWidth / 2; // Adjusted for origin at 0.5
            const cardY = yPosition + desiredHeight / 2; // Adjusted for origin at 0.5

            const cardImage = this.scene.add.image(cardX, cardY, itemCard.texture)
                .setOrigin(0.5, 0.5)
                .setScale(scaleX, scaleY)
                .setRotation(rotationAngle)
                .setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 1 });

            cardImage.cardIndex = index;
            cardImage.isPlayer = true;
            cardImage.isSelected = itemCard.isSelected || false; // Mark as not selectable for zoom
            cardImage.isInStuff = false; // This itemCard is not in stuff

            if (itemCard.isPicked) {
                cardImage.y -= 50;
                const overlay = this.scene.add.rectangle(cardX, cardY - 50, desiredWidth + 10, desiredHeight + 10, 0x00ff00, 0.3);
                overlay.setOrigin(0.5, 0.5);
                overlay.setRotation(rotationAngle)
                overlay.setDepth(.1); // Bring to foreground

                cardImage.setData('overlay', overlay);
                cardImage.setDepth(.2); // Bring to foreground
            }

            // Add hover effect with smooth transition
            cardImage.on('pointerover', () => {
                cardImage.setDepth(1);
                this.scene.tweens.add({
                    targets: cardImage,
                    scaleX: scaleX * 1.4,
                    scaleY: scaleY * 1.4,
                    duration: 50,
                    ease: 'Sine.easeInOut'
                });
            });

            cardImage.on('pointerout', () => {
                cardImage.setDepth(itemCard.isPicked ? 0.2 : 0);
                this.scene.tweens.add({
                    targets: cardImage,
                    scaleX: scaleX,
                    scaleY: scaleY,
                    duration: 50,
                    ease: 'Sine.easeInOut',
                });
            });


            this.scene.input.enableDebug(cardImage);
        });
    }

    addShiningEffect(text) {
        this.scene.tweens.add({
            targets: text,
            alpha: { from: 0.5, to: 1 },
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            duration: 500
        });
    }

    getOpponentPosition(playerId, localPlayerId, players) {

        const positions = ['top-left', 'top-right'];
        const currentIndex = players.findIndex(p => p.id === localPlayerId);
        const opponentIndex = players.findIndex(p => p.id === playerId);

        if (currentIndex === 0) {
            return positions[opponentIndex == 1 ? 0 : 1];
        } else if (currentIndex === 1) {
            return positions[opponentIndex == 2 ? 0 : 1];
        } else if (currentIndex === 2) {
            return positions[opponentIndex == 0 ? 0 : 1];
        }
    }


    zoomCard(cardImage) {
        if (this.zoomedItemCard) {
            this.zoomedItemCard.destroy(); // Destroy any existing zoomed itemCard
        }
        if (this.blurryBackground) {
            this.blurryBackground.destroy(); // Destroy any existing blurry background
        }

        this.blurryBackground = this.scene.add.graphics({ fillStyle: { color: 0x000000, alpha: 0.5 } });
        this.blurryBackground.fillRect(0, 0, this.scene.sys.game.config.width, this.scene.sys.game.config.height);
        this.blurryBackground.setDepth(3)
        const { texture } = cardImage;
        const fixedWidth = 350;
        const fixedHeight = 490;

        this.zoomedItemCard = this.scene.add.image(this.scene.sys.game.config.width / 2, this.scene.sys.game.config.height / 2, texture)
            .setOrigin(0.5, 0.5)
            .setDepth(3)
            .setDisplaySize(fixedWidth, fixedHeight)
            .setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 1 });

        this.zoomedItemCard.on('pointerdown', () => {
            this.closeZoom();
        });

        this.scene.input.on('pointerdown', this.closeZoom, this);
    }

    closeZoom() {
        if (this.zoomedItemCard) {
            this.zoomedItemCard.destroy();
            this.zoomedItemCard = null;
        }
        if (this.blurryBackground) {
            this.blurryBackground.destroy();
            this.blurryBackground = null;
        }

        this.scene.input.off('pointerdown', this.closeZoom, this);
    }

    updateGameUI(game, localPlayerId) {
        console.log("updateGameUI", game, localPlayerId);
        this.clearPreviousDisplay();
        this.displayCurrentPhase(game);
        const players = game.players;
        players.forEach(player => {
            if (player.id === localPlayerId) {
                this.displayStuff(player.stuff, true, 'bottom', player, game);
                this.displayHP(player, true, 'bottom');
                this.displayMonstersPiles(player, true, 'bottom');
            } else {
                const position = this.getOpponentPosition(player.id, localPlayerId, players);
                this.displayStuff(player.stuff, false, position, player, game);
                this.displayHP(player, false, position);
                this.displayMonstersPiles(player, false, position);
            }
        });
        this.displayCurrentCard(game, localPlayerId);
        this.displayDungeon(game, localPlayerId);
        this.displayDiscardPile(game);
        if (game.isMyTurn(localPlayerId) && !game.isDiceRolling) {
            if (game.currentCard?.dungeonCardType === "monster") {
                this.addDamageButton(game);
                if (game.canExecute) this.addExecuteButton(game);
            }
            if (game.canTryToEscape && game.dungeon.length) {
                this.addEscapeButton(game)
            }
            if (game.noCurrentCard() && game.dungeon.length && game.getCurrentPlayer().canPass)
                this.addPassTurnButton(game)
        }
    }
    displayCurrentPhase(game) {
        this.scene.add.text(
            this.scene.sys.game.config.width / 2 - 50,
            30,
            game.phase,
            { fontSize: '20px', fill: '#fff', fontStyle: 'bold' });
    }
    displayCurrentCard(game) {
        if (game.currentCard) {
            const desiredWidth = 125;
            const desiredHeight = 175;
            const scaleX = desiredWidth / 750;
            const scaleY = desiredHeight / 1050;
            const cardSprite = this.scene.add.image(650, 100 - 175 / 2, game.currentCard.texture) // moved to top
                .setOrigin(0.5, 0)
                .setRotation(((game.currentCard.id * 7 % 12) - 6) * 0.002 * Math.PI)
                .setScale(scaleX, scaleY)
                .setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 1 });

            // Add hover effect with smooth transition
            cardSprite.on('pointerover', () => {
                cardSprite.setDepth(1);
                this.scene.tweens.add({
                    targets: cardSprite,
                    scaleX: scaleX * 3,
                    scaleY: scaleY * 3,
                    duration: 50,
                    ease: 'Sine.easeInOut'
                });
            });

            cardSprite.on('pointerout', () => {
                cardSprite.setDepth(0);
                this.scene.tweens.add({
                    targets: cardSprite,
                    scaleX: scaleX,
                    scaleY: scaleY,
                    duration: 50,
                    ease: 'Sine.easeInOut',
                });
            });
        }
    }

    displayDungeon(game, localPlayerId) {
        const desiredWidth = 125;
        const desiredHeight = 175;
        const scaleX = desiredWidth / 750;
        const scaleY = desiredHeight / 1050;
        // const numCards = game.dungeonLength;
        const numCards = game.dungeon.length;
        let cardSprite;

        for (let i = 0; i < numCards; i++) {
            cardSprite = this.scene.add.image(500 + 0.2 * i, 100 - 0.1 * i, "back_dungeon") // moved to top
                .setOrigin(0.5, 0.5)
                .setRotation(((i * 7 % 12) - 6) * 0.002 * Math.PI)
                .setScale(scaleX, scaleY);
        }
        if (cardSprite) {
            cardSprite.setData('type', 'dungeon');
            if (game.isMyTurn(localPlayerId) && game.noCurrentCard()) {
                // Apply the "excited" animation
                this.animateCard(cardSprite);
                // Make the card interactive
                cardSprite.setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 1 });

                // Add click event to stop animation
                cardSprite.on('pointerdown', () => {
                    this.scene.tweens.killTweensOf(cardSprite);
                    cardSprite.setRotation(0); // Reset scale
                });
            }
        }
    }

    animateCard(card) {
        this.scene.tweens.add({
            targets: card,
            angle: { from: -3, to: 3 }, // Adjust the angle values to control the wiggle
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            duration: 200 // Adjust the duration for quicker or slower wiggle
        });
    }
    displayDiscardPile(game) {
        const desiredWidth = 125;
        const desiredHeight = 175;
        const scaleX = desiredWidth / 750;
        const scaleY = desiredHeight / 1050;
        const numCards = game.discardPile.length;
        let cardSprite;

        if (numCards > 0) {
            for (let i = 0; i < numCards; i++) {
                cardSprite = this.scene.add.image(800 + 0.2 * i, 100 - 0.1 * i, "back_dungeon") // moved to top
                    .setOrigin(0.5, 0.5)
                    .setRotation(((i * 7 % 12) - 6) * 0.002 * Math.PI)
                    .setScale(scaleX, scaleY);
            }
        }
        const discardPileRect = this.scene.add.rectangle(800, 100, desiredWidth, desiredHeight, 0x808080, 0.5) // moved to top
            .setOrigin(0.5, 0.5)
            .setInteractive({ useHandCursor: true });

        this.scene.add.text(800, 100, 'DISCARD', { fontSize: '16px', color: '#FFFFFF' })
            .setOrigin(0.5, 0.5);

        discardPileRect.on('pointerdown', () => {
            this.displayScoutInterface(game.discardPile);
        });
    }

    displayStuff(stuff, isPlayer, position, player, game) {
        const playerName = player.name;
        this.scene.playcardSound.play();

        const maxItemsPerRow = 6;
        const defaultWidth = isPlayer ? 200 : 90; // increased size for player cards
        const defaultHeight = isPlayer ? 280 : 126; // increased size for player cards
        const scaleX = defaultWidth / 750;
        const scaleY = defaultHeight / 1050;

        const hoverWidth = 240;
        const hoverHeight = 336;
        const hoverScaleX = hoverWidth / 750;
        const hoverScaleY = hoverHeight / 1050;

        let playerNameText;

        if (isPlayer) {
            this.displayMyStuff(stuff, playerName, maxItemsPerRow, defaultWidth, defaultHeight, hoverScaleX, hoverScaleY);
            playerNameText = this.scene.add.text(this.scene.sys.game.config.width / 10, this.scene.sys.game.config.height - defaultHeight - 30, playerName, { fontSize: '20px', fill: '#fff', fontStyle: 'bold' });
        } else {
            let stuffYOffset = 15;
            const maxItemsPerColumn = 2;
            let stuffXOffset = stuff.length <= 8 ? 10 : -30;
            const columnOffset = defaultWidth + stuffXOffset;
            let xPosition;

            if (position === 'top-left') {
                xPosition = 10;
            } else if (position === 'top-right') {
                xPosition = this.scene.sys.game.config.width - defaultWidth - 10;
            }

            stuff.forEach((itemCard, index) => {
                if (itemCard) {
                    let itemCardImage;
                    const columnIndex = Math.floor(index / maxItemsPerColumn);
                    const rowIndex = index % maxItemsPerColumn;
                    const yPosition = rowIndex * (defaultHeight * 0.5 + 5) + stuffYOffset + (defaultHeight / 2);
                    const actualXPosition = position === 'top-left' ? xPosition + columnIndex * columnOffset + (defaultWidth / 2) : xPosition - columnIndex * columnOffset + (defaultWidth / 2);

                    itemCardImage = this.scene.add.image(actualXPosition, yPosition, itemCard.texture)
                        .setOrigin(0.5, 0.5)
                        .setScale(scaleX, scaleY)
                        .setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 1 });
                    itemCardImage.setData("type", "opponent_item");

                    if (itemCard.broken) {
                        itemCardImage.setRotation(Math.PI / 2);
                        itemCardImage.setDepth(-1);
                        const overlay = this.scene.add.rectangle(actualXPosition, yPosition, defaultWidth, defaultHeight, 0x444444, 0.3)
                            .setOrigin(0.5, 0.5)
                            .setRotation(Math.PI / 2)
                            .setDepth(-1);
                        itemCardImage.setData('overlay', overlay);
                    }
                }
            });

            playerNameText = this.scene.add.text(xPosition, 2 * stuffYOffset + (defaultHeight * (maxItemsPerColumn - 1) * 1.5), playerName, { fontSize: '20px', fill: '#fff', fontStyle: 'bold' });
        }

        if (game && game.players[game.currentPlayerIndex]?.id === player.id) {
            this.addShiningEffect(playerNameText);
        }
    }

    displayMyStuff(stuff, playerName, maxItemsPerRow, defaultWidth, defaultHeight, hoverScaleX, hoverScaleY) {
        const actualWidth = stuff.length > maxItemsPerRow ? defaultWidth * (maxItemsPerRow / stuff.length) : defaultWidth;
        const actualHeight = stuff.length > maxItemsPerRow ? defaultHeight * (maxItemsPerRow / stuff.length) : defaultHeight;
        const actualScaleX = actualWidth / 750;
        const actualScaleY = actualHeight / 1050;

        const startingX = (this.scene.sys.game.config.width - (actualWidth + 10) * Math.max(stuff.length - 1, maxItemsPerRow - 1)) / 2;

        stuff.forEach((itemCard, index) => {
            if (itemCard) {
                let itemCardImage;
                const xPosition = startingX + index * (actualWidth + 10);
                const yPosition = this.scene.sys.game.config.height - defaultHeight + (defaultHeight / 2) - 5;

                itemCardImage = this.scene.add.image(xPosition, yPosition, itemCard.texture)
                    .setOrigin(0.5, 0.5)
                    .setScale(actualScaleX, actualScaleY)
                    .setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 1 });

                if (itemCard.broken) {
                    itemCardImage.setRotation(Math.PI / 2);
                    itemCardImage.setDepth(-2);
                    const overlay = this.scene.add.rectangle(xPosition, yPosition, actualWidth, actualHeight, 0x444444, 0.3)
                        .setOrigin(0.5, 0.5)
                        .setRotation(Math.PI / 2)
                        .setDepth(-1);
                    itemCardImage.setData('overlay', overlay);
                }
                itemCardImage.setData("type", "my_item");
                itemCardImage.setData("item_id", itemCard.id);
                itemCardImage.setData("ui", itemCard.ui);

                if (itemCard.indication) {
                    let fontSize = 60, indicationText;
                    do {
                        indicationText?.destroy();
                        indicationText = this.scene.add.text(xPosition, yPosition, itemCard.indication, {
                            fontSize: `${fontSize}px`,
                            fill: '#fff',
                            fontStyle: 'bold'
                        }).setOrigin(0.5, 0.5).setDepth(0.1);
                    } while (indicationText.width > 90 && fontSize-- > 1);

                    itemCardImage.setData('indication', itemCard.indication);
                }

                itemCardImage.on('pointerover', () => {
                    itemCardImage.setDepth(1);
                    this.scene.tweens.add({
                        targets: itemCardImage,
                        scaleX: hoverScaleX,
                        scaleY: hoverScaleY,
                        duration: 50,
                        ease: 'Sine.easeInOut'
                    });
                });
                itemCardImage.on('pointerout', () => {
                    itemCardImage.setDepth(itemCard.broken ? -2 : 0);
                    this.scene.tweens.add({
                        targets: itemCardImage,
                        scaleX: actualScaleX,
                        scaleY: actualScaleY,
                        duration: 50,
                        ease: 'Sine.easeInOut',
                    });
                });

                if (itemCard.requireSetup && !itemCard.indication) {
                    this.animateCard(itemCardImage)
                }
            }
        });

    }


    displayHP(player, isPlayer, position) {
        const hp = player.hp;
        const desiredWidth = isPlayer ? 100 : 80;
        const desiredHeight = isPlayer ? 100 : 80;
        const scaleX = desiredWidth / 500;
        const scaleY = desiredHeight / 500;
        let xPosition, yPosition;

        if (position === 'bottom') {
            xPosition = this.scene.sys.game.config.width / 2 - 200;
            yPosition = this.scene.sys.game.config.height - 330;
        } else if (position === 'top-left') {
            xPosition = this.scene.sys.game.config.width / 2 - 300
            yPosition = 50; // Moved closer to the middle
        } else if (position === 'top-right') {
            xPosition = this.scene.sys.game.config.width / 2 + 300; // Moved closer to the middle
            yPosition = 50; // Moved closer to the middle
        }

        const heartImage = this.scene.add.image(xPosition, yPosition, 'heart')
            .setOrigin(0.5, 0.5)
            .setScale(scaleX, scaleY);

        this.scene.add.text(xPosition, yPosition, hp, {
            fontSize: '40px',
            fill: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0.5);
    }

    displayMonstersPiles(player, isPlayer, position) {
        const pileLength = player.defeatedMonstersPile.length;
        const desiredWidth = 60;
        const desiredHeight = 84;
        const scaleX = desiredWidth / 750;
        const scaleY = desiredHeight / 1050;
        let xPosition, yPosition;

        if (position === 'bottom') {
            xPosition = this.scene.sys.game.config.width / 2 - 300;
            yPosition = this.scene.sys.game.config.height - 330;
        } else if (position === 'top-left') {
            xPosition = this.scene.sys.game.config.width / 2 - 300
            yPosition = 130; // Moved closer to the middle
        } else if (position === 'top-right') {
            xPosition = this.scene.sys.game.config.width / 2 + 300; // Moved closer to the middle
            yPosition = 130; // Moved closer to the middle
        }

        const monsterPileImage = this.scene.add.image(xPosition, yPosition, 'back_dungeon')
            .setOrigin(0.5, 0.5)
            .setScale(scaleX, scaleY);

        this.scene.add.text(xPosition, yPosition, pileLength, {
            fontSize: '40px',
            fill: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0.5);


        monsterPileImage.setInteractive({ useHandCursor: true });
        monsterPileImage.on('pointerdown', () => {
            this.displayScoutInterface(player.defeatedMonstersPile);
        });
    }

    addDamageButton(game) {
        const buttonText = `Take ${game.currentCard.damage} Damage`;
        const buttonWidth = 200;
        const buttonHeight = 30;
        const buttonX = this.scene.sys.game.config.width / 2;
        const buttonY = this.scene.sys.game.config.height - 365;
        // const buttonY = this.scene.sys.game.config.height / 2 - 50;
        const buttonRadius = 10; // For rounded corners

        // Create a graphics object to draw the button
        const graphics = this.scene.add.graphics();

        // Draw the rounded rectangle button
        graphics.fillStyle(0xffa500, 1);
        graphics.fillRoundedRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, buttonRadius);

        // Add the text on top of the button
        const text = this.scene.add.text(buttonX, buttonY, buttonText, {
            fontSize: '20px',
            fill: '#000',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0.5);

        // Create an interactive zone over the button
        const button = this.scene.add.zone(buttonX, buttonY, buttonWidth, buttonHeight)
            .setOrigin(0.5, 0.5)
            .setInteractive({ useHandCursor: true });

        button.setData("type", "take_damage")
        // Handle the click event
        button.on('pointerdown', () => {
            console.log(`Player takes ${game.currentCard.damage} damage.`);
            // Example: Apply damage to the player or update the game state
        });

        // Add a hover effect to the button and text
        button.on('pointerover', () => {
            graphics.clear();
            graphics.fillStyle(0xffb732, 1); // Lighter orange for hover
            graphics.fillRoundedRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, buttonRadius);
        });

        button.on('pointerout', () => {
            graphics.clear();
            graphics.fillStyle(0xffa500, 1);
            graphics.fillRoundedRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, buttonRadius);
        });

        this.scene.tweens.add({
            targets: [text],
            scaleX: 1.1,
            scaleY: 1.1,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            duration: 500
        });
    }

    addExecuteButton(game) {
        const buttonText = `Execute`;
        const buttonWidth = 120;
        const buttonHeight = 30;
        const buttonX = this.scene.sys.game.config.width / 2;
        const buttonY = this.scene.sys.game.config.height - 400;
        // const buttonY = this.scene.sys.game.config.height / 2 - 50;
        const buttonRadius = 10; // For rounded corners

        // Create a graphics object to draw the button
        const graphics = this.scene.add.graphics();

        // Draw the rounded rectangle button
        graphics.fillStyle(0xff1100, 1);
        graphics.fillRoundedRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, buttonRadius);

        // Add the text on top of the button
        const text = this.scene.add.text(buttonX, buttonY, buttonText, {
            fontSize: '20px',
            fill: '#000',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0.5);

        // Create an interactive zone over the button
        const button = this.scene.add.zone(buttonX, buttonY, buttonWidth, buttonHeight)
            .setOrigin(0.5, 0.5)
            .setInteractive({ useHandCursor: true });

        button.setData("type", "execute")
        // Handle the click event
        button.on('pointerdown', () => {
            console.log(`Player wants to execute.`);
            // Example: Apply damage to the player or update the game state
        });

        // Add a hover effect to the button and text
        button.on('pointerover', () => {
            graphics.clear();
            graphics.fillStyle(0xff3332, 1); // Lighter orange for hover
            graphics.fillRoundedRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, buttonRadius);
        });

        button.on('pointerout', () => {
            graphics.clear();
            graphics.fillStyle(0xff1100, 1);
            graphics.fillRoundedRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, buttonRadius);
        });

        this.scene.tweens.add({
            targets: [text],
            scaleX: 1.1,
            scaleY: 1.1,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            duration: 500
        });
    }



    addPassTurnButton(game) {
        const buttonText = `Pass turn`;
        const buttonWidth = 130;
        const buttonHeight = 50;
        const buttonX = this.scene.sys.game.config.width / 2;
        const buttonY = 100;
        // const buttonY = this.scene.sys.game.config.height / 2 - 50;
        const buttonRadius = 10; // For rounded corners

        // Create a graphics object to draw the button
        const graphics = this.scene.add.graphics();

        // Draw the rounded rectangle button
        graphics.fillStyle(0x3333ee, 1);
        graphics.fillRoundedRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, buttonRadius);

        // Add the text on top of the button
        const text = this.scene.add.text(buttonX, buttonY, buttonText, {
            fontSize: '20px',
            fill: '#000',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0.5);

        // Create an interactive zone over the button
        const button = this.scene.add.zone(buttonX, buttonY, buttonWidth, buttonHeight)
            .setOrigin(0.5, 0.5)
            .setInteractive({ useHandCursor: true });

        button.setData("type", "pass_turn")
        // Handle the click event
        button.on('pointerdown', () => {
            console.log(`Player wants to pass turn.`);
            // Example: Apply damage to the player or update the game state
        });

        // Add a hover effect to the button and text
        button.on('pointerover', () => {
            graphics.clear();
            graphics.fillStyle(0x5555ff, 1); // Lighter for hover
            graphics.fillRoundedRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, buttonRadius);
        });

        button.on('pointerout', () => {
            graphics.clear();
            graphics.fillStyle(0x3333ee, 1);
            graphics.fillRoundedRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, buttonRadius);
        });

        this.scene.tweens.add({
            targets: [text],
            scaleX: 1.1,
            scaleY: 1.1,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            duration: 500
        });
    }

    addEscapeButton(game) {
        const buttonText = `Try to escape`;
        const buttonWidth = 200;
        const buttonHeight = 30;
        const buttonX = this.scene.sys.game.config.width / 2;
        const buttonY = this.scene.sys.game.config.height - 320;
        // const buttonY = this.scene.sys.game.config.height / 2 - 50;
        const buttonRadius = 10; // For rounded corners

        // Create a graphics object to draw the button
        const graphics = this.scene.add.graphics();

        // Draw the rounded rectangle button
        graphics.fillStyle(0x33ee33, 1);
        graphics.fillRoundedRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, buttonRadius);

        // Add the text on top of the button
        const text = this.scene.add.text(buttonX, buttonY, buttonText, {
            fontSize: '20px',
            fill: '#000',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0.5);

        // Create an interactive zone over the button
        const button = this.scene.add.zone(buttonX, buttonY, buttonWidth, buttonHeight)
            .setOrigin(0.5, 0.5)
            .setInteractive({ useHandCursor: true });

        button.setData("type", "escape_roll")
        // Handle the click event
        button.on('pointerdown', () => {
            console.log(`Player wants escape.`);
            // Example: Apply damage to the player or update the game state
        });

        // Add a hover effect to the button and text
        button.on('pointerover', () => {
            graphics.clear();
            graphics.fillStyle(0x55ff55, 1); // Lighter for hover
            graphics.fillRoundedRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, buttonRadius);
        });

        button.on('pointerout', () => {
            graphics.clear();
            graphics.fillStyle(0x33ee33, 1);
            graphics.fillRoundedRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, buttonRadius);
        });

        this.scene.tweens.add({
            targets: [text],
            scaleX: 1.1,
            scaleY: 1.1,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            duration: 500
        });
    }

    displayScoutInterface(cards, onPickCard = () => {}) {
        if (cards?.length) {
            if (this.scoutPopup) {
                this.scoutPopup.destroy();
                this.scoutPopup = null;
            }

            if (!this.blurryBackground) {
                this.blurryBackground = this.scene.add.graphics({ fillStyle: { color: 0x000000, alpha: 0.7 } });
                this.blurryBackground.fillRect(0, 0, this.scene.sys.game.config.width, this.scene.sys.game.config.height);
                this.blurryBackground.setDepth(10);
                this.blurryBackground.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.scene.sys.game.config.width, this.scene.sys.game.config.height), Phaser.Geom.Rectangle.Contains);
                this.blurryBackground.on('pointerdown', (pointer) => { });
            }

            const container = this.scene.add.container(0, 0).setDepth(12);

            let cardWidth = 240;
            let cardHeight = 336;
            const maxCardWidth = 240;
            const maxCardHeight = 336;
            const minCardWidth = 100;
            const minCardHeight = 140;
            const spacing = 10;
            let columns;

            if (cards.length <= 4) {
                columns = cards.length;
            } else if (cards.length <= 12) {
                columns = 6;
                cardWidth = 150;
                cardHeight = 210;
            } else {
                columns = 10;
                cardWidth = 100;
                cardHeight = 140;
            }

            const scaleX = cardWidth / 750;
            const scaleY = cardHeight / 1050;

            let rows = Math.ceil(cards.length / columns);

            const startX = (this.scene.sys.game.config.width - (columns * (cardWidth + spacing))) / 2;
            const startY = (this.scene.sys.game.config.height - (rows * (cardHeight + spacing))) / 2;

            cards.forEach((card, index) => {
                const colIndex = index % columns;
                const rowIndex = Math.floor(index / columns);
                const cardX = startX + colIndex * (cardWidth + spacing);
                const cardY = startY + rowIndex * (cardHeight + spacing);

                const cardImage = this.scene.add.image(cardX, cardY, card.texture)
                    .setOrigin(0, 0)
                    .setDisplaySize(cardWidth, cardHeight)
                    .setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 1 });

                cardImage.on('pointerover', () => {
                    cardImage.setDepth(15);
                    this.scene.tweens.add({
                        targets: cardImage,
                        scaleX: scaleX * 1.1,
                        scaleY: scaleY * 1.1,
                        duration: 50,
                        ease: 'Sine.easeInOut'
                    });
                });

                cardImage.on('pointerout', () => {
                    cardImage.setDepth(12);
                    this.scene.tweens.add({
                        targets: cardImage,
                        scaleX: scaleX,
                        scaleY: scaleY,
                        duration: 50,
                        ease: 'Sine.easeInOut',
                    });
                });

                if (onPickCard) {
                    cardImage.on('pointerdown', () => {
                        this.scene.tweens.add({
                            targets: [container, this.blurryBackground],
                            alpha: { from: 1, to: 0 },
                            duration: 300,
                            onComplete: () => {
                                container.destroy();
                                this.blurryBackground.destroy();
                                this.scoutPopup = null;
                                this.blurryBackground = null;
                                console.log(`Picked card id: ${card.id}`); // Replace this with the necessary action to handle the picked card
                                onPickCard(card.id)
                            }
                        });
                    });
                }

                container.add(cardImage);
            });

            const buttonWidth = 200;
            const buttonHeight = 50;
            const buttonX = this.scene.sys.game.config.width / 2;
            const buttonY = startY + rows * (cardHeight + spacing) + 40;
            const buttonRadius = 10;

            const closeButtonBg = this.scene.add.graphics();
            closeButtonBg.fillStyle(0xff0000, 1);
            closeButtonBg.fillRoundedRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, buttonRadius);
            closeButtonBg.setDepth(13);
            closeButtonBg.setInteractive(new Phaser.Geom.Rectangle(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight), Phaser.Geom.Rectangle.Contains);
            closeButtonBg.on('pointerdown', () => {
                this.scene.tweens.add({
                    targets: [container, this.blurryBackground],
                    alpha: { from: 1, to: 0 },
                    duration: 300,
                    onComplete: () => {
                        container.destroy();
                        this.blurryBackground.destroy();
                        this.scoutPopup = null;
                        this.blurryBackground = null;
                    }
                });
            });

            const closeButtonText = this.scene.add.text(buttonX, buttonY, 'CLOSE', {
                fontSize: '32px',
                fill: '#fff'
            }).setOrigin(0.5, 0.5)
                .setInteractive({ useHandCursor: true })
                .setDepth(14);

            closeButtonText.on('pointerdown', () => {
                this.scene.tweens.add({
                    targets: [container, this.blurryBackground],
                    alpha: { from: 1, to: 0 },
                    duration: 300,
                    onComplete: () => {
                        container.destroy();
                        this.blurryBackground.destroy();
                        this.scoutPopup = null;
                        this.blurryBackground = null;
                    }
                });
            });

            container.add(closeButtonBg);
            container.add(closeButtonText);

            this.scene.tweens.add({
                targets: [container, this.blurryBackground],
                alpha: { from: 0, to: 1 },
                duration: 300
            });

            this.scoutPopup = container;
        }
    }


    createPopupBackground(depth) {
        const bg = this.scene.add.graphics({ fillStyle: { color: 0x000000, alpha: 0.7 } });
        bg.fillRect(0, 0, this.scene.sys.game.config.width, this.scene.sys.game.config.height);
        bg.setDepth(depth);

        const interactionBlocker = this.scene.add.zone(0, 0, this.scene.sys.game.config.width, this.scene.sys.game.config.height);
        interactionBlocker.setOrigin(0, 0);
        interactionBlocker.setDepth(depth + 1);
        interactionBlocker.setInteractive();

        return { bg, interactionBlocker };
    }

    createButton(container, x, y, text, onClick, bgColor = 0xffa500) {
        const buttonSize = 100;

        const buttonContainer = this.scene.add.container(x, y);

        const buttonBg = this.scene.add.graphics();
        buttonBg.fillStyle(bgColor, 1);
        buttonBg.fillRoundedRect(-buttonSize / 2, -buttonSize / 2, buttonSize, buttonSize, 10);
        buttonBg.setDepth(13);
        buttonContainer.add(buttonBg);

        const buttonText = this.scene.add.text(0, 0, text, {
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5, 0.5)
            .setDepth(14);

        buttonContainer.add(buttonText);

        const buttonZone = this.scene.add.zone(0, 0, buttonSize, buttonSize)
            .setOrigin(0.5, 0.5)
            .setInteractive({ useHandCursor: true })
            .setDepth(15);

        buttonContainer.add(buttonZone);

        buttonZone.on('pointerover', () => {
            this.scene.tweens.add({
                targets: buttonContainer,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 50,
                ease: 'Sine.easeInOut'
            });
        });

        buttonZone.on('pointerout', () => {
            this.scene.tweens.add({
                targets: buttonContainer,
                scaleX: 1,
                scaleY: 1,
                duration: 50,
                ease: 'Sine.easeInOut'
            });
        });

        buttonZone.on('pointerdown', onClick);

        container.add(buttonContainer);
    }

    createNumberButtons(container, startX, startY, onClick) {
        const buttonSize = 100;
        const spacing = 20;

        for (let i = 0; i <= 9; i++) {
            const row = Math.floor(i / 3);
            const col = i % 3;
            const buttonX = startX + col * (buttonSize + spacing) + buttonSize / 2;
            const buttonY = startY + row * (buttonSize + spacing) + buttonSize / 2;

            this.createButton(container, buttonX, buttonY, i.toString(), () => onClick(i));
        }
    }

    displayNumberInputInterface(item, onNumberSelected) {
        // Ensure any existing number input popup is removed
        if (this.numberInputPopup) {
            this.numberInputPopup.destroy();
            this.numberInputPopup = null;
        }

        const { bg, interactionBlocker } = this.createPopupBackground(10);

        // Create a container for the popup
        const container = this.scene.add.container(0, 0).setDepth(12);

        //todo display current item on the left and keypad on the right
        const desiredWidth = 375;
        const desiredHeight = 525;
        const scaleX = desiredWidth / 750;
        const scaleY = desiredHeight / 1050;
        const xPosition = (this.scene.sys.game.config.width) / 4;
        const yPosition = (this.scene.sys.game.config.height) / 2;
        let itemCardImage = this.scene.add.image(xPosition, yPosition, item.texture)
            .setOrigin(0.5, 0.5).setScale(scaleX, scaleY).setDepth(12);
        container.add(itemCardImage);

        // Button dimensions
        const buttonSize = 100;
        const spacing = 20;

        // Calculate positions
        const startX = (this.scene.sys.game.config.width - 3 * (buttonSize + spacing) + spacing) * 3 / 4;
        const startY = (this.scene.sys.game.config.height - 4 * (buttonSize + spacing) + spacing) / 2;

        // Add number buttons to the container
        this.createNumberButtons(container, startX, startY, (i) => {
            this.scene.tweens.add({
                targets: [container, bg, interactionBlocker],
                alpha: { from: 1, to: 0 },
                duration: 300,
                onComplete: () => {
                    container.destroy();
                    bg.destroy();
                    interactionBlocker.destroy();
                    this.numberInputPopup = null;
                    onNumberSelected(i);
                }
            });
        });

        // Add "Other" button
        const otherButtonX = startX + 1 * (buttonSize + spacing) + buttonSize / 2;
        const otherButtonY = startY + 3 * (buttonSize + spacing) + buttonSize / 2;

        this.createButton(container, otherButtonX, otherButtonY, 'Other', () => {
            this.showManualNumberInput(onNumberSelected, container, bg, interactionBlocker);
        }, 0xff4500);

        // Add tween animation for opening
        this.scene.tweens.add({
            targets: [container, bg, interactionBlocker],
            alpha: { from: 0, to: 1 },
            duration: 300
        });

        // Keep reference to the number input popup
        this.numberInputPopup = container;
    }

    showManualNumberInput(onNumberSelected, container, bg, interactionBlocker) {
        // Hide the existing container
        container.setVisible(false);

        const { bg: manualBg, interactionBlocker: manualInteractionBlocker } = this.createPopupBackground(10);
        const inputContainer = this.scene.add.container(0, 0).setDepth(12);

        // Button dimensions
        const buttonSize = 100;
        const spacing = 20;

        // Calculate positions
        const startX = (this.scene.sys.game.config.width - 3 * (buttonSize + spacing) + spacing) * 3 / 4;
        const startY = (this.scene.sys.game.config.height - 4 * (buttonSize + spacing) + spacing) / 2;

        // Add number buttons to the input container
        let inputValue = "";

        this.createNumberButtons(inputContainer, startX, startY, (i) => {
            inputValue += i.toString();
            inputText.setText(inputValue);
        });

        // Display input value
        const inputText = this.scene.add.text(this.scene.sys.game.config.width / 2, startY - 30, '', {
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5, 0.5)
            .setDepth(14);

        inputContainer.add(inputText);

        // Submit button
        const submitButtonX = startX + 1 * (buttonSize + spacing) + buttonSize / 2;
        const submitButtonY = startY + 3 * (buttonSize + spacing) + buttonSize / 2;

        this.createButton(inputContainer, submitButtonX, submitButtonY, '🆗', () => {
            if (inputValue !== "") {
                const numValue = parseInt(inputValue);
                this.scene.tweens.add({
                    targets: [inputContainer, manualBg, manualInteractionBlocker, bg, interactionBlocker],
                    alpha: { from: 1, to: 0 },
                    duration: 300,
                    onComplete: () => {
                        inputContainer.destroy();
                        manualBg.destroy();
                        manualInteractionBlocker.destroy();
                        bg.destroy();
                        interactionBlocker.destroy();
                        this.numberInputPopup = null;
                        onNumberSelected(numValue);
                    }
                });
            }
        }, 0x00ff00);

        // Add tween animation for opening the input container
        this.scene.tweens.add({
            targets: inputContainer,
            alpha: { from: 0, to: 1 },
            duration: 300
        });
    }

    displayMonsterTypeSelectionInterface(item, onMonsterTypeSelected) {
        if (this.creatureSelectionPopup) {
            this.creatureSelectionPopup.destroy();
            this.creatureSelectionPopup = null;
        }

        const { bg, interactionBlocker } = this.createPopupBackgroundMonsterTypePopup(10);
        const container = this.scene.add.container(0, 0).setDepth(12);

        const desiredWidth = 375;
        const desiredHeight = 525;
        const scaleX = desiredWidth / 750;
        const scaleY = desiredHeight / 1050;
        const xPosition = (this.scene.sys.game.config.width) / 4;
        const yPosition = (this.scene.sys.game.config.height) / 2;

        let itemCardImage = this.scene.add.image(xPosition, yPosition, item.texture)
            .setOrigin(0.5, 0.5).setScale(scaleX, scaleY).setDepth(12);
        container.add(itemCardImage);

        const creatures = [
            'Rat', 'Goblin', 'Skeleton', 'Orc',
            'Vampire', 'Golem', 'Lich', 'Demon', 'Dragon'
        ];

        const buttonHeight = 50;
        const buttonSize = 250;
        const spacing = 10;

        // Calculate positions
        const startX = (this.scene.sys.game.config.width - 1 * (buttonSize + spacing) + spacing) * 3 / 4;
        const startY = yPosition - ((buttonHeight + spacing) * creatures.length) / 2;

        creatures.forEach((creature, index) => {
            const yPos = startY + index * (buttonHeight + spacing);
            this.createButtonMonsterTypePopup(container, startX, yPos, creature, () => {
                this.scene.tweens.add({
                    targets: [container, bg, interactionBlocker],
                    alpha: { from: 1, to: 0 },
                    duration: 300,
                    onComplete: () => {
                        container.destroy();
                        bg.destroy();
                        interactionBlocker.destroy();
                        this.creatureSelectionPopup = null;
                        onMonsterTypeSelected(creature);
                    }
                });
            }, 0x00ff00);
        });

        this.scene.tweens.add({
            targets: [container, bg, interactionBlocker],
            alpha: { from: 0, to: 1 },
            duration: 300
        });

        this.creatureSelectionPopup = container;
    }

    createButtonMonsterTypePopup(container, x, y, label, callback, color) {
        const button = this.scene.add.text(x, y, label, {
            fontSize: '32px',
            fill: '#fff',
            backgroundColor: color ? Phaser.Display.Color.GetColor(color, color, color) : null
        }).setInteractive({ useHandCursor: true }).on('pointerdown', callback);

        button.setOrigin(0.5, 0.5);
        container.add(button);
    }

    createPopupBackgroundMonsterTypePopup(depth) {
        const bg = this.scene.add.rectangle(0, 0, this.scene.sys.game.config.width, this.scene.sys.game.config.height, 0x000000, 0.5).setOrigin(0, 0).setDepth(depth);
        const interactionBlocker = this.scene.add.rectangle(0, 0, this.scene.sys.game.config.width, this.scene.sys.game.config.height, 0x000000, 0).setOrigin(0, 0).setInteractive().setDepth(depth + 1);
        return { bg, interactionBlocker };
    }



    updateEndUI(winner, finalPlayers, localPlayerId) {
        console.log("updateEndUI", winner, finalPlayers);

        // Clear previous display
        this.clearPreviousDisplay();

        // Create a title with animation
        const title = this.scene.add.text(this.scene.cameras.main.centerX, 100, 'FIN DE LA PARTIE', {
            fontSize: '48px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0);

        this.scene.tweens.add({
            targets: title,
            alpha: 1,
            duration: 1000,
            ease: 'Power2'
        });

        if (!finalPlayers) return;

        // Create final players display with animation
        let yPos = 200;
        finalPlayers.forEach((player, index) => {
            const isLocalPlayer = player.id === localPlayerId;
            const playerText = `#${index + 1} - ${player.name} : ${player.score} points, ${player.defeatedMonstersPile.length} monstres tués ${player.id === winner.id ? '🏅' : ''}`;
            const playerDisplay = this.scene.add.text(this.scene.cameras.main.centerX, yPos, playerText, {
                fontSize: '32px',
                fill: isLocalPlayer ? '#00ff00' : '#ffffff', // Highlight local player in green
                fontStyle: isLocalPlayer ? 'bold' : 'normal'
            }).setOrigin(0.5).setAlpha(0);

            this.scene.tweens.add({
                targets: playerDisplay,
                alpha: 1,
                duration: 1000,
                ease: 'Power2'
            });
            yPos += 50;
        });

        // Display winner with animation
        if (winner) {
            const winnerText = `${winner.name} remporte la partie !`;
            const winnerDisplay = this.scene.add.text(this.scene.cameras.main.centerX, yPos + 50, winnerText, {
                fontSize: '36px',
                fill: '#ffdd00',
                fontStyle: 'bold'
            }).setOrigin(0.5).setAlpha(0);

            this.scene.tweens.add({
                targets: winnerDisplay,
                alpha: 1,
                duration: 1000,
                ease: 'Power2'
            });
        }

        // Add Replay and Exit buttons with animation
        const replayButton = this.scene.add.text(this.scene.cameras.main.centerX - 100, yPos + 100, 'Replay', {
            fontSize: '32px',
            fill: '#00ff00',
            fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive().setAlpha(0);

        replayButton.on('pointerdown', () => {
            this.scene.scene.restart();
        });

        this.scene.tweens.add({
            targets: replayButton,
            alpha: 1,
            duration: 1000,
            ease: 'Power2'
        });

        const exitButton = this.scene.add.text(this.scene.cameras.main.centerX + 100, yPos + 100, 'Exit', {
            fontSize: '32px',
            fill: '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive().setAlpha(0);

        exitButton.on('pointerdown', () => {
            this.scene.scene.start('MainMenu');
        });

        this.scene.tweens.add({
            targets: exitButton,
            alpha: 1,
            duration: 1000,
            ease: 'Power2'
        });
    }


}
