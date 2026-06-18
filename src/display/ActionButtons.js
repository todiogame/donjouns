import Phaser from 'phaser';

export class ActionButtons {
    constructor(scene, displayManager) {
        this.scene = scene;
        this.displayManager = displayManager;
    }

    addDamageButton(game) {
        const t = game.currentCard.timesDealDamage;
        const buttonText = `Take ${(t > 1 ? t + "x" : "") + game.currentCard.damage} Damage`;
        const buttonWidth = 300;
        const buttonHeight = 50;
        const buttonX = this.scene.sys.game.config.width / 2;
        const buttonY = 550;
        // const buttonY = this.scene.sys.game.config.height / 2 - 50;
        const buttonRadius = 10; // For rounded corners

        // Create a graphics object to draw the button
        const graphics = this.scene.add.graphics();

        // Draw the rounded rectangle button
        graphics.fillStyle(0xffa500, 1);
        graphics.fillRoundedRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, buttonRadius);

        // Add the text on top of the button
        const text = this.scene.add.text(buttonX, buttonY, buttonText, {
            fontSize: '30px',
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
        const buttonWidth = 200;
        const buttonHeight = 50;
        const buttonX = this.scene.sys.game.config.width / 2;
        const buttonY = 620;
        // const buttonY = this.scene.sys.game.config.height / 2 - 50;
        const buttonRadius = 10; // For rounded corners

        // Create a graphics object to draw the button
        const graphics = this.scene.add.graphics();

        // Draw the rounded rectangle button
        graphics.fillStyle(0xff1100, 1);
        graphics.fillRoundedRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, buttonRadius);

        // Add the text on top of the button
        const text = this.scene.add.text(buttonX, buttonY, buttonText, {
            fontSize: '30px',
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
        const buttonWidth = 200;
        const buttonHeight = 60;
        const buttonX = this.scene.sys.game.config.width / 2;
        const buttonY = 150;
        // const buttonY = this.scene.sys.game.config.height / 2 - 50;
        const buttonRadius = 10; // For rounded corners

        // Create a graphics object to draw the button
        const graphics = this.scene.add.graphics();

        // Draw the rounded rectangle button
        graphics.fillStyle(0x3333ee, 1);
        graphics.fillRoundedRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, buttonRadius);

        // Add the text on top of the button
        const text = this.scene.add.text(buttonX, buttonY, buttonText, {
            fontSize: '30px',
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
        const buttonWidth = 300;
        const buttonHeight = 50;
        const buttonX = this.scene.sys.game.config.width / 2;
        const buttonY = 690;
        // const buttonY = this.scene.sys.game.config.height / 2 - 50;
        const buttonRadius = 10; // For rounded corners

        // Create a graphics object to draw the button
        const graphics = this.scene.add.graphics();

        // Draw the rounded rectangle button
        graphics.fillStyle(0x33ee33, 1);
        graphics.fillRoundedRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, buttonRadius);

        // Add the text on top of the button
        const text = this.scene.add.text(buttonX, buttonY, buttonText, {
            fontSize: '30px',
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
        const buttonWidth = 300;
        const buttonHeight = 50;
        const buttonX = this.scene.sys.game.config.width / 2;
        const buttonY = 550;
        // const buttonY = this.scene.sys.game.config.height / 2 - 50;
        const buttonRadius = 10; // For rounded corners

        // Create a graphics object to draw the button
        const graphics = this.scene.add.graphics();

        // Draw the rounded rectangle button
        graphics.fillStyle(0xffa500, 1);
        graphics.fillRoundedRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, buttonRadius);

        // Add the text on top of the button
        const text = this.scene.add.text(buttonX, buttonY, buttonText, {
            fontSize: '30px',
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
        const buttonWidth = 300;
        const buttonHeight = 50;
        const buttonX = this.scene.sys.game.config.width / 2;
        const buttonY = 620;
        // const buttonY = this.scene.sys.game.config.height / 2 - 50;
        const buttonRadius = 10; // For rounded corners

        // Create a graphics object to draw the button
        const graphics = this.scene.add.graphics();

        // Draw the rounded rectangle button
        graphics.fillStyle(0xffa500, 1);
        graphics.fillRoundedRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, buttonRadius);

        // Add the text on top of the button
        const text = this.scene.add.text(buttonX, buttonY, buttonText, {
            fontSize: '30px',
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

    addSpecialEffectButton(game, card) {
        const buttonText = {
            'KRAKEN': 'Put it back!',
            'GUARDIAN_ANGEL': 'Discard',
            'SHAPESHIFTER': 'Select type'
        }[card.effect] || 'Effect';

        const buttonWidth = 200;
        const buttonHeight = 60;
        const buttonX = this.scene.sys.game.config.width / 2;
        const buttonY = 150;
        const buttonRadius = 10; // For rounded corners

        // Create a graphics object to draw the button
        const graphics = this.scene.add.graphics();

        // Draw the rounded rectangle button
        graphics.fillStyle(0x99ccff, 1); // Lighter blue color
        graphics.fillRoundedRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, buttonRadius);

        // Add the text on top of the button
        const text = this.scene.add.text(buttonX, buttonY, buttonText, {
            fontSize: '30px',
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

    addLogButton(game) {
        const buttonWidth = 130;
        const buttonHeight = 44;
        const buttonX = this.scene.sys.game.config.width - 92;
        const buttonY = 48;
        const buttonRadius = 8;

        const graphics = this.scene.add.graphics().setDepth(2);
        graphics.fillStyle(0x111111, 0.82);
        graphics.lineStyle(2, 0xffd24a, 0.95);
        graphics.fillRoundedRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, buttonRadius);
        graphics.strokeRoundedRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, buttonRadius);

        const text = this.scene.add.text(buttonX, buttonY, 'Log', {
            fontSize: '24px',
            fill: '#fff4a8',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2.1);

        const button = this.scene.add.zone(buttonX, buttonY, buttonWidth, buttonHeight)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .setDepth(2.2);

        button.on('pointerdown', () => {
            this.displayManager.displayLogModal(game.logs || []);
        });

        button.on('pointerover', () => {
            graphics.clear();
            graphics.fillStyle(0x2a2410, 0.92);
            graphics.lineStyle(2, 0xffe680, 1);
            graphics.fillRoundedRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, buttonRadius);
            graphics.strokeRoundedRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, buttonRadius);
        });

        button.on('pointerout', () => {
            graphics.clear();
            graphics.fillStyle(0x111111, 0.82);
            graphics.lineStyle(2, 0xffd24a, 0.95);
            graphics.fillRoundedRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, buttonRadius);
            graphics.strokeRoundedRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, buttonRadius);
        });
    }
}
