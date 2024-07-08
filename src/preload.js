export function preload() {
    this.load.image('background', 'assets/wood.png');
    for (let i = 1; i <= 100; i++) {
        const formattedNumber = String(i).padStart(3, '0'); // Ensure numbers are three digits
        this.load.image('items_' + formattedNumber, `assets/items_${formattedNumber}.png`);
    }
}