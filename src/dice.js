export  const createDice = (x, y, scene, duration = 1000) => {

    let diceIsRolling = false;
    let stopDiceAnimation;

    const dice = scene.add.mesh(x, y, "dice-albedo");
    const shadowFX = dice.postFX.addShadow(0, 0, 0.006, 2, 0x111111, 10, .8);

    dice.addVerticesFromObj("dice-obj", 0.25);
    dice.panZ(6);

    dice.modelRotation.x = Phaser.Math.DegToRad(0);
    dice.modelRotation.y = Phaser.Math.DegToRad(-90);

    const startDiceAnimation = () => {
        if (!diceIsRolling) {
            diceIsRolling = true;

            // Shadow animation
            scene.add.tween({
                targets: shadowFX,
                x: -8,
                y: 10,
                duration: duration - 250,
                ease: "Sine.easeInOut",
                yoyo: true,
            });

            // Dice rotation animation
            const diceTween = scene.add.tween({
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

    const showDiceResult = (diceRoll) => {
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
        }
    };

    return {
        startDiceAnimation,
        showDiceResult
    };
}
