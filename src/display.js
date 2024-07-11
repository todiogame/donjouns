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

export class DisplayManager {
    constructor(scene) {
        this.scene = scene;
        this.backgroundContainer = null;
        this.zoomedItemCard = null; // To keep track of the zoomed-in itemCard
        this.blurryBackground = null; // To keep track of the blurry background
    }

    displayTitle(message, duration, onComplete) {
        const titleScene = this.scene.scene.get('TitleScene');
        titleScene.displayTitle(message, duration, onComplete);
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
        let childrenToRemove = this.scene.children.list.filter(child => child !== this.backgroundContainer && child !== this.zoomedItemCard && child !== this.blurryBackground);
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

        const players = game.players;
        players.forEach(player => {
            if (player.id === localPlayerId) {
                this.displayStuff(player.stuff, true, 'bottom', player, game);
                this.displayHP(player, true, 'bottom');
            } else {
                const position = this.getOpponentPosition(player.id, localPlayerId, players);
                this.displayStuff(player.stuff, false, position, player, game);
                this.displayHP(player, false, position);
            }
        });
        this.displayCurrentCard(game, localPlayerId);
        if (game.noCurrentCard() && game.getCurrentPlayer().canPass)
            this.addPassTurnButton(game)
        this.displayDungeon(game, localPlayerId);
        this.displayDiscardPile(game);
        if (game.isMyTurn(localPlayerId) && game.currentCard?.dungeonCardType === "monster")
            this.addDamageButton(game);
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
        const numCards = game.dungeonLength;
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
                cardSprite = this.scene.add.image(800 + 0.2 * i, 100 - 0.1 * i, "back_discard") // moved to top
                    .setOrigin(0.5, 0.5)
                    .setRotation(((i * 7 % 12) - 6) * 0.002 * Math.PI)
                    .setScale(scaleX, scaleY);
            }
        } else {
            this.scene.add.rectangle(800, 100, desiredWidth, desiredHeight, 0x808080, 0.5) // moved to top
                .setOrigin(0.5, 0.5);
            this.scene.add.text(800, 100, 'DISCARD', { fontSize: '16px', color: '#FFFFFF' })
                .setOrigin(0.5, 0.5);
        }

        cardSprite?.setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 1 });
    }
    displayStuff(stuff, isPlayer, position, player, game) {
        const playerName = player.name;
        this.scene.playcardSound.play();

        const desiredWidth = isPlayer ? 200 : 90; // increased size for player cards
        const desiredHeight = isPlayer ? 280 : 126; // increased size for player cards
        const scaleX = desiredWidth / 750;
        const scaleY = desiredHeight / 1050;
        let playerNameText;

        if (isPlayer) {
            stuff.forEach((itemCard, index) => {
                if (itemCard) {
                    let itemCardImage;
                    const xPosition = 100 + index * (desiredWidth + 10); // Adjusted slightly to the right
                    const yPosition = this.scene.sys.game.config.height - 280 + (desiredHeight / 2) - 5; // Adjust for origin (0.5, 0.5)

                    itemCardImage = this.scene.add.image(xPosition, yPosition, itemCard.texture)
                        .setOrigin(0.5, 0.5) // Center origin for correct rotation
                        .setScale(scaleX, scaleY)
                        .setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 1 });

                    if (itemCard.broken) {
                        itemCardImage.setRotation(Math.PI / 2);
                        itemCardImage.setDepth(-2);
                        const overlay = this.scene.add.rectangle(xPosition, yPosition, desiredWidth, desiredHeight, 0x444444, 0.3)
                            .setOrigin(0.5, 0.5)
                            .setRotation(Math.PI / 2)
                            .setDepth(-1); // Bring to foreground
                        itemCardImage.setData('overlay', overlay);
                    }
                    itemCardImage.setData("type", "my_item");
                    itemCardImage.setData("item_id", itemCard.id);
                    // Add hover effect with smooth transition
                    itemCardImage.on('pointerover', () => {
                        itemCardImage.setDepth(1);
                        this.scene.tweens.add({
                            targets: itemCardImage,
                            scaleX: scaleX * 1.1,
                            scaleY: scaleY * 1.1,
                            duration: 50,
                            ease: 'Sine.easeInOut'
                        });
                    });
                    itemCardImage.on('pointerout', () => {
                        itemCardImage.setDepth(itemCard.broken ? -2 : 0);
                        this.scene.tweens.add({
                            targets: itemCardImage,
                            scaleX: scaleX,
                            scaleY: scaleY,
                            duration: 50,
                            ease: 'Sine.easeInOut',
                        });
                    });
                }
            });
            playerNameText = this.scene.add.text(100, this.scene.sys.game.config.height - 310, playerName, { fontSize: '20px', fill: '#fff', fontStyle: 'bold' });
        } else {
            const stuffYOffset = 15; // Adjust the offset for pushing down the stuff
            const maxItemsPerColumn = 2;
            const columnOffset = desiredWidth + 10;
            let xPosition;

            if (position === 'top-left') {
                xPosition = 10; // moved closer to the top-left corner
            } else if (position === 'top-right') {
                xPosition = this.scene.sys.game.config.width - desiredWidth - 10; // moved closer to the top-right corner
            }

            stuff.forEach((itemCard, index) => {
                if (itemCard) {
                    let itemCardImage;
                    const columnIndex = Math.floor(index / maxItemsPerColumn);
                    const rowIndex = index % maxItemsPerColumn;
                    const yPosition = rowIndex * (desiredHeight * 0.5 + 5) + stuffYOffset + (desiredHeight / 2); // Adjust for origin (0.5, 0.5)
                    const actualXPosition = position === 'top-left' ? xPosition + columnIndex * columnOffset + (desiredWidth / 2) : xPosition - columnIndex * columnOffset + (desiredWidth / 2); // Adjust for origin (0.5, 0.5)

                    itemCardImage = this.scene.add.image(actualXPosition, yPosition, itemCard.texture)
                        .setOrigin(0.5, 0.5) // Center origin for correct rotation
                        .setScale(scaleX, scaleY)
                        .setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 1 });
                    itemCardImage.setData("type", "opponent_item");

                    if (itemCard.broken) {
                        itemCardImage.setRotation(Math.PI / 2);
                        itemCardImage.setDepth(-1);
                        const overlay = this.scene.add.rectangle(actualXPosition, yPosition, desiredWidth, desiredHeight, 0x444444, 0.3)
                            .setOrigin(0.5, 0.5)
                            .setRotation(Math.PI / 2)
                            .setDepth(-1); // Bring to foreground
                        itemCardImage.setData('overlay', overlay);
                    }
                }
            });

            playerNameText = this.scene.add.text(xPosition, 2 * stuffYOffset + (desiredHeight * (maxItemsPerColumn - 1) * 1.5), playerName, { fontSize: '20px', fill: '#fff', fontStyle: 'bold' }); // Name displayed below stuff
        }

        if (game && game.players[game.currentPlayerIndex].id === player.id)
            this.addShiningEffect(playerNameText);
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
            yPosition = this.scene.sys.game.config.height - 320;
        } else if (position === 'top-left') {
            xPosition = this.scene.sys.game.config.width / 2 - 300
            yPosition = 100; // Moved closer to the middle
        } else if (position === 'top-right') {
            xPosition = this.scene.sys.game.config.width / 2 + 300; // Moved closer to the middle
            yPosition = 100; // Moved closer to the middle
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


    addDamageButton(game) {
        const buttonText = `Take ${game.currentCardDamage} Damage`;
        const buttonWidth = 200;
        const buttonHeight = 50;
        const buttonX = this.scene.sys.game.config.width / 2;
        const buttonY = this.scene.sys.game.config.height - 320;
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
            console.log(`Player takes ${game.currentCardDamage} damage.`);
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
            graphics.fillStyle(0x5555ff, 1); // Lighter orange for hover
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



}
