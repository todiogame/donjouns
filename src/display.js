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

    updatePlayerHandsAndSelectedCards(players) {
        this.clearPreviousDisplay();
        players.forEach(player => {
            if (player.isPlayer) {
                this.displayStuff(player.selectedCards, player.isPlayer, 'bottom', player.name);
                this.displayHand(player.hand);
            } else {
                const position = player.id === 'AI' ? 'top-left' : 'top-right';
                this.displayStuff(player.selectedCards, player.isPlayer, position, player.name);
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
        const desiredWidth = 175; // Adjust as needed
        const desiredHeight = 245; // Adjust as needed
    
        const scaleX = desiredWidth / 750; // 750 is the original width of the images
        const scaleY = desiredHeight / 1050; // 1050 is the original height of the images
    
        const totalWidth = hand.length * (desiredWidth + 10) - 10; // Total width of all cards including spacing
        const startX = (this.scene.game.config.width - totalWidth) / 2; // Center the cards
    
        hand.forEach((card, index) => {
            const cardImage = this.scene.add.image(0, 0, card.texture)
                .setOrigin(0, 0)
                .setScale(scaleX, scaleY)
                .setPosition(startX + index * (desiredWidth + 10), yPosition)
                .setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 1 });
    
            cardImage.cardIndex = index;
            cardImage.isPlayer = true;
            cardImage.isSelected = false; // Mark as not selectable for zoom
            cardImage.isInStuff = false; // This card is not in stuff
    
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
    
    zoomCard(cardImage) {
        if (this.zoomedCard) {
            this.zoomedCard.destroy(); // Destroy any existing zoomed card
        }
        if (this.blurryBackground) {
            this.blurryBackground.destroy(); // Destroy any existing blurry background
        }
    
        this.blurryBackground = this.scene.add.graphics({ fillStyle: { color: 0x000000, alpha: 0.5 } });
        this.blurryBackground.fillRect(0, 0, this.scene.sys.game.config.width, this.scene.sys.game.config.height);
    
        const { texture } = cardImage;
        const fixedWidth = 350;
        const fixedHeight = 490;
    
        this.zoomedCard = this.scene.add.image(this.scene.sys.game.config.width / 2, this.scene.sys.game.config.height / 2, texture)
            .setOrigin(0.5, 0.5)
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
