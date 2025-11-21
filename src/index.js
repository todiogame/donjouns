import Phaser from 'phaser';
import { preload } from './preload';
import { create } from './create';
import { update } from './update';

const deviceResolution = window.devicePixelRatio || 1;

const config = {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,
    // Boost clarity on high-DPI screens to avoid blur when scaled
    resolution: Math.min(deviceResolution, 3),
    render: {
        antialias: true,
        roundPixels: true, // avoid subpixel blurring on text/sprites
    },
    scale: {
        // Fit the game inside the available viewport while keeping the aspect ratio
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);
