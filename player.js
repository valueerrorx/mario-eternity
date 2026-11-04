// Mario movement, powerups and the life counter.
import { getMap, getWeather } from './world.js';
import { setFireStatus, updateLifeHud, showGameOver } from './hud.js';

const spawn = { x: 330, y: 200 };
const maxLives = 2;
const shotCooldown = 200;
let lives = 1;
let jumpCount = 0;
let lastShot = 0;
let player = null;
let wasd = null;
let shootKey = null;
let katanaKey = null;

export function getPlayer() {
    return player;
}

export function getLives() {
    return lives;
}

export function getMaxLives() {
    return maxLives;
}

export function createPlayer(scene) {
    lives = 1;
    jumpCount = 0;
    lastShot = 0;

    player = scene.physics.add.sprite(spawn.x, spawn.y, 'mario');
    player.setCircle(28, -2, 8);
    player.setCollideWorldBounds(false);
    scene.physics.world.setBoundsCollision(true, true, true, false);
    player.speed = 400;
    player.setDepth(50);
    player.invulnerable = false;
    player.hasFireFlower = false;
    player.hasKatana = false;

    const heartPickup = scene.add.text(220, 350, '❤', {
        fontSize: '28px',
        color: '#ff4d6d',
        fontStyle: 'bold'
    });
    heartPickup.setDepth(80);
    scene.physics.add.existing(heartPickup);
    heartPickup.body.setAllowGravity(false);
    heartPickup.body.setImmovable(true);
    scene.physics.add.overlap(player, heartPickup, collectHeart, null, scene);

    const fireFlower = scene.physics.add.sprite(352, 1512, 'powerups', 2);
    fireFlower.setScale(0.75);
    fireFlower.setDepth(61);
    fireFlower.body.setAllowGravity(false);
    fireFlower.body.setImmovable(true);
    scene.tweens.add({
        targets: fireFlower,
        y: fireFlower.y - 8,
        duration: 650,
        yoyo: true,
        repeat: -1
    });
    scene.physics.add.overlap(player, fireFlower, collectFireFlower, null, scene);

    const katana = scene.physics.add.staticImage(27 * 32 + 16, 42 * 32 - 32, 'katana')
        .setDisplaySize(48, 48)
        .setDepth(45);
    katana.refreshBody();
    scene.physics.add.overlap(player, katana, collectKatana, null, scene);

    scene.cameras.main.startFollow(player);
    scene.anims.create({
        key: 'walk',
        frameRate: 16,
        frames: scene.anims.generateFrameNumbers('mario', { frames: [2, 3, 4, 3, 2, 1, 0, 1] })
    });
    if (!scene.anims.exists('samuraiWalk')) {
        scene.anims.create({
            key: 'samuraiWalk',
            frameRate: 16,
            frames: scene.anims.generateFrameNumbers('samuraiMario', { frames: [2, 3, 4, 3, 2, 1, 0, 1] })
        });
    }

    wasd = scene.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.SPACE,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        right: Phaser.Input.Keyboard.KeyCodes.D
    });
    shootKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    katanaKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
}

export function updatePlayer(scene, onShoot, onThrowKatana) {
    const walkAnimation = player.texture.key === 'samuraiMario' ? 'samuraiWalk' : 'walk';
    const isRaining = getWeather() === 'rain';
    const windPush = player.windPushUntil > scene.time.now ? player.windPush : 0;
    if (wasd.left.isDown) {
        setHorizontalVelocity(-player.speed + windPush, isRaining);
        player.setFlipX(false);
        player.facing = 'left';
        player.anims.play(walkAnimation, true);
    } else if (wasd.right.isDown) {
        setHorizontalVelocity(player.speed + windPush, isRaining);
        player.setFlipX(true);
        player.facing = 'right';
        player.anims.play(walkAnimation, true);
    } else {
        if (windPush) {
            player.setVelocityX(windPush + (isRaining ? player.body.velocity.x * 0.97 : 0));
        } else if (isRaining) {
            const slidingVelocity = player.body.velocity.x * 0.97;
            player.setVelocityX(Math.abs(slidingVelocity) < 8 ? 0 : slidingVelocity);
        } else {
            player.setVelocityX(0);
        }
        player.setFrame(2);
    }

    if (player.body.blocked.down) {
        jumpCount = 0;
    }
    if (Phaser.Input.Keyboard.JustDown(wasd.up) && jumpCount < 2) {
        player.setVelocityY(-700);
        jumpCount++;
    }

    if (player.hasFireFlower && shootKey.isDown && scene.time.now > lastShot) {
        onShoot();
        lastShot = scene.time.now + shotCooldown;
    }

    if (player.hasKatana && onThrowKatana && Phaser.Input.Keyboard.JustDown(katanaKey)) {
        onThrowKatana();
    }

    if (!player.body.blocked.down) {
        player.setFrame(5);
    }

    const level = getMap();
    if (player.y > level.heightInPixels + 80 && !player.invulnerable) {
        loseLife(scene);
    }
}

function setHorizontalVelocity(targetVelocity, isRaining) {
    if (!isRaining) {
        player.setVelocityX(targetVelocity);
        return;
    }
    player.setVelocityX(Phaser.Math.Linear(player.body.velocity.x, targetVelocity, 0.16));
}

export function loseLife(scene) {
    if (!player || player.invulnerable) {
        return;
    }

    lives = Math.max(0, lives - 1);
    updateLifeHud(lives);
    player.invulnerable = true;
    player.setTint(0xffb3b3);
    player.setVelocityY(-320);
    player.setVelocityX(player.x < spawn.x ? -220 : 220);
    respawnPlayer();

    if (lives <= 0) {
        player.disableBody(true, true);
        showGameOver();
        return;
    }

    scene.time.delayedCall(1000, () => {
        player.clearTint();
        player.invulnerable = false;
    });
}

export function hitPlayer(scene, playerSprite) {
    if (!playerSprite || playerSprite.invulnerable) {
        return;
    }

    lives = Math.max(0, lives - 1);
    updateLifeHud(lives);

    if (lives <= 0) {
        playerSprite.disableBody(true, true);
        showGameOver();
        return;
    }

    playerSprite.invulnerable = true;
    playerSprite.setTint(0xffb3b3);
    playerSprite.setVelocity(0, 0);
    playerSprite.setPosition(spawn.x, spawn.y);
    scene.time.delayedCall(1000, () => {
        playerSprite.clearTint();
        playerSprite.invulnerable = false;
    });
}

function respawnPlayer() {
    const level = getMap();
    if (!player || !level) {
        return;
    }
    const safeX = Phaser.Math.Clamp(spawn.x, 40, level.widthInPixels - 40);
    const safeY = Phaser.Math.Clamp(spawn.y, 80, level.heightInPixels - 80);
    player.setPosition(safeX, safeY);
    player.setVelocity(0, 0);
}

function collectHeart(playerSprite, heartPickup) {
    if (!playerSprite || !heartPickup || lives >= maxLives) {
        return;
    }
    lives = Math.min(maxLives, lives + 1);
    updateLifeHud(lives);
    heartPickup.disableBody(true, true);
    heartPickup.setVisible(false);
}

function collectFireFlower(playerSprite, fireFlower) {
    playerSprite.hasFireFlower = true;
    fireFlower.disableBody(true, true);
    setFireStatus('Feuerblume: F zum Schießen');
}

function collectKatana(playerSprite, katana) {
    if (!katana || !katana.active) {
        return;
    }
    katana.destroy();
    playerSprite.hasKatana = true;
    playerSprite.anims.stop();
    playerSprite.setTexture('samuraiMario');
}
