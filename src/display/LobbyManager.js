export class LobbyManager {
    constructor(scene, displayManager) {
        this.scene = scene;
        this.displayManager = displayManager;
        this.lobbyContainer = null;
        this.nameInputText = null;
        this.nameInputDom = null;
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
        const hostPlayer = playerList.find(p => p.id === hostId);
        const hostName = hostPlayer ? this.displayManager.formatPlayerName(hostPlayer) : "l'hôte";
        const missingPlayers = Math.max(0, minPlayersToStart - playerList.length);
        const readyToStart = missingPlayers === 0;

        this.displayManager.clearPreviousDisplay();
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

            const displayName = this.displayManager.formatPlayerName(player);
            const playerText = this.scene.add.text(width / 2, listStartY + index * 32, `${displayName}${suffix}`, {
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
}
