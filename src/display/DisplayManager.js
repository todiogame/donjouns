import { LobbyManager } from './LobbyManager';
import { GameInterface } from './GameInterface';
import { PopupManager } from './PopupManager';
import { ActionButtons } from './ActionButtons';

export class DisplayManager {
    constructor(scene) {
        this.scene = scene;
        this.lobbyManager = new LobbyManager(scene, this);
        this.gameInterface = new GameInterface(scene, this);
        this.popupManager = new PopupManager(scene, this);
        this.actionButtons = new ActionButtons(scene, this);

        this.backgroundContainer = null;
        this.volumeControl = null;

        this.endScreenButton = null;
        this.endScreenButtonLabel = null;
        this.endScreenCallback = null;
        this.endScreenReady = false;
        this.endScreenRequested = false;

        // Keep backward-compatible access to the zoomed card from the root manager
        Object.defineProperty(this, 'zoomedItemCard', {
            get: () => this.gameInterface.zoomedItemCard,
            set: (value) => {
                this.gameInterface.zoomedItemCard = value;
            }
        });
    }

    displayTitle(message, duration, onComplete) {
        const titleScene = this.scene.scene?.get('TitleScene');
        titleScene?.displayTitle(message, duration, onComplete);
    }

    displayDice(position) {
        const diceScene = this.scene.scene?.get('DiceScene');
        diceScene?.startDiceAnimation(position);
    }

    initializeBackground() {
        if (this.backgroundContainer) {
            this.backgroundContainer.destroy();
            this.backgroundContainer = null;
        }

        const container = this.scene.add.container(0, 0);
        const background = this.scene.add.image(0, 0, 'background');
        background.setOrigin(0, 0);
        background.displayWidth = this.scene.sys.game.config.width;
        background.displayHeight = this.scene.sys.game.config.height;
        container.add(background);
        container.setDepth(-100);
        this.backgroundContainer = container;
        this.createVolumeControl();
    }

    createVolumeControl() {
        const inputId = 'donjouns-volume-control';
        const existing = document.getElementById(inputId);
        if (existing) {
            existing.remove();
        }

        const input = document.createElement('input');
        input.type = 'range';
        input.id = inputId;
        input.min = '0';
        input.max = this.scene.sound.volume.toString();
        input.step = '0.01';
        input.value = this.scene.sound.volume.toString();

        Object.assign(input.style, {
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            zIndex: '1000',
            width: '100px',
            cursor: 'pointer'
        });

        input.addEventListener('input', (e) => {
            this.scene.sound.volume = parseFloat(e.target.value);
        });

        document.body.appendChild(input);
        this.volumeControl = input;
    }

    updateLobby(players, localPlayerId, options = {}) {
        this.lobbyManager.updateLobby(players, localPlayerId, options);
    }

    createNameInput(x, y, value, placeholder, onSubmit) {
        this.lobbyManager.createNameInput(x, y, value, placeholder, onSubmit);
    }

    hideNameInput() {
        this.lobbyManager.hideNameInput();
    }

    updateDraftingUI(players, localPlayerId) {
        this.clearPreviousDisplay();
        players.forEach(player => {
            const position = this.getPlayerPositionAroundTable(player.id, localPlayerId, players);
            this.gameInterface.displayStuff(player.stuff, player.id === localPlayerId, position, player);
        });
        const localPlayer = players.find(p => p.id === localPlayerId);
        if (localPlayer?.hand) {
            this.gameInterface.displayHand(localPlayer.hand);
        }
    }

    clearPreviousDisplay() {
        this.gameInterface.hideHoveredCardPreview();

        const safeNodes = new Set([
            this.backgroundContainer,
            this.gameInterface.zoomedItemCard,
            this.gameInterface.blurryBackground,
            this.popupManager?.blurryBackground,
            this.popupManager?.scoutPopup,
            this.popupManager?.numberInputPopup,
            this.popupManager?.creatureSelectionPopup,
            this.popupManager?.pickItemPopup,
            this.endScreenButton,
            this.endScreenButtonLabel
        ].filter(Boolean));

        const childrenToRemove = this.scene.children.list.filter(child => !safeNodes.has(child));
        while (childrenToRemove.length > 0) {
            const child = childrenToRemove.pop();
            if (child?.input) {
                child.removeInteractive();
            }
            child?.destroy();
        }
    }

