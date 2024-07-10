import { TitleScene } from './display';
export function preload() {
    console.log('Preloading assets...');
    this.load.image('background', 'assets/pics/ui/wood.png');
    this.load.image('heart', 'assets/pics/ui/heart.png');
    this.load.image('medal', 'assets/pics/ui/medal.png');
    this.load.image('damage', 'assets/pics/ui/damage.png');

    for (let i = 1; i <= 22; i++) {
        const formattedNumber = String(i).padStart(3, '0'); // Ensure numbers are three digits
        this.load.image('items_' + formattedNumber, `assets/pics/items/items_${formattedNumber}.png`);
    }
    this.load.image('back_dungeon', `assets/pics/cardbacks/back_dungeon.png`);

    // this.load.image('monster_' + 33, `assets/pics/monsters/monster_33.png`);
    
    for (let i = 1; i <= 26; i++) {
        const formattedNumber = String(i).padStart(2, '0');
        this.load.image('monster_' + formattedNumber, `assets/pics/monsters/monster_${formattedNumber}.png`);
    }
    // for (let i = 1; i <= 10; i++) {
    //     const formattedNumber = String(i).padStart(2, '0');
    //     this.load.image('event_' + formattedNumber, `assets/pics/events/event_${formattedNumber}.png`);
    // }



    this.load.audio('playcard', 'assets/sounds/effects/playcard.wav');
    this.load.audio('draw', 'assets/sounds/effects/draw.wav');
    this.load.audio('shuffle', 'assets/sounds/effects/shuffle.wav');
    this.load.audio('rolldie', 'assets/sounds/effects/rolldie.wav');

    
    // Add the TitleScene
    this.scene.add('TitleScene', TitleScene, true);
}