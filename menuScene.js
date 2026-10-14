class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    preload() {
        this.load.image('clouds', 'assets/clouds.jpg');
        this.load.image('green', 'assets/green.png');
        this.load.image('darkgreen', 'assets/darkgreen.png');
    }

    create() {
        this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'clouds').setOrigin(0, 0);
        this.add.tileSprite(0, this.scale.height - 180, this.scale.width, 220, 'green').setOrigin(0, 0);
        this.add.tileSprite(0, this.scale.height - 100, this.scale.width, 160, 'darkgreen').setOrigin(0, 0);

        this.add.text(this.scale.width / 2, 90, 'MARIO ETERNITY', {
            fontFamily: 'Arial Black',
            fontSize: '52px',
            color: '#ffab2c',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        const levels = [1];
        const buttonWidth = 160;
        const buttonHeight = 60;
        const spacing = 180;
        const buttonColor = '#ffab2c';
        const hoverButtonColor = '#0dffef';
        const startX = this.scale.width / 2 - ((levels.length - 1) * spacing) / 2;
        const y = 240;

        levels.forEach((level, index) => {
            const x = startX + (index * spacing);

            const button = this.add.rectangle(x, y, buttonWidth, buttonHeight, buttonColor)
                .setStrokeStyle(4, 0xf8d14f, 1)
                .setInteractive({ useHandCursor: true });

            this.add.text(x, y, String(level), {
                fontFamily: 'Arial',
                fontSize: '32px',
                color: '#ffffff',
                fontStyle: 'bold',
                align: 'center'
            }).setOrigin(0.5);

            button.on('pointerover', () => {
                button.setFillStyle(hoverButtonColor);
            });

            button.on('pointerout', () => {
                button.setFillStyle(buttonColor);
            });

            button.on('pointerdown', () => {
                this.scene.start('GameScene', { level: level });
            });
        });
    }
}
