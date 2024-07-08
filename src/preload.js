export function preload() {
    console.log('Preloading assets...');
    this.load.image('background', 'assets/wood.png');
    for (let i = 1; i <= 22; i++) {
        const formattedNumber = String(i).padStart(3, '0'); // Ensure numbers are three digits
        this.load.image('items_' + formattedNumber, `assets/items_${formattedNumber}.png`);
    }

    this.load.audio('playcard', 'assets/sounds/effects/playcard.wav');
    this.load.audio('draw', 'assets/sounds/effects/draw.wav');
    this.load.audio('shuffle', 'assets/sounds/effects/shuffle.wav');
    this.load.audio('rolldie', 'assets/sounds/effects/rolldie.wav');
}