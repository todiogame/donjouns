import { TitleScene } from './display';
import { DiceScene } from './display';
import { AnimScene } from './display';
export function preload() {
    console.log('Preloading assets...');
    // Preload the loading screen background first
    this.load.image('preload_background', 'assets/pics/ui/splash.jpg');

    // Ensure this image is loaded before creating loading screen
    this.load.once('filecomplete-image-preload_background', () => {
        // Add a loading screen background
        this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'preload_background')
            .setDepth(0).setDisplaySize(this.cameras.main.width, this.cameras.main.height);

        // Create a loading bar
        let progressBar = this.add.graphics();
        let progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(this.cameras.main.centerX - 160, this.cameras.main.centerY + 120, 320, 50);

        // Display loading progress
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(this.cameras.main.centerX - 150, this.cameras.main.centerY + 130, 300 * value, 30);
        });

        // Cleanup on complete
        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
        });


        // Assets to load
        this.load.image('preload_background', 'assets/pics/ui/splash.jpg');
        console.log('Preloading assets...');
        this.load.image('background', 'assets/pics/ui/wood.jpg');
        this.load.image('heart', 'assets/pics/ui/heart.png');
        // this.load.image('medal', 'assets/pics/ui/medal.png');
        // this.load.image('damage', 'assets/pics/ui/damage.png');



        this.load.image("dice-albedo", "assets/obj/dice/dice-albedo.jpg");
        this.load.obj("dice-obj", "assets/obj/dice/dice.obj");

        for (let i = 0; i <= 100; i++) {
            const formattedNumber = String(i).padStart(3, '0'); // Ensure numbers are three digits
            this.load.image('items_' + formattedNumber, `assets/pics/items/items_${formattedNumber}.jpg`);
        }
        this.load.image('back_dungeon', `assets/pics/cardbacks/back_dungeon.jpg`);

        for (let i = 1; i <= 46; i++) {
            const formattedNumber = String(i).padStart(2, '0');
            this.load.image('monster_' + formattedNumber, `assets/pics/monsters/monster_${formattedNumber}.jpg`);
        }
        for (let i = 1; i <= 10; i++) {
            const formattedNumber = String(i).padStart(2, '0');
            this.load.image('event_1' + formattedNumber, `assets/pics/events/event_${formattedNumber}.jpg`);
        }



        this.load.audio('playcard', 'assets/sounds/effects/playcard.wav');
        this.load.audio('draw', 'assets/sounds/effects/draw.wav');
        this.load.audio('shuffle', 'assets/sounds/effects/shuffle.wav');
        this.load.audio('rolldie', 'assets/sounds/effects/rolldie.wav');


        // Add the TitleScene
        this.scene.add('TitleScene', TitleScene, true);

        this.scene.add('DiceScene', DiceScene, true);
        this.scene.add('AnimScene', AnimScene, true);
    })
}