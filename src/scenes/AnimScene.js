import Phaser from 'phaser';

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
