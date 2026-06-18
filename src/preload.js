import { TitleScene } from './display';
import { DiceScene } from './display';
import { AnimScene } from './display';

export function preload() {
    console.log('Preloading assets...');

    this.load.image('preload_background', 'assets/pics/ui/splash.jpg');

    this.load.once('filecomplete-image-preload_background', () => {
        this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'preload_background')
            .setDepth(0)
            .setDisplaySize(this.cameras.main.width, this.cameras.main.height);

        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(this.cameras.main.centerX - 160, this.cameras.main.centerY + 120, 320, 50);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(this.cameras.main.centerX - 150, this.cameras.main.centerY + 130, 300 * value, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
        });
    });

    this.load.on('loaderror', (file) => {
        console.warn('Asset failed to load:', file?.key, file?.src);
    });

    this.load.image('background', 'assets/pics/ui/wood.jpg');
    this.load.image('heart', 'assets/pics/ui/heart.png');

    for (let i = 0; i <= 100; i++) {
        const formattedNumber = String(i).padStart(3, '0');
        this.load.image('items_' + formattedNumber, `assets/pics/items/items_${formattedNumber}.jpg`);
    }

    for (let i = 1; i <= 271; i++) {
        const formattedNumber = String(i).padStart(3, '0');
        this.load.svg('sim_item_' + formattedNumber, `assets/pics/sim_items/sim_item_${formattedNumber}.svg`, { width: 750, height: 1050 });
    }

    this.load.image('back_dungeon', 'assets/pics/cardbacks/back_dungeon.jpg');

    for (let i = 1; i <= 46; i++) {
        const formattedNumber = String(i).padStart(2, '0');
        this.load.image('monster_' + formattedNumber, `assets/pics/monsters/monster_${formattedNumber}.jpg`);
    }
    this.load.svg('monster_47', 'assets/pics/monsters/monster_47.svg', { width: 750, height: 1050 });

    for (let i = 1; i <= 10; i++) {
        const formattedNumber = String(i).padStart(2, '0');
        this.load.image('event_1' + formattedNumber, `assets/pics/events/event_${formattedNumber}.jpg`);
    }

    this.load.audio('playcard', 'assets/sounds/effects/playcard.wav');
    this.load.audio('draw', 'assets/sounds/effects/draw.wav');
    this.load.audio('shuffle', 'assets/sounds/effects/shuffle.wav');
    this.load.audio('rolldie', 'assets/sounds/effects/rolldie.wav');
    this.load.audio('running', 'assets/sounds/effects/running.mp3');
    this.load.audio('healing-magic', 'assets/sounds/effects/healing-magic.mp3');
    this.load.audio('punch', 'assets/sounds/effects/punch.mp3');
    this.load.audio('execute', 'assets/sounds/effects/execute.mp3');

    this.scene.add('TitleScene', TitleScene, true);
    this.scene.add('DiceScene', DiceScene, true);
    this.scene.add('AnimScene', AnimScene, true);
}
