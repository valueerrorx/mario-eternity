// Boots Phaser and connects the settings panel to the sky.
import { PreloadScene } from './preloadScene.js';
import { MenuScene } from './menuScene.js';
import { GameScene } from './gameScene.js';
import { setupSettings } from './hud.js';
import { setTimeMode } from './world.js';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 480,
    parent: 'preview',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1800 },
            debug: true
        }
    },
    scene: [PreloadScene, MenuScene, GameScene]
};

setupSettings(setTimeMode);
new Phaser.Game(config);
