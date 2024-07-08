import Phaser from 'phaser';
import { preload } from './preload';
import { create } from './create';
import { update } from './update';

const config = {
    type: Phaser.AUTO,
    width: 1300,
    height: 600,
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);