    addShiningEffect(text) {
        this.gameInterface.addShiningEffect(text);
    }

    getPlayerPositionAroundTable(playerId, localPlayerId, players) {
        const playerIndex = players.findIndex(p => p.id === playerId);
        const localPlayerIndex = players.findIndex(p => p.id === localPlayerId);
        const totalPlayers = players.length;

        if (playerIndex === -1 || localPlayerIndex === -1) return 'unknown';

        const relativeIndex = (playerIndex - localPlayerIndex + totalPlayers) % totalPlayers;

        if (relativeIndex === 0) return 'bottom';
        if (totalPlayers === 2) return 'top-right';
        if (totalPlayers === 3) {
            if (relativeIndex === 1) return 'top-left';
            if (relativeIndex === 2) return 'top-right';
        }
        if (totalPlayers === 4) {
            if (relativeIndex === 1) return 'top-left';
            if (relativeIndex === 2) return 'top-right';
            if (relativeIndex === 3) return 'top-right';
        }

        return 'top-right';
    }

    zoomCard(cardImage) {
        this.gameInterface.zoomCard(cardImage);
    }

    closeZoom() {
        this.gameInterface.closeZoom();
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
        const allowActions = options.allowActions !== false;
        this.clearPreviousDisplay();
        const players = game.players;
        players.forEach(player => {
            const position = this.getPlayerPositionAroundTable(player.id, localPlayerId, players);
            const isLocalPlayer = player.id === localPlayerId;
            this.gameInterface.displayStuff(player.stuff, isLocalPlayer, position, player, game);
            this.gameInterface.displayHP(player, isLocalPlayer, position);
            this.gameInterface.displayMonstersPiles(player, isLocalPlayer, position);
            if (player.dead) this.gameInterface.showDeathOverlay(player, position);
            if (player.fled) this.gameInterface.showFledOverlay(player, position);
        });
        this.gameInterface.displayCurrentCard(game);
        this.gameInterface.displayDungeon(game, localPlayerId);
        this.gameInterface.displayDiscardPile(game);

        if (allowActions && game.isMyTurn(localPlayerId) && !game.isDiceRolling) {
            if (game.currentCard?.dungeonCardType === 'monster') {
                this.actionButtons.addDamageButton(game);
                if (game.canExecute) this.actionButtons.addExecuteButton(game);
                if (game.currentCard?.specialUI && game.currentCard?.effect) {
                    this.actionButtons.addSpecialEffectButton(game, game.currentCard);
                }
            } else if (game.currentCard?.dungeonCardType === 'event') {
                if (game.currentCard.effect) this.actionButtons.addAcceptEventButton(game);
                if (game.currentCard.optional || !game.currentCard.effect) this.actionButtons.addDeclineEventButton(game);
            }
            if (game.canTryToEscape && game.dungeon.length) {
                this.actionButtons.addEscapeButton(game);
            }
            if (game.noCurrentCard() && game.dungeon.length && game.getCurrentPlayer().canPass) {
                this.actionButtons.addPassTurnButton(game);
            }
        }
    }

    displayCurrentCard(game) {
        this.gameInterface.displayCurrentCard(game);
    }

    displayDungeon(game, localPlayerId) {
        this.gameInterface.displayDungeon(game, localPlayerId);
    }

    animateCard(card) {
        this.gameInterface.animateCard(card);
    }

    showHoveredCardPreview(cardSprite, zoomFactor) {
        this.gameInterface.showHoveredCardPreview(cardSprite, zoomFactor);
    }

    hideHoveredCardPreview() {
        this.gameInterface.hideHoveredCardPreview();
    }

    displayDiscardPile(game) {
        this.gameInterface.displayDiscardPile(game);
    }

    displayStuff(stuff, isPlayer, position, player, game) {
        this.gameInterface.displayStuff(stuff, isPlayer, position, player, game);
    }

    displayMyStuff(stuff, playerName, maxItemsPerRow, defaultWidth, defaultHeight, hoverScaleX, hoverScaleY, game, player) {
        this.gameInterface.displayMyStuff(stuff, playerName, maxItemsPerRow, defaultWidth, defaultHeight, hoverScaleX, hoverScaleY, game, player);
    }

