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
    }

    updateDraftingUI(players, currentPlayerId) {
        console.log("updateDraftingUI", players, currentPlayerId);

        this.clearPreviousDisplay();
        players.forEach(player => {
            if (player.id === currentPlayerId) {
                this.displayStuff(player.stuff, true, 'bottom', player);
            } else {
                const position = this.getOpponentPosition(player.id, currentPlayerId, players);
                this.displayStuff(player.stuff, false, position, player);
            }
        });
        players.forEach(player => {
            if (player.id === currentPlayerId) {
                this.displayHand(player.hand);
            }
        });
        //tests a supprimer
        // this.displayDungeon();
        // this.displayCurrentCard()


    }
    updateGameUI(game, currentPlayerId) {
        console.log("updateGameUI", game, currentPlayerId);
        this.clearPreviousDisplay();

        const players = game.players;
        players.forEach(player => {
            if (player.id === currentPlayerId) {
                this.displayStuff(player.stuff, true, 'bottom', player, game);
                // this.displayMonstersPile(player.defeatedMonstersPile, true, 'bottom', player.id);
                this.displayHP(player, true, 'bottom');
            } else {
                const position = this.getOpponentPosition(player.id, currentPlayerId, players);
                this.displayStuff(player.stuff, false, position, player, game);
                // this.displayMonstersPile(player.defeatedMonstersPile, true, position, player.id);
                this.displayHP(player, false, position);
            }
        });
        this.displayCurrentCard(game, currentPlayerId);
        this.displayDungeon(game, currentPlayerId);
        this.displayDiscardPile(game);

    }

    displayCurrentCard(game) {
        if (game.current_card) {
            const desiredWidth = 125
            const desiredHeight = 175
            const scaleX = desiredWidth / 750;
            const scaleY = desiredHeight / 1050;
            const cardSprite = this.scene.add.image(650, 300, game.current_card.texture)
                .setOrigin(0.5, 0.5)
                .setRotation(((id * 7 % 12) - 6) * 0.002 * Math.PI)
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
    animateCard(card) {
        this.scene.tweens.add({
            targets: card,
            angle: { from: -5, to: 5 }, // Adjust the angle values to control the wiggle
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            duration: 100 // Adjust the duration for quicker or slower wiggle
        });
    }


    displayDungeon(game, currentPlayerId) {
        const desiredWidth = 125;
        const desiredHeight = 175;
        const scaleX = desiredWidth / 750;
        const scaleY = desiredHeight / 1050;
        const numCards = game.dungeonLength;
        let cardSprite;

        for (let i = 0; i < numCards; i++) {
            cardSprite = this.scene.add.image(500 + 0.2 * i, 300 - 0.1 * i, "back_dungeon")
                .setOrigin(0.5, 0.5)
                .setRotation(((i * 7 % 12) - 6) * 0.002 * Math.PI)
                .setScale(scaleX, scaleY);
        }
        if (cardSprite && game.players[game.currentPlayerIndex].id === currentPlayerId) {
            // Apply the "excited" animation
            this.animateCard(cardSprite);
            // Make the card interactive
            cardSprite.setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 1 });

            // Add click event to stop animation
            cardSprite.on('pointerdown', () => {
                this.scene.tweens.killTweensOf(cardSprite);
                cardSprite.setScale(scaleX, scaleY); // Reset scale
                // Add logic to handle card click
            });
        }
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
                cardSprite = this.scene.add.image(800 + 0.2 * i, 300 - 0.1 * i, "back_discard")
                    .setOrigin(0.5, 0.5)
                    .setRotation(((i * 7 % 12) - 6) * 0.002 * Math.PI)
                    .setScale(scaleX, scaleY);
            }
        } else {
            this.scene.add.rectangle(800, 300, desiredWidth, desiredHeight, 0x808080, 0.5)
                .setOrigin(0.5, 0.5);
            this.scene.add.text(800, 300, 'DISCARD', { fontSize: '16px', color: '#FFFFFF' })
                .setOrigin(0.5, 0.5);
        }

        cardSprite?.setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 1 });
    }
    displayHP(player, isPlayer, position) {
        console.log(player)
        const hp = player.hp
        console.log("hp", player.id, player.hp)
        const desiredWidth = 80;
        const desiredHeight = 80;
        const scaleX = desiredWidth / 500;
        const scaleY = desiredHeight / 500;
        let xPosition, yPosition;

        if (position === 'bottom') {
            xPosition = 40;
            yPosition = this.scene.sys.game.config.height - 160;
        } else if (position === 'top-left') {
            xPosition = 40;
            yPosition = 40;
        } else if (position === 'top-right') {
            xPosition = this.scene.sys.game.config.width - 40;
            yPosition = 40;
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


    displayStuff(stuff, isPlayer, position, player, game) {
        const playerName = player.name
        this.scene.playcardSound.play();

        const desiredWidth = isPlayer ? 125 : 90;
        const desiredHeight = isPlayer ? 175 : 126;

        const scaleX = desiredWidth / 750;
        const scaleY = desiredHeight / 1050;
        let playerNameText;
        if (isPlayer) {
            playerNameText = this.scene.add.text(75, this.scene.sys.game.config.height - 210, playerName, { fontSize: '20px', fill: '#fff', fontStyle: 'bold' });
            stuff.forEach((itemCard, index) => {
                if (itemCard) {
                    const xPosition = 75 + index * (desiredWidth + 10);
                    const yPosition = this.scene.sys.game.config.height - 180;

                    const cardImage = this.scene.add.image(0, 0, itemCard.texture)
                        .setOrigin(0, 0)
                        .setScale(scaleX, scaleY)
                        .setPosition(xPosition, yPosition)
                        .setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 1 });

                    cardImage.cardIndex = index;
                    cardImage.isSelected = true; // Mark as selectable for zoom
                    cardImage.isInStuff = true; // This itemCard is in stuff

                    this.scene.input.enableDebug(cardImage);
                }
            });
        } else {
            const nameYOffset = 35; // Adjust the offset for name display
            const stuffYOffset = 5; // Adjust the offset for pushing down the stuff
            const maxItemsPerColumn = 2;
            const columnOffset = desiredWidth + 10;
            let xPosition, yOffset;

            if (position === 'top-left') {
                xPosition = 75;
                yOffset = 5 + nameYOffset;
            } else if (position === 'top-right') {
                xPosition = this.scene.sys.game.config.width - desiredWidth - 75;
                yOffset = 5 + nameYOffset;
            }

            playerNameText = this.scene.add.text(xPosition, yOffset - nameYOffset, playerName, { fontSize: '20px', fill: '#fff', fontStyle: 'bold' });

            stuff.forEach((itemCard, index) => {
                if (itemCard) {
                    const columnIndex = Math.floor(index / maxItemsPerColumn);
                    const rowIndex = index % maxItemsPerColumn;
                    const yPosition = yOffset + rowIndex * (desiredHeight + 10) + stuffYOffset;
                    const actualXPosition = position === 'top-left' ? xPosition + columnIndex * columnOffset : xPosition - columnIndex * columnOffset;

                    const cardImage = this.scene.add.image(0, 0, itemCard.texture)
                        .setOrigin(0, 0)
                        .setScale(scaleX, scaleY)
                        .setPosition(actualXPosition, yPosition)
                        .setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 1 });

                    cardImage.cardIndex = index;
                    cardImage.isSelected = true; // Mark as selectable for zoom
                    cardImage.isInStuff = true; // This itemCard is in stuff

                    this.scene.input.enableDebug(cardImage);
                }
            });
        }
        if(game && game.players[game.currentPlayerIndex].id === player.id)
        this.addShiningEffect(playerNameText)
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

    getOpponentPosition(playerId, currentPlayerId, players) {

        const positions = ['top-left', 'top-right'];
        const currentIndex = players.findIndex(p => p.id === currentPlayerId);
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
}
