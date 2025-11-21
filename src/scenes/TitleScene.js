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
