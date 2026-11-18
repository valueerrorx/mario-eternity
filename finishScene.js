export class FinishScene extends Phaser.Scene {
    constructor() {
        super('FinishScene');
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        this.cameras.main.setBackgroundColor('#73c9f5');
        this.add.tileSprite(0, height - 90, width, 180, 'green').setOrigin(0, 0);

        if (!this.textures.exists('finish-confetti')) {
            const graphics = this.make.graphics({ x: 0, y: 0, add: false });
            graphics.fillStyle(0xffffff, 1);
            graphics.fillRect(0, 0, 10, 16);
            graphics.generateTexture('finish-confetti', 10, 16);
            graphics.destroy();
        }

        const confettiColors = [0xff4d4d, 0xffd447, 0x3cda92, 0x4ca6ff, 0xc36bff];
        [width * 0.16, width * 0.84].forEach(x => {
            this.add.particles(x, height * 0.78, 'finish-confetti', {
                angle: { min: 245, max: 295 },
                speed: { min: 220, max: 440 },
                gravityY: 420,
                lifespan: 2600,
                frequency: 80,
                quantity: 3,
                rotate: { min: 0, max: 360 },
                scale: { start: 1, end: 0.45 },
                tint: confettiColors
            }).setDepth(1);
        });

        this.add.text(width / 2, height * 0.3, 'You did it', {
            fontFamily: 'Arial Black',
            fontSize: '56px',
            color: '#ffffff',
            stroke: '#174b65',
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(2);

        const button = this.add.rectangle(width / 2, height * 0.58, 280, 62, 0xffab2c)
            .setStrokeStyle(4, 0xf8d14f, 1)
            .setInteractive({ useHandCursor: true })
            .setDepth(2);
        this.add.text(width / 2, height * 0.58, 'Back to menu', {
            fontFamily: 'Arial',
            fontSize: '28px',
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5).setDepth(2);

        button.on('pointerover', () => button.setFillStyle('#0dffef'));
        button.on('pointerout', () => button.setFillStyle('#ffab2c'));
        button.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}
