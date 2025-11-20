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

        const showDiceResult = (diceRoll, modifier) => {
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
                const textDiceValue = this.add.text(
                    this.scale.width / 2, this.scale.height / 2,
                    modifier ? `${diceRoll + modifier} (${diceRoll} ${modifier > 0 ? '+' : '-'} ${Math.abs(modifier)})` : diceRoll,
                    {
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
        this.load.audio('punch', 'assets/sounds/effects/punch.mp3');
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
        this.punchSound = this.sound.add('punch', { volume: 0.6 });
    }

    executeAnimation() {
        this.executeSound.play();
        this.punchSound?.play();
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
        this.lobbyContainer = null; // Lobby UI container
        this.nameInputText = null; // Lobby name text reference
        this.itemUsageTrackers = new Map(); // Track item usage for visual effects
        this.endScreenButton = null; // CTA to move to the end screen
        this.endScreenButtonLabel = null; // Label for the end screen CTA
        this.endScreenCallback = null; // Callback when moving to the end screen
        this.endScreenReady = false; // True once final scores are available
        this.endScreenRequested = false; // True if player already asked to see the end screen
        this.pileStates = new Map(); // Track pile sizes/textures to trigger animations
        this.discardState = { length: 0, topTexture: null }; // Track discard pile for animation
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
        this.hpStates = new Map(); // Track previous HP per player for FX
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

    updateLobby(players, localPlayerId, options = {}) {
        const playerList = Array.isArray(players) ? players : [];
        const {
            hostId = playerList[0]?.id || '',
            minPlayersToStart = 1,
            maxPlayers = Math.max(playerList.length, minPlayersToStart),
            startModes = [],
            selectedMode,
            onStartMode,
            nameInput
        } = options;

        const width = this.scene.sys.game.config.width;
        const height = this.scene.sys.game.config.height;
        const isHost = hostId === localPlayerId;
        const hostName = playerList.find(p => p.id === hostId)?.name || 'l\'hôte';
        const missingPlayers = Math.max(0, minPlayersToStart - playerList.length);
        const readyToStart = missingPlayers === 0;

        this.clearPreviousDisplay();
        this.lobbyContainer = null;
        this.nameInputText = null;

        const container = this.scene.add.container(0, 0);
        container.setDepth(1);
        this.lobbyContainer = container;

        const panel = this.scene.add.graphics();
        panel.fillStyle(0x000000, 0.65);
        panel.fillRoundedRect(width * 0.1, height * 0.08, width * 0.8, height * 0.84, 18);
        container.add(panel);

        const title = this.scene.add.text(width / 2, 90, 'Salle d\'attente', {
            fontSize: '48px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(title);

        const playerCounter = this.scene.add.text(width / 2, 140, `Joueurs : ${playerList.length}/${maxPlayers} (min ${minPlayersToStart})`, {
            fontSize: '26px',
            fill: '#dddddd'
        }).setOrigin(0.5);
        container.add(playerCounter);

        const listStartY = 190;
        playerList.forEach((player, index) => {
            const isLocal = player.id === localPlayerId;
            const isPlayerHost = player.id === hostId;
            let suffix = '';
            if (isPlayerHost) suffix += ' (Host)';
            if (isLocal) suffix += suffix ? ' / Toi' : ' (Toi)';

            const playerText = this.scene.add.text(width / 2, listStartY + index * 32, `${player.name || `Joueur ${index + 1}`}${suffix}`, {
                fontSize: '24px',
                fill: isLocal ? '#00ffcc' : '#ffffff'
            }).setOrigin(0.5);
            container.add(playerText);
        });

        const statusMessage = isHost
            ? (readyToStart
                ? 'Tout est prêt. Choisis un mode pour lancer la partie.'
                : `Encore ${missingPlayers} joueur(s) nécessaires.`)
            : (readyToStart
                ? `En attente de ${hostName}...`
                : 'Patiente, la table se remplit.');

        let currentY = listStartY + playerList.length * 32 + 30;
        const statusText = this.scene.add.text(width / 2, currentY, statusMessage, {
            fontSize: '22px',
            fill: '#ffd369'
        }).setOrigin(0.5);
        container.add(statusText);

        currentY += 50;

        if (isHost && !readyToStart && options.onAddBot) {
            const addBotButton = this.scene.add.text(width / 2, currentY, "+ Ajouter un Bot", {
                fontSize: '20px',
                fill: '#00ff00',
                backgroundColor: '#333333',
                padding: { x: 10, y: 5 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            addBotButton.on('pointerdown', () => {
                console.log("Add bot button clicked");
                options.onAddBot();
            });
            container.add(addBotButton);
            currentY += 60;
        } else {
            currentY += 20;
        }

        if (startModes && startModes.length) {
            const buttonWidth = width * 0.45;
            const buttonHeight = 56;

            startModes.forEach((mode, index) => {
                const buttonY = currentY + index * 90;
                const isSelected = selectedMode === mode.key;
                const backgroundColor = isSelected ? 0x2f855a : 0x1f1f1f;
                const rect = this.scene.add.rectangle(width / 2, buttonY, buttonWidth, buttonHeight, backgroundColor, readyToStart && isHost ? 0.9 : 0.6);
                rect.setStrokeStyle(2, isSelected ? 0xffd369 : 0xffffff, isSelected ? 1 : 0.4);
                container.add(rect);

                const labelText = this.scene.add.text(width / 2, buttonY, isHost ? `Lancer ${mode.label}` : mode.label, {
                    fontSize: '26px',
                    fill: '#ffffff',
                    fontStyle: isSelected ? 'bold' : 'normal'
                }).setOrigin(0.5);
                container.add(labelText);

                let descriptionText = null;
                if (mode.description) {
                    descriptionText = this.scene.add.text(width / 2, buttonY + buttonHeight / 2 + 15, mode.description, {
                        fontSize: '18px',
                        fill: '#cccccc',
                        align: 'center'
                    }).setOrigin(0.5);
                    descriptionText.setWordWrapWidth(buttonWidth - 20);
                    container.add(descriptionText);
                }

                const canLaunch = isHost && readyToStart && typeof onStartMode === 'function';
                const handler = () => {
                    if (!canLaunch) return;
                    onStartMode(mode.key);
                };

                if (canLaunch) {
                    rect.setInteractive({ useHandCursor: true });
                    labelText.setInteractive({ useHandCursor: true });
                    rect.on('pointerdown', handler);
                    labelText.on('pointerdown', handler);
                    if (descriptionText) {
                        descriptionText.setInteractive({ useHandCursor: true });
                        descriptionText.on('pointerdown', handler);
                    }
                }
            });

            currentY += startModes.length * 90;
        }

        if (nameInput) {
            const displayValue = nameInput.value && nameInput.value.trim()
                ? nameInput.value.trim()
                : (nameInput.placeholder || 'Ton pseudo');

            const canvas = this.scene.sys.game.canvas;
            const bounds = canvas.getBoundingClientRect();
            const scaleX = bounds.width / width;
            const scaleY = bounds.height / height;

            const domX = bounds.left + (width / 2) * scaleX + window.scrollX;
            const domY = bounds.top + (height - 80) * scaleY + window.scrollY;

            this.createNameInput(domX, domY, displayValue, nameInput.placeholder, nameInput.onSubmit);
        }
    }

    createNameInput(x, y, value, placeholder, onSubmit) {
        if (this.nameInputDom) {
            this.nameInputDom.remove();
        }

        const input = document.createElement('input');
        input.type = 'text';
        input.value = value;
        input.placeholder = placeholder || "Ton pseudo";

        Object.assign(input.style, {
            position: 'absolute',
            left: `${x}px`,
            top: `${y}px`,
            transform: 'translate(-50%, -50%)',
            padding: '12px 24px',
            fontSize: '24px',
            fontFamily: '"Segoe UI", "Trebuchet MS", sans-serif',
            fontWeight: 'bold',
            color: '#ffffff',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
            textAlign: 'center',
            outline: 'none',
            width: '300px',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            zIndex: '1000'
        });

        input.onfocus = () => {
            input.style.borderColor = '#ffffff';
            input.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            input.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.2)';
        };

        input.onblur = () => {
            input.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            input.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
            input.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
            if (input.value !== value) {
                onSubmit(input.value);
            }
        };

        input.onkeydown = (e) => {
            if (e.key === 'Enter') {
                input.blur();
            }
        };

        document.body.appendChild(input);
        this.nameInputDom = input;

        const updatePosition = () => {
            if (!this.nameInputDom || !this.scene.sys.game.canvas) return;
            const width = this.scene.sys.game.config.width;
            const height = this.scene.sys.game.config.height;
            const canvas = this.scene.sys.game.canvas;
            const bounds = canvas.getBoundingClientRect();
            const scaleX = bounds.width / width;
            const scaleY = bounds.height / height;

            const domX = bounds.left + (width / 2) * scaleX + window.scrollX;
            const domY = bounds.top + (height - 80) * scaleY + window.scrollY;

            this.nameInputDom.style.left = `${domX}px`;
            this.nameInputDom.style.top = `${domY}px`;
        };

        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition);

        const originalRemove = input.remove.bind(input);
        input.remove = () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition);
            originalRemove();
        };
    }

    hideNameInput() {
        if (this.nameInputDom) {
            this.nameInputDom.remove();
            this.nameInputDom = null;
        }
        if (this.nameInputText) {
            this.nameInputText.destroy();
            this.nameInputText = null;
        }
        if (this.lobbyContainer) {
            this.lobbyContainer.destroy(true);
            this.lobbyContainer = null;
        }
    }

    updateDraftingUI(players, localPlayerId) {
        console.log("updateDraftingUI", players, localPlayerId);

        this.clearPreviousDisplay();
        players.forEach(player => {
            const position = this.getPlayerPositionAroundTable(player.id, localPlayerId, players);
            this.displayStuff(player.stuff, player.id === localPlayerId, position, player);
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
            child !== this.numberInputPopup &&
            child !== this.endScreenButton &&
            child !== this.endScreenButtonLabel
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

    getPlayerPositionAroundTable(playerId, localPlayerId, players) {
        if (playerId === localPlayerId) return 'bottom';
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

    showEndScreenPrompt(onProceed, ready = false) {
        this.endScreenCallback = onProceed;
        this.endScreenReady = ready;

        const width = this.scene.sys.game.config.width;
        const height = this.scene.sys.game.config.height;
        const buttonWidth = 360;
        const buttonHeight = 64;
        const x = width / 2;
        const y = height - 50;

        if (!this.endScreenButton) {
            const button = this.scene.add.rectangle(x, y, buttonWidth, buttonHeight, 0x000000, 0.65)
                .setStrokeStyle(2, 0xffffff)
                .setDepth(4)
                .setInteractive({ useHandCursor: ready });

            const label = this.scene.add.text(x, y, ready ? 'Passer a l\'ecran de fin' : 'Calcul des scores...', {
                fontSize: '24px',
                fill: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(4);

            button.on('pointerdown', () => {
                this.endScreenRequested = true;
                if (this.endScreenReady && this.endScreenCallback) {
                    const callback = this.endScreenCallback;
                    this.clearEndScreenPrompt();
                    callback();
                } else if (this.endScreenButtonLabel) {
                    this.endScreenButtonLabel.setText('Calcul des scores...');
                }
            });

            this.endScreenButton = button;
            this.endScreenButtonLabel = label;
        }

        this.endScreenButton.setPosition(x, y);
        this.endScreenButton.setFillStyle(0x000000, 0.65);
        this.endScreenButton.setStrokeStyle(2, ready ? 0x00ff88 : 0xffffff);
        this.endScreenButton.setInteractive({ useHandCursor: ready });
        this.endScreenButtonLabel.setPosition(x, y);
        this.endScreenButtonLabel.setText(ready ? 'Passer a l\'ecran de fin' : 'Calcul des scores...');

        if (this.endScreenReady && this.endScreenRequested && this.endScreenCallback) {
            const callback = this.endScreenCallback;
            this.clearEndScreenPrompt();
            callback();
        }
    }

    clearEndScreenPrompt() {
        if (this.endScreenButton) {
            this.endScreenButton.destroy();
            this.endScreenButton = null;
        }
        if (this.endScreenButtonLabel) {
            this.endScreenButtonLabel.destroy();
            this.endScreenButtonLabel = null;
        }
        this.endScreenCallback = null;
        this.endScreenReady = false;
        this.endScreenRequested = false;
    }

    updateGameUI(game, localPlayerId, options = {}) {
        console.log("updateGameUI", game, localPlayerId);
        const allowActions = options.allowActions !== false;
        this.clearPreviousDisplay();
        const players = game.players;
        players.forEach(player => {
            const position = this.getPlayerPositionAroundTable(player.id, localPlayerId, players);
            this.displayStuff(player.stuff, (player.id === localPlayerId), position, player, game);
            this.displayHP(player, (player.id === localPlayerId), position);
            this.displayMonstersPiles(player, (player.id === localPlayerId), position);
            if (player.dead) this.showDeathOverlay(player, this.getPlayerPositionAroundTable(player.id, localPlayerId, players));
            if (player.fled) this.showFledOverlay(player, this.getPlayerPositionAroundTable(player.id, localPlayerId, players));
        });
        this.displayCurrentCard(game, localPlayerId);
        this.displayDungeon(game, localPlayerId);
        this.displayDiscardPile(game);
        if (allowActions && game.isMyTurn(localPlayerId) && !game.isDiceRolling) {
            if (game.currentCard?.dungeonCardType === "monster") {
                this.addDamageButton(game);
                if (game.canExecute) this.addExecuteButton(game);
                if (game.currentCard?.specialUI && game.currentCard?.effect) this.addSpecialEffectButton(game, game.currentCard)
            } else if (game.currentCard?.dungeonCardType === "event") {
                if (game.currentCard.effect) this.addAcceptEventButton(game);
                if (game.currentCard.optional || !game.currentCard.effect) this.addDeclineEventButton(game);
            }
            if (game.canTryToEscape && game.dungeon.length) {
                this.addEscapeButton(game)
            }
            if (game.noCurrentCard() && game.dungeon.length && game.getCurrentPlayer().canPass)
                this.addPassTurnButton(game)
        }
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
                this.scene.tweens.add({
                    targets: cardSprite,
                    scaleX: scaleX * 3,
                    scaleY: scaleY * 3,
                    duration: 50,
                    ease: 'Sine.easeInOut'
                });
            });
            cardSprite.on('pointerout', () => {
                // cardSprite.setDepth(0);
                this.scene.tweens.add({
                    targets: cardSprite,
                    scaleX: scaleX,
                    scaleY: scaleY,
                    duration: 50,
                    ease: 'Sine.easeInOut',
                    onComplete: () => {
                        cardSprite.setDepth(0); // Reset the depth after the tween completes
                    }
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
            this.displayScoutInterface(player.defeatedMonstersPile);
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

    addDamageButton(game) {
        const t = game.currentCard.timesDealDamage;
        const buttonText = `Take ${(t > 1 ? t + "x" : "") + game.currentCard.damage} Damage`;
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


    addAcceptEventButton(game) {
        const t = game.currentCard.timesDealDamage;
        const buttonText = `Accept`;
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

        button.setData("type", "accept_event")
        // Handle the click event
        button.on('pointerdown', () => {
            console.log(`Player accepts event.`);
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
    addDeclineEventButton(game) {
        const buttonText = `Decline`;
        const buttonWidth = 200;
        const buttonHeight = 30;
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

        button.setData("type", "decline_event")
        // Handle the click event
        button.on('pointerdown', () => {
            console.log(`Player declines.`);
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

        let desiredWidth = 240;
        let desiredHeight = 336;
        let columns;

        if (items.length <= 4) {
            columns = items.length;
        } else if (items.length <= 12) {
            columns = 6;
            desiredWidth = 150;
            desiredHeight = 210;
        } else {
            columns = 10;
            desiredWidth = 100;
            desiredHeight = 140;
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

    addSpecialEffectButton(game, card) {
        const buttonText = {
            'KRAKEN': 'Put it back!',
            'GUARDIAN_ANGEL': 'Discard',
            'SHAPESHIFTER': 'Select type'
        }[card.effect] || 'Effect';

        const buttonWidth = 130;
        const buttonHeight = 50;
        const buttonX = this.scene.sys.game.config.width / 2;
        const buttonY = 100;
        const buttonRadius = 10; // For rounded corners

        // Create a graphics object to draw the button
        const graphics = this.scene.add.graphics();

        // Draw the rounded rectangle button
        graphics.fillStyle(0x99ccff, 1); // Lighter blue color
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

        button.setData("type", "special_effect");
        // Handle the click event
        button.on('pointerdown', () => {
            console.log(`Effect button clicked: ${buttonText}`);
            // Example: Trigger the effect or update the game state
        });

        // Set depths
        button.setDepth(0.1);
        graphics.setDepth(0.1);
        text.setDepth(0.1);

        // Add a hover effect to the button and text
        button.on('pointerover', () => {
            graphics.clear();
            graphics.fillStyle(0xb3d9ff, 1); // Lighter blue for hover
            graphics.fillRoundedRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, buttonRadius);
        });

        button.on('pointerout', () => {
            graphics.clear();
            graphics.fillStyle(0x99ccff, 1);
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


    updateEndUI(winner, finalPlayers, localPlayerId) {
        console.log("updateEndUI", winner, finalPlayers);
        this.clearEndScreenPrompt();

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
