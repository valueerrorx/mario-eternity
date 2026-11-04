// Loads every shared asset before the menu opens.
export class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        this.load.image('clouds', 'assets/clouds.jpg');
        this.load.image('green', 'assets/green.png');
        this.load.image('darkgreen', 'assets/darkgreen.png');
        this.load.image('enemy', 'assets/green.png');
        this.load.image('bullet', 'assets/green.png');
        this.load.spritesheet('mario', 'assets/mariospritesheet-big.png', { frameWidth: 50, frameHeight: 67 });
        this.load.spritesheet('samuraiMario', 'assets/mariospritesheet-samurai.png', { frameWidth: 50, frameHeight: 67 });
        this.load.image('katana', 'assets/katana.svg');
        this.load.spritesheet('powerups', 'assets/powerups.png', { frameWidth: 64, frameHeight: 64 });
        this.load.image('fireball', 'assets/fireball-small.png');
        this.load.tilemapTiledJSON('1', 'assets/level_02.json');
        this.load.image('tileset', 'assets/tileset.png');
    }

    create() {
        this.scene.start('MenuScene');
    }
}
