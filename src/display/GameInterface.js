import Phaser from 'phaser';

export class GameInterface {
    constructor(scene, displayManager) {
        this.scene = scene;
        this.displayManager = displayManager;
        this.zoomedItemCard = null;
        this.blurryBackground = null;
        this.hoveredCardPreview = null;
        this.itemUsageTrackers = new Map();
        this.pileStates = new Map();
        this.discardState = { length: 0, topTexture: null };
        this.currentCardDisplayInfo = {
            x: 650,
            y: 100,
            scaleX: 125 / 750,
            scaleY: 175 / 1050
        };
        this.dungeonDisplayInfo = {
            x: 500,
            y: 100,
            scaleX: 125 / 750,
            scaleY: 175 / 1050
        };
        this.hpStates = new Map();
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

    displayStuff(stuff, isPlayer, position, player, game) {
        const playerName = this.displayManager.formatPlayerName(player);
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
            this.displayMyStuff(stuff, playerName, maxItemsPerRow, defaultWidth, defaultHeight, hoverScaleX, hoverScaleY, game, player);
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

                    // Handle usage visual effect
                    if (!this.itemUsageTrackers.has(itemCard.id)) {
                        this.itemUsageTrackers.set(itemCard.id, { count: itemCard.usageCounter, endTime: 0 });
                    }
                    const tracker = this.itemUsageTrackers.get(itemCard.id);
                    if (itemCard.usageCounter > tracker.count) {
                        tracker.count = itemCard.usageCounter;
                        tracker.endTime = Date.now() + 1000;
                    }

                    if (Date.now() < tracker.endTime) {
                        const glow = itemCardImage.preFX.addGlow(0xff0000);
                        this.scene.time.delayedCall(tracker.endTime - Date.now(), () => {
                            if (itemCardImage.active) {
                                itemCardImage.preFX.remove(glow);
                            }
                        });
                    }

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

    displayMyStuff(stuff, playerName, maxItemsPerRow, defaultWidth, defaultHeight, hoverScaleX, hoverScaleY, game, player) {
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

                const isActivatable = game && game.isMyTurn(player.id) && itemCard.canBeUsed;
                // console.log(`Item ${itemCard.title}: canBeUsed=${itemCard.canBeUsed}, isActivatable=${isActivatable}`);

                itemCardImage = this.scene.add.image(xPosition, yPosition, itemCard.texture)
                    .setOrigin(0.5, 0.5)
                    .setScale(actualScaleX, actualScaleY)
                    .setInteractive({ useHandCursor: isActivatable, pixelPerfect: true, alphaTolerance: 1 });

                if (isActivatable) {
                    itemCardImage.preFX.addGlow(0x00ff00);
                }

                if (itemCard.broken) {
                    itemCardImage.setRotation(Math.PI / 2);
                    itemCardImage.setDepth(-2);
                    const overlay = this.scene.add.rectangle(xPosition, yPosition, actualWidth, actualHeight, 0x444444, 0.3)
                        .setOrigin(0.5, 0.5)
                        .setRotation(Math.PI / 2)
                        .setDepth(-1);
                    itemCardImage.setData('overlay', overlay);
                    itemCardImage.setData("broken", itemCard.broken);
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

        const hpText = this.scene.add.text(xPosition, yPosition, hp, {
            fontSize: '40px',
            fill: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0.5);
        const prevHp = this.hpStates.get(player.id);
        if (prevHp !== undefined && hp < prevHp) {
            const lost = prevHp - hp;
            const dmgText = this.scene.add.text(xPosition, yPosition - 10, `-${lost}`, {
                fontSize: '42px',
                fill: '#ff4444',
                fontStyle: 'bold'
            }).setOrigin(0.5, 0.5)
                .setDepth(3);

            this.scene.tweens.add({
                targets: dmgText,
                y: yPosition - 60,
                alpha: 0,
                scaleX: 1.35,
                scaleY: 1.35,
                duration: 450,
                ease: 'Back.easeOut',
                onComplete: () => dmgText.destroy()
            });

            const burst = this.scene.add.circle(xPosition, yPosition, desiredWidth * 0.5, 0xff4444, 0.35).setDepth(0.5);
            this.scene.tweens.add({
                targets: burst,
                scale: 1.8,
                alpha: 0,
                duration: 300,
                ease: 'Cubic.easeOut',
                onComplete: () => burst.destroy()
            });

            heartImage.setTint(0xff2222);
            if (hpText?.active) hpText.setColor('#ffdddd');
            this.scene.tweens.add({
                targets: [heartImage, hpText],
                scaleX: scaleX * 1.4,
                scaleY: scaleY * 1.4,
                duration: 160,
                yoyo: true,
                repeat: 0,
                ease: 'Back.Out',
                onComplete: () => {
                    if (heartImage?.active) heartImage.clearTint();
                    if (hpText?.active) hpText.setColor('#ffffff');
                }
            });

            this.scene.sound?.play?.('punch', { volume: 0.7 });
        } else if (prevHp !== undefined && hp > prevHp) {
            const gained = hp - prevHp;
            const healText = this.scene.add.text(xPosition, yPosition - 10, `+${gained}`, {
                fontSize: '42px',
                fill: '#66ff99',
                fontStyle: 'bold'
            }).setOrigin(0.5, 0.5)
                .setDepth(3);

            this.scene.tweens.add({
                targets: healText,
                y: yPosition - 70,
                alpha: 0,
                scaleX: 1.25,
                scaleY: 1.25,
                duration: 500,
                ease: 'Cubic.easeOut',
                onComplete: () => healText.destroy()
            });

            const glow = this.scene.add.circle(xPosition, yPosition, desiredWidth * 0.45, 0x66ff99, 0.25).setDepth(0.5);
            this.scene.tweens.add({
                targets: glow,
                scale: 1.7,
                alpha: 0,
                duration: 400,
                ease: 'Cubic.easeOut',
                onComplete: () => glow.destroy()
            });

            this.scene.sound?.play?.('healing-magic', { volume: 0.8 });
        }
        this.hpStates.set(player.id, hp);
    }

    displayMonstersPiles(player, isPlayer, position) {
        const pileLength = player.defeatedMonstersPile.length;
        const topMonster = pileLength ? player.defeatedMonstersPile[pileLength - 1] : null;
        const pileTexture = topMonster?.texture || 'back_dungeon';
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

        const monsterPileImage = this.scene.add.image(xPosition, yPosition, pileTexture)
            .setOrigin(0.5, 0.5)
            .setScale(scaleX, scaleY);

        this.scene.add.text(xPosition, yPosition, pileLength, {
            fontSize: '40px',
            fill: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0.5);

        const prevState = this.pileStates.get(player.id) || { length: 0, topTexture: null };
        const hasNewCard = pileLength && (pileLength > prevState.length || topMonster?.texture !== prevState.topTexture);
        const hasRemovedCard = prevState.length > pileLength && prevState.topTexture;
        if (hasNewCard && topMonster?.texture) {
            this.animateMonsterToPile(
                topMonster.texture,
                { x: xPosition, y: yPosition },
                { scaleX, scaleY }
            );
        } else if (hasRemovedCard) {
            this.animatePileToDungeon(
                prevState.topTexture,
                { x: xPosition, y: yPosition },
                { scaleX, scaleY }
            );
        }
        this.pileStates.set(player.id, { length: pileLength, topTexture: topMonster?.texture || null });


        monsterPileImage.setInteractive({ useHandCursor: true });
        monsterPileImage.on('pointerdown', () => {
            this.displayManager.popupManager.displayScoutInterface(player.defeatedMonstersPile);
        });
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
            this.currentCardDisplayInfo = {
                x: cardSprite.x,
                y: cardSprite.y + desiredHeight / 2,
                scaleX,
                scaleY
            };

            // Add hover effect with smooth transition
            cardSprite.on('pointerover', () => {
                cardSprite.setDepth(1);
                // Show a separate enlarged preview so pointerout triggers when leaving the original card hitbox
                this.showHoveredCardPreview(cardSprite, 3);
            });
            cardSprite.on('pointerout', () => {
                this.hideHoveredCardPreview();
                cardSprite.setDepth(0);
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
            this.dungeonDisplayInfo = {
                x: cardSprite.x,
                y: cardSprite.y,
                scaleX,
                scaleY
            };
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

    showHoveredCardPreview(cardSprite, zoomFactor = 3) {
        this.hideHoveredCardPreview();
        const preview = this.scene.add.image(cardSprite.x, cardSprite.y, cardSprite.texture.key)
            .setOrigin(cardSprite.originX, cardSprite.originY)
            .setRotation(cardSprite.rotation)
            .setDepth(5)
            .setScale(cardSprite.scaleX, cardSprite.scaleY); // start at base size

        this.scene.tweens.add({
            targets: preview,
            scaleX: cardSprite.scaleX * zoomFactor,
            scaleY: cardSprite.scaleY * zoomFactor,
            duration: 80,
            ease: 'Sine.easeOut'
        });

        this.hoveredCardPreview = preview;
    }

    hideHoveredCardPreview() {
        if (this.hoveredCardPreview) {
            this.hoveredCardPreview.destroy();
            this.hoveredCardPreview = null;
        }
    }

    displayDiscardPile(game) {
        const desiredWidth = 125;
        const desiredHeight = 175;
        const scaleX = desiredWidth / 750;
        const scaleY = desiredHeight / 1050;
        const numCards = game.discardPile.length;
        const topCard = numCards ? game.discardPile[numCards - 1] : null;
        const pileTexture = topCard?.texture || "back_dungeon";
        let cardSprite;

        // Base stack (light stagger)
        for (let i = 0; i < Math.min(numCards, 3); i++) {
            cardSprite = this.scene.add.image(800 + 0.5 * i, 100 - 0.5 * i, pileTexture)
                .setOrigin(0.5, 0.5)
                .setRotation(((i * 7 % 12) - 6) * 0.002 * Math.PI)
                .setScale(scaleX, scaleY)
                .setTint(0x777777);
        }
        if (!cardSprite) {
            cardSprite = this.scene.add.image(800, 100, pileTexture)
                .setOrigin(0.5, 0.5)
                .setScale(scaleX, scaleY)
                .setTint(0x777777);
        }

        // Overlay to keep greyed look
        this.scene.add.rectangle(800, 100, desiredWidth, desiredHeight, 0x808080, 0.35).setOrigin(0.5, 0.5);
        this.scene.add.text(800, 100, 'DISCARD', { fontSize: '16px', color: '#FFFFFF' })
            .setOrigin(0.5, 0.5);

        // Animate arrival on new discard
        const prevState = this.discardState || { length: 0, topTexture: null };
        const hasNewCard = numCards && (numCards > prevState.length || topCard?.texture !== prevState.topTexture);
        if (hasNewCard && topCard?.texture) {
            this.animateCardToDiscard(
                topCard.texture,
                { x: 800, y: 100 },
                { scaleX, scaleY }
            );
        }
        this.discardState = { length: numCards, topTexture: topCard?.texture || null };

        cardSprite.setInteractive({ useHandCursor: true });
        cardSprite.on('pointerdown', () => {
            this.displayManager.popupManager.displayScoutInterface(game.discardPile);
        });
    }

    animateMonsterToPile(texture, targetPosition, targetScale) {
        const startInfo = this.currentCardDisplayInfo || { x: 650, y: 100, scaleX: 125 / 750, scaleY: 175 / 1050 };
        const sprite = this.scene.add.image(startInfo.x, startInfo.y, texture)
            .setOrigin(0.5, 0.5)
            .setScale(startInfo.scaleX, startInfo.scaleY)
            .setDepth(5);

        this.scene.tweens.add({
            targets: sprite,
            x: targetPosition.x,
            y: targetPosition.y,
            scaleX: targetScale.scaleX,
            scaleY: targetScale.scaleY,
            angle: Phaser.Math.Between(-10, 10),
            duration: 450,
            ease: 'Cubic.easeInOut',
            onComplete: () => sprite.destroy()
        });
    }

    animatePileToDungeon(texture, startPosition, startScale) {
        const target = this.dungeonDisplayInfo || { x: 500, y: 100, scaleX: 125 / 750, scaleY: 175 / 1050 };
        const sprite = this.scene.add.image(startPosition.x, startPosition.y, texture)
            .setOrigin(0.5, 0.5)
            .setScale(startScale.scaleX, startScale.scaleY)
            .setDepth(5);

        this.scene.tweens.add({
            targets: sprite,
            x: target.x,
            y: target.y,
            scaleX: target.scaleX,
            scaleY: target.scaleY,
            angle: Phaser.Math.Between(-10, 10),
            duration: 450,
            ease: 'Cubic.easeInOut',
            onComplete: () => sprite.destroy()
        });
    }

    animateCardToDiscard(texture, targetPosition, targetScale) {
        const startInfo = this.currentCardDisplayInfo || { x: 650, y: 100, scaleX: 125 / 750, scaleY: 175 / 1050 };
        const sprite = this.scene.add.image(startInfo.x, startInfo.y, texture)
            .setOrigin(0.5, 0.5)
            .setScale(startInfo.scaleX, startInfo.scaleY)
            .setTint(0x777777)
            .setDepth(5);

        this.scene.tweens.add({
            targets: sprite,
            x: targetPosition.x,
            y: targetPosition.y,
            scaleX: targetScale.scaleX,
            scaleY: targetScale.scaleY,
            angle: Phaser.Math.Between(-10, 10),
            duration: 450,
            ease: 'Cubic.easeInOut',
            onComplete: () => sprite.destroy()
        });
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

    showOverlay(color, message, playerPosition, player) {
        const { width, height } = this.scene.sys.game.config;
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(color, 0.5);

        let overlay, textX, textY, scoreTextY;

        if (playerPosition === 'bottom') {
            overlay = graphics.fillRect(0, height / 2, width, height / 2);
            textX = width / 2;
            textY = height / 2 + 100;
            scoreTextY = textY + 50;
        } else if (playerPosition === 'top-left') {
            overlay = graphics.fillRect(0, 0, width / 3, height / 3 + 20);
            textX = width / 7;
            textY = height / 5;
            scoreTextY = textY + 50;
        } else if (playerPosition === 'top-right') {
            overlay = graphics.fillRect(width * 2 / 3, 0, width / 3, height / 3 + 20);
            textX = width * 6 / 7;
            textY = height / 4;
            scoreTextY = textY + 50;
        }

        const text = this.scene.add.text(textX, textY, message, {
            fontSize: '48px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0.5);

        const scoreText = this.scene.add.text(textX, scoreTextY, `Score: ${player.score}${player.stuff.some(i => i.key == "monkey") ? "+🐵" : ""}`, {
            fontSize: '36px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0.5);

        graphics.setDepth(3);
        text.setDepth(3);
        scoreText.setDepth(3);
    }

    showDeathOverlay(player, playerPosition = 'bottom') {
        this.showOverlay(0x808080, playerPosition == 'bottom' ? 'You died' : 'Player died', playerPosition, player);
    }

    showFledOverlay(player, playerPosition = 'bottom') {
        this.showOverlay(0x006400, playerPosition == 'bottom' ? 'You fled' : 'Player fled', playerPosition, player);
    }
}
