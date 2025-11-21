import Phaser from 'phaser';

export class PopupManager {
    constructor(scene, displayManager) {
        this.scene = scene;
        this.displayManager = displayManager;
        this.scoutPopup = null;
        this.numberInputPopup = null;
        this.creatureSelectionPopup = null;
        this.pickItemPopup = null;
        this.blurryBackground = null;
    }

    displayScoutInterface(cards, onPickCard = () => { }) {
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

            let cardWidth = 360;
            let cardHeight = 504;
            const maxCardWidth = 360;
            const maxCardHeight = 504;
            const minCardWidth = 150;
            const minCardHeight = 210;
            const spacing = 10;
            let columns;

            if (cards.length <= 4) {
                columns = cards.length;
            } else if (cards.length <= 12) {
                columns = 6;
                cardWidth = 225;
                cardHeight = 315;
            } else {
                columns = 10;
                cardWidth = 150;
                cardHeight = 210;
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
        const desiredWidth = 562;
        const desiredHeight = 787;
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
        let inputText; // Declare inputText here so it's accessible in the callback

        // Display input value
        inputText = this.scene.add.text(this.scene.sys.game.config.width / 2, startY - 30, '', {
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5, 0.5)
            .setDepth(14);

        inputContainer.add(inputText);

        this.createNumberButtons(inputContainer, startX, startY, (i) => {
            inputValue += i.toString();
            inputText.setText(inputValue);
        });


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

        const desiredWidth = 562;
        const desiredHeight = 787;
        const scaleX = desiredWidth / 750;
        const scaleY = desiredHeight / 1050;
        const xPosition = (this.scene.sys.game.config.width) / 4;
        const yPosition = (this.scene.sys.game.config.height) / 2;
        if (item) {
            let itemCardImage = this.scene.add.image(xPosition, yPosition, item.texture)
                .setOrigin(0.5, 0.5).setScale(scaleX, scaleY).setDepth(12);
            container.add(itemCardImage);
        }
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

    displayPickItemInterface(cardGame, localPlayerId, condition, callback, isPlayerItems = true) {
        // Ensure any existing pick item popup is removed
        if (this.pickItemPopup) {
            this.pickItemPopup.destroy();
            this.pickItemPopup = null;
        }

        // Create a blurred background
        if (!this.blurryBackground) {
            this.blurryBackground = this.scene.add.graphics({ fillStyle: { color: 0x000000, alpha: 0.7 } });
            this.blurryBackground.fillRect(0, 0, this.scene.sys.game.config.width, this.scene.sys.game.config.height);
            this.blurryBackground.setDepth(10);
            this.blurryBackground.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.scene.sys.game.config.width, this.scene.sys.game.config.height), Phaser.Geom.Rectangle.Contains);
            this.blurryBackground.on('pointerdown', (pointer) => { });
        }

        // Create a container for the popup
        const container = this.scene.add.container(0, 0).setDepth(12);

        // Get all items from the right players
        const items = [];
        cardGame.players.forEach(player => {
            if ((isPlayerItems && player.id === localPlayerId)
                || (!isPlayerItems && player.id !== localPlayerId)) {
                items.push(...player.stuff.filter(condition));
            }
        });

        let desiredWidth = 360;
        let desiredHeight = 504;
        let columns;

        if (items.length <= 4) {
            columns = items.length;
        } else if (items.length <= 12) {
            columns = 6;
            desiredWidth = 225;
            desiredHeight = 315;
        } else {
            columns = 10;
            desiredWidth = 150;
            desiredHeight = 210;
        }

        const scaleX = desiredWidth / 750;
        const scaleY = desiredHeight / 1050;
        const spacing = 10;
        const rows = Math.ceil(items.length / columns);

        const startX = (this.scene.sys.game.config.width - (columns * (desiredWidth + spacing))) / 2;
        const startY = (this.scene.sys.game.config.height - (rows * (desiredHeight + spacing))) / 2;

        items.forEach((item, index) => {
            const colIndex = index % columns;
            const rowIndex = Math.floor(index / columns);
            const itemX = startX + colIndex * (desiredWidth + spacing);
            const itemY = startY + rowIndex * (desiredHeight + spacing);

            const itemImage = this.scene.add.image(itemX, itemY, item.texture)
                .setOrigin(0, 0)
                .setDisplaySize(desiredWidth, desiredHeight)
                .setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 1 });

            itemImage.on('pointerover', () => {
                itemImage.setDepth(15);
                this.scene.tweens.add({
                    targets: itemImage,
                    scaleX: scaleX * 1.1,
                    scaleY: scaleY * 1.1,
                    duration: 50,
                    ease: 'Sine.easeInOut'
                });
            });

            itemImage.on('pointerout', () => {
                itemImage.setDepth(12);
                this.scene.tweens.add({
                    targets: itemImage,
                    scaleX: scaleX,
                    scaleY: scaleY,
                    duration: 50,
                    ease: 'Sine.easeInOut',
                });
            });

            itemImage.on('pointerdown', () => {
                this.scene.tweens.add({
                    targets: [container, this.blurryBackground],
                    alpha: { from: 1, to: 0 },
                    duration: 300,
                    onComplete: () => {
                        container.destroy();
                        this.blurryBackground.destroy();
                        this.pickItemPopup = null;
                        this.blurryBackground = null;
                        callback(item.id);
                    }
                });
            });

            container.add(itemImage);
        });

        const buttonWidth = 200;
        const buttonHeight = 50;
        const buttonX = this.scene.sys.game.config.width / 2;
        const buttonY = startY + rows * (desiredHeight + spacing) + 40;
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
                    this.pickItemPopup = null;
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
                    this.pickItemPopup = null;
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

        this.pickItemPopup = container;
    }
}
