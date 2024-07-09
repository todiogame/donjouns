export class DisplayManager {
    constructor(scene) {
        this.scene = scene;
        this.backgroundContainer = null;
        this.zoomedCard = null; // To keep track of the zoomed-in card
        this.blurryBackground = null; // To keep track of the blurry background
    }

    initializeBackground() {
        this.backgroundContainer = this.scene.add.container(0, 0);
        const background = this.scene.add.image(0, 0, 'background');
        background.setOrigin(0, 0);
        background.displayWidth = this.scene.sys.game.config.width;
        background.displayHeight = this.scene.sys.game.config.height;
        this.backgroundContainer.add(background);
    }

    updatePlayerHandsAndSelectedCards(players, currentPlayerId) {
        console.log("updatePlayerHandsAndSelectedCards", players, currentPlayerId);

        this.clearPreviousDisplay();
        players.forEach(player => {
            if (player.id === currentPlayerId) {
                this.displayStuff(player.selectedCards, true, 'bottom', player.id);
                this.displayHand(player.hand);
            } else {
                const position = this.getOpponentPosition(player.id, currentPlayerId, players);
                this.displayStuff(player.selectedCards, false, position, player.id);
            }
        });
    }

    clearPreviousDisplay() {
        let childrenToRemove = this.scene.children.list.filter(child => child !== this.backgroundContainer && child !== this.zoomedCard && child !== this.blurryBackground);
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

        hand.forEach((card, index) => {
            const rotationAngle = (index - (hand.length - 1) / 2) * 0.02; // Adjust the 0.1 value to your desired rotation amount

            const cardX = startX + index * (desiredWidth - 20) + desiredWidth / 2; // Adjusted for origin at 0.5
            const cardY = yPosition + desiredHeight / 2; // Adjusted for origin at 0.5

            const cardImage = this.scene.add.image(cardX, cardY, card.texture)
                .setOrigin(0.5, 0.5)
                .setScale(scaleX, scaleY)
                .setRotation(rotationAngle)
                .setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 1 });

            cardImage.cardIndex = index;
            cardImage.isPlayer = true;
            cardImage.isSelected = card.isSelected || false; // Mark as not selectable for zoom
            cardImage.isInStuff = false; // This card is not in stuff

            if (card.isPicked) {
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
                    duration: 100,
                    ease: 'Sine.easeInOut'
                });
            });

            cardImage.on('pointerout', () => {
                cardImage.setDepth(card.isPicked ? 0.2 : 0);
                this.scene.tweens.add({
                    targets: cardImage,
                    scaleX: scaleX,
                    scaleY: scaleY,
                    duration: 100,
                    ease: 'Sine.easeInOut',
                });
            });


            this.scene.input.enableDebug(cardImage);
        });
    }


    displayStuff(stuff, isPlayer, position, playerName) {
        this.scene.playcardSound.play();

        const desiredWidth = isPlayer ? 125 : 90;
        const desiredHeight = isPlayer ? 175 : 126;

        const scaleX = desiredWidth / 750;
        const scaleY = desiredHeight / 1050;

        if (isPlayer) {
            this.scene.add.text(75, this.scene.sys.game.config.height - 210, playerName, { fontSize: '20px', fill: '#fff' });
            stuff.forEach((card, index) => {
                if (card) {
                    const xPosition = 75 + index * (desiredWidth + 10);
                    const yPosition = this.scene.sys.game.config.height - 180;

                    const cardImage = this.scene.add.image(0, 0, card.texture)
                        .setOrigin(0, 0)
                        .setScale(scaleX, scaleY)
                        .setPosition(xPosition, yPosition)
                        .setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 1 });

                    cardImage.cardIndex = index;
                    cardImage.isSelected = true; // Mark as selectable for zoom
                    cardImage.isInStuff = true; // This card is in stuff

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

            this.scene.add.text(xPosition, yOffset - nameYOffset, playerName, { fontSize: '20px', fill: '#fff' });

            stuff.forEach((card, index) => {
                if (card) {
                    const columnIndex = Math.floor(index / maxItemsPerColumn);
                    const rowIndex = index % maxItemsPerColumn;
                    const yPosition = yOffset + rowIndex * (desiredHeight + 10) + stuffYOffset;
                    const actualXPosition = position === 'top-left' ? xPosition + columnIndex * columnOffset : xPosition - columnIndex * columnOffset;

                    const cardImage = this.scene.add.image(0, 0, card.texture)
                        .setOrigin(0, 0)
                        .setScale(scaleX, scaleY)
                        .setPosition(actualXPosition, yPosition)
                        .setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 1 });

                    cardImage.cardIndex = index;
                    cardImage.isSelected = true; // Mark as selectable for zoom
                    cardImage.isInStuff = true; // This card is in stuff

                    this.scene.input.enableDebug(cardImage);
                }
            });
        }
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
        if (this.zoomedCard) {
            this.zoomedCard.destroy(); // Destroy any existing zoomed card
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

        this.zoomedCard = this.scene.add.image(this.scene.sys.game.config.width / 2, this.scene.sys.game.config.height / 2, texture)
            .setOrigin(0.5, 0.5)
            .setDepth(3)
            .setDisplaySize(fixedWidth, fixedHeight)
            .setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 1 });

        this.zoomedCard.on('pointerdown', () => {
            this.closeZoom();
        });

        this.scene.input.on('pointerdown', this.closeZoom, this);
    }

    closeZoom() {
        if (this.zoomedCard) {
            this.zoomedCard.destroy();
            this.zoomedCard = null;
        }
        if (this.blurryBackground) {
            this.blurryBackground.destroy();
            this.blurryBackground = null;
        }

        this.scene.input.off('pointerdown', this.closeZoom, this);
    }
}
