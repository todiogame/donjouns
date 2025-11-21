import Phaser from 'phaser';

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