    displayHP(player, isPlayer, position) {
        this.gameInterface.displayHP(player, isPlayer, position);
    }

    displayMonstersPiles(player, isPlayer, position) {
        this.gameInterface.displayMonstersPiles(player, isPlayer, position);
    }

    animateMonsterToPile(texture, targetPosition, targetScale) {
        this.gameInterface.animateMonsterToPile(texture, targetPosition, targetScale);
    }

    animatePileToDungeon(texture, startPosition, startScale) {
        this.gameInterface.animatePileToDungeon(texture, startPosition, startScale);
    }

    animateCardToDiscard(texture, targetPosition, targetScale) {
        this.gameInterface.animateCardToDiscard(texture, targetPosition, targetScale);
    }

    addDamageButton(game) {
        this.actionButtons.addDamageButton(game);
    }

    addExecuteButton(game) {
        this.actionButtons.addExecuteButton(game);
    }

    addPassTurnButton(game) {
        this.actionButtons.addPassTurnButton(game);
    }

    addEscapeButton(game) {
        this.actionButtons.addEscapeButton(game);
    }

    addAcceptEventButton(game) {
        this.actionButtons.addAcceptEventButton(game);
    }

    addDeclineEventButton(game) {
        this.actionButtons.addDeclineEventButton(game);
    }

    addSpecialEffectButton(game, card) {
        this.actionButtons.addSpecialEffectButton(game, card);
    }

    displayScoutInterface(cards, onPickCard) {
        this.popupManager.displayScoutInterface(cards, onPickCard);
    }

    createPopupBackground(depth) {
        return this.popupManager.createPopupBackground(depth);
    }

    createButton(container, x, y, text, onClick, bgColor) {
        this.popupManager.createButton(container, x, y, text, onClick, bgColor);
    }

    createNumberButtons(container, startX, startY, onClick) {
        this.popupManager.createNumberButtons(container, startX, startY, onClick);
    }

    displayNumberInputInterface(item, onNumberSelected) {
        this.popupManager.displayNumberInputInterface(item, onNumberSelected);
    }

    showManualNumberInput(onNumberSelected, container, bg, interactionBlocker) {
        this.popupManager.showManualNumberInput(onNumberSelected, container, bg, interactionBlocker);
    }

    displayMonsterTypeSelectionInterface(item, onMonsterTypeSelected) {
        this.popupManager.displayMonsterTypeSelectionInterface(item, onMonsterTypeSelected);
    }

    createButtonMonsterTypePopup(container, x, y, label, callback, color) {
        this.popupManager.createButtonMonsterTypePopup(container, x, y, label, callback, color);
    }

    createPopupBackgroundMonsterTypePopup(depth) {
        return this.popupManager.createPopupBackgroundMonsterTypePopup(depth);
    }

    displayPickItemInterface(cardGame, localPlayerId, condition, callback, isPlayerItems) {
        this.popupManager.displayPickItemInterface(cardGame, localPlayerId, condition, callback, isPlayerItems);
    }

    showOverlay(color, message, playerPosition, player) {
        this.gameInterface.showOverlay(color, message, playerPosition, player);
    }

    showDeathOverlay(player, playerPosition) {
        this.gameInterface.showDeathOverlay(player, playerPosition);
    }

    showFledOverlay(player, playerPosition) {
        this.gameInterface.showFledOverlay(player, playerPosition);
    }

    updateEndUI(winner, finalPlayers, localPlayerId) {
        this.clearEndScreenPrompt();
        this.clearPreviousDisplay();

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

        let yPos = 200;
        finalPlayers.forEach((player, index) => {
            const isLocalPlayer = player.id === localPlayerId;
            const playerText = `#${index + 1} - ${player.name} : ${player.score} points, ${player.defeatedMonstersPile.length} monstres tues ${player.id === winner?.id ? '??' : ''}`;
            const playerDisplay = this.scene.add.text(this.scene.cameras.main.centerX, yPos, playerText, {
                fontSize: '32px',
                fill: isLocalPlayer ? '#00ff00' : '#ffffff',
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
