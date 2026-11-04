// Level scene: wires player, world and hud, and owns the enemies.
import { createWorld, updateWorld, getMap, getFloorLayer, bindAssetOverlap } from './world.js';
import { createHud, updateHud, showGameOver } from './hud.js';
import { createPlayer, updatePlayer, getPlayer, getLives, getMaxLives, loseLife, hitPlayer } from './player.js';

const enemySpawns = [{ x: 700 }, { x: 1450 }];
let enemies = null;
let bullets = null;
let shells = null;
let katanaThrows = null;

export class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        createWorld(this);
        createPlayer(this);
        this.physics.add.collider(getPlayer(), getFloorLayer());
        bindAssetOverlap(this, getPlayer(), () => loseLife(this));
        createCombat(this);
        createHud(this, getLives(), getMaxLives());
    }

    update(time, delta) {
        if (getLives() <= 0) {
            showGameOver();
            const sprite = getPlayer();
            if (sprite) {
                sprite.setVelocity(0, 0);
            }
            return;
        }

        updateHud(delta);
        updateWorld(this, delta);
        updateKoopaEnemies();
        updateKatanaThrows(time);
        updatePlayer(this, () => shootBullet(this), () => throwKatana(this));
    }
}

function createCombat(scene) {
    enemies = scene.physics.add.group({
        classType: Phaser.Physics.Arcade.Sprite,
        runChildUpdate: true
    });
    bullets = scene.physics.add.group();
    katanaThrows = scene.physics.add.group();
    shells = scene.physics.add.group({
        classType: Phaser.Physics.Arcade.Sprite,
        runChildUpdate: true
    });
    scene.physics.world.on('worldbounds', body => {
        if (body.gameObject.texture.key === 'fireball') {
            body.gameObject.disableBody(true, true);
        }
    });

    spawnEnemies(scene);

    const bonusEnemy = scene.add.rectangle(600, 420, 28, 28, 0xff4d4d);
    scene.physics.add.existing(bonusEnemy);
    enemies.add(bonusEnemy);
    bonusEnemy.body.setAllowGravity(false);
    bonusEnemy.body.setImmovable(true);
    bonusEnemy.body.setVelocityX(-80);
    bonusEnemy.setDepth(60);

    const player = getPlayer();
    scene.physics.add.collider(player, enemies, (sprite, enemy) => handlePlayerEnemyCollision(scene, sprite, enemy));
    scene.physics.add.collider(player, shells, handlePlayerShellCollision);
    scene.physics.add.collider(enemies, getFloorLayer());
    scene.physics.add.collider(shells, getFloorLayer());
    scene.physics.add.collider(shells, enemies, shellHitsEnemy);
    scene.physics.add.overlap(bullets, enemies, bulletHitEnemy);
    scene.physics.add.collider(katanaThrows, getFloorLayer(), consumeKatanaThrow);
    scene.physics.add.overlap(katanaThrows, enemies, katanaHitEnemy);
}

function createKoopaTextures(scene) {
    if (scene.textures.exists('koopa')) {
        return;
    }

    const gfx = scene.make.graphics({ x: 0, y: 0, add: false });

    // Build the rear limbs first so the shell sits naturally over the body.
    gfx.fillStyle(0x315e25, 1);
    gfx.fillEllipse(13, 27, 8, 8);
    gfx.fillEllipse(27, 27, 8, 8);
    gfx.fillStyle(0x72ad3b, 1);
    gfx.fillEllipse(13, 26, 5, 6);
    gfx.fillEllipse(27, 26, 5, 6);
    gfx.fillStyle(0xe4ddc4, 1);
    gfx.fillTriangle(10, 30, 12, 28, 12, 32);
    gfx.fillTriangle(14, 31, 14, 28, 16, 31);
    gfx.fillTriangle(24, 31, 25, 28, 27, 31);
    gfx.fillTriangle(28, 31, 29, 28, 31, 30);

    // Belly and neck, shaded with warm olive tones.
    gfx.fillStyle(0x315d28, 1);
    gfx.fillEllipse(21, 22, 16, 11);
    gfx.fillStyle(0xa6a06b, 1);
    gfx.fillEllipse(21, 21, 12, 8);
    gfx.fillStyle(0xc5b985, 1);
    gfx.fillEllipse(20, 20, 8, 5);
    gfx.lineStyle(0.7, 0x746e49, 0.85);
    gfx.lineBetween(17, 18, 18, 25);
    gfx.lineBetween(21, 17, 21, 26);
    gfx.lineBetween(25, 18, 24, 25);

    // Ivory rim under the deep red shell.
    gfx.fillStyle(0x51301e, 1);
    gfx.fillEllipse(19, 14, 20, 15);
    gfx.fillStyle(0xe6dfc7, 1);
    gfx.fillEllipse(19, 13, 19, 14);
    gfx.fillStyle(0x7d2821, 1);
    gfx.fillEllipse(19, 11, 17, 12);
    gfx.fillStyle(0xb84331, 1);
    gfx.fillEllipse(18, 9, 13, 8);
    gfx.fillStyle(0xd66a48, 0.9);
    gfx.fillEllipse(15, 7, 7, 3);

    // Raised shell plates and fine dark seams.
    gfx.lineStyle(0.8, 0x4b201a, 0.95);
    gfx.lineBetween(19, 5, 19, 17);
    gfx.lineBetween(9, 9, 29, 9);
    gfx.lineBetween(12, 5, 10, 12);
    gfx.lineBetween(26, 5, 29, 12);
    gfx.fillStyle(0x8e3027, 1);
    gfx.fillTriangle(19, 6, 12, 9, 19, 12);
    gfx.fillTriangle(19, 6, 26, 9, 19, 12);
    gfx.fillTriangle(12, 9, 11, 14, 19, 12);
    gfx.fillTriangle(26, 9, 28, 14, 19, 12);
    gfx.fillStyle(0xd36a48, 0.8);
    gfx.fillTriangle(16, 7, 19, 6, 17, 10);
    gfx.fillTriangle(22, 7, 25, 8, 21, 10);
    gfx.lineStyle(0.7, 0xf3ecd8, 0.9);
    gfx.lineBetween(11, 14, 27, 14);

    // Scaled green head, eye ridge, nostrils, and a small beak.
    gfx.fillStyle(0x294e22, 1);
    gfx.fillEllipse(31, 17, 13, 11);
    gfx.fillStyle(0x5d9c35, 1);
    gfx.fillEllipse(31, 16, 11, 9);
    gfx.fillStyle(0x8abd4c, 1);
    gfx.fillEllipse(30, 14, 7, 4);
    gfx.fillStyle(0xf0dfb8, 1);
    gfx.fillEllipse(32, 16, 3.2, 4.5);
    gfx.fillStyle(0x181b12, 1);
    gfx.fillEllipse(33, 16, 1.2, 2.6);
    gfx.fillStyle(0xffffff, 0.9);
    gfx.fillCircle(33.4, 15.2, 0.6);
    gfx.fillStyle(0x315d28, 1);
    gfx.fillTriangle(35, 19, 40, 20, 35, 22);
    gfx.fillStyle(0x20271a, 1);
    gfx.fillCircle(36, 19, 0.55);

    // Scales on the cheek and forelegs add texture at the 1.5x game size.
    gfx.fillStyle(0x98c85a, 0.9);
    gfx.fillCircle(29, 19, 0.8);
    gfx.fillCircle(32, 21, 0.7);
    gfx.fillCircle(35, 18, 0.65);
    gfx.fillStyle(0x426f2d, 1);
    gfx.fillEllipse(23, 28, 6, 7);
    gfx.fillEllipse(34, 27, 6, 7);
    gfx.fillStyle(0x79ad3e, 1);
    gfx.fillEllipse(23, 27, 4, 5);
    gfx.fillEllipse(34, 26, 4, 5);
    gfx.fillStyle(0xe6ddc4, 1);
    gfx.fillTriangle(21, 31, 22, 28, 24, 31);
    gfx.fillTriangle(24, 31, 25, 28, 27, 30);
    gfx.fillTriangle(32, 30, 33, 27, 35, 30);
    gfx.fillTriangle(35, 30, 37, 27, 38, 29);
    gfx.fillStyle(0xa0c85c, 0.9);
    gfx.fillCircle(22, 25, 0.8);
    gfx.fillCircle(24, 27, 0.7);
    gfx.fillCircle(33, 24, 0.7);
    gfx.fillCircle(35, 26, 0.8);

    gfx.generateTexture('koopa', 42, 36);

    gfx.clear();

    gfx.fillStyle(0x50291e, 1);
    gfx.fillEllipse(15, 12, 28, 19);
    gfx.fillStyle(0xe6dfc7, 1);
    gfx.fillEllipse(15, 11, 27, 18);
    gfx.fillStyle(0x79261f, 1);
    gfx.fillEllipse(15, 9, 24, 15);
    gfx.fillStyle(0xb64030, 1);
    gfx.fillEllipse(14, 7, 17, 10);
    gfx.fillStyle(0xd96b49, 0.9);
    gfx.fillEllipse(11, 5, 8, 3);
    gfx.lineStyle(1, 0x4d211b, 1);
    gfx.lineBetween(15, 2, 15, 15);
    gfx.lineBetween(3, 7, 27, 7);
    gfx.lineBetween(7, 4, 6, 11);
    gfx.lineBetween(23, 4, 25, 11);
    gfx.fillStyle(0x913128, 1);
    gfx.fillTriangle(15, 3, 7, 7, 15, 10);
    gfx.fillTriangle(15, 3, 23, 7, 15, 10);
    gfx.fillTriangle(7, 7, 6, 12, 15, 10);
    gfx.fillTriangle(23, 7, 25, 12, 15, 10);
    gfx.lineStyle(1, 0xf3ecd8, 0.95);
    gfx.lineBetween(5, 14, 25, 14);
    gfx.generateTexture('koopa_shell', 30, 22);

    gfx.clear();

    gfx.fillStyle(0x315e25, 1);
    gfx.fillEllipse(13, 27, 8, 8);
    gfx.fillEllipse(27, 27, 8, 8);
    gfx.fillStyle(0x72ad3b, 1);
    gfx.fillEllipse(13, 26, 5, 6);
    gfx.fillEllipse(27, 26, 5, 6);
    gfx.fillStyle(0xa6a06b, 1);
    gfx.fillEllipse(21, 21, 12, 8);
    gfx.fillStyle(0xc5b985, 1);
    gfx.fillEllipse(20, 20, 8, 5);
    gfx.lineStyle(0.7, 0x746e49, 0.85);
    gfx.lineBetween(17, 18, 18, 25);
    gfx.lineBetween(21, 17, 21, 26);
    gfx.lineBetween(25, 18, 24, 25);
    gfx.fillStyle(0x294e22, 1);
    gfx.fillEllipse(31, 17, 13, 11);
    gfx.fillStyle(0x5d9c35, 1);
    gfx.fillEllipse(31, 16, 11, 9);
    gfx.fillStyle(0x8abd4c, 1);
    gfx.fillEllipse(30, 14, 7, 4);
    gfx.fillStyle(0xf0dfb8, 1);
    gfx.fillEllipse(32, 16, 3.2, 4.5);
    gfx.fillStyle(0x181b12, 1);
    gfx.fillEllipse(33, 16, 1.2, 2.6);
    gfx.fillStyle(0x315d28, 1);
    gfx.fillTriangle(35, 19, 40, 20, 35, 22);
    gfx.fillStyle(0x426f2d, 1);
    gfx.fillEllipse(23, 28, 6, 7);
    gfx.fillEllipse(34, 27, 6, 7);
    gfx.fillStyle(0x79ad3e, 1);
    gfx.fillEllipse(23, 27, 4, 5);
    gfx.fillEllipse(34, 26, 4, 5);
    gfx.fillStyle(0xe6ddc4, 1);
    gfx.fillTriangle(21, 31, 22, 28, 24, 31);
    gfx.fillTriangle(24, 31, 25, 28, 27, 30);
    gfx.fillTriangle(32, 30, 33, 27, 35, 30);
    gfx.fillTriangle(35, 30, 37, 27, 38, 29);
    gfx.generateTexture('koopa_naked', 42, 36);
    gfx.destroy();
}

function createDetachedShell(enemy) {
    if (!shells) {
        return null;
    }

    const shell = shells.create(enemy.x + 18, enemy.y + 4, 'koopa_shell');
    if (!shell) {
        return null;
    }

    shell.isKoopaShell = true;
    shell.owner = enemy;
    shell.isLaunched = false;
    shell.setActive(true);
    shell.setVisible(true);
    shell.setDepth(48);
    shell.setScale(1.5);
    shell.setVelocity(0, 0);
    shell.body.setAllowGravity(false);
    shell.body.setSize(45, 33);
    shell.body.setOffset(0, 0);
    shell.direction = enemy.direction || -1;
    shell.setFlipX(shell.direction > 0);
    return shell;
}

function updateKoopaShells() {
    if (!shells) {
        return;
    }

    shells.getChildren().forEach(shell => {
        if (!shell || !shell.active || !shell.isKoopaShell) {
            return;
        }

        shell.body.setAllowGravity(false);
        shell.body.setVelocityY(0);
        if (Math.abs(shell.body.velocity.x) <= 10) {
            return;
        }

        const dir = shell.body.velocity.x >= 0 ? 1 : -1;
        shell.direction = dir;
        shell.setFlipX(dir > 0);
        const frontX = shell.x + (dir * 18);
        const frontTile = getFloorLayer() && getFloorLayer().getTileAtWorldXY(frontX, shell.y + 10);
        if (!frontTile || frontTile.index <= 0) {
            shell.direction *= -1;
            shell.setVelocityX(shell.direction * 420);
            return;
        }
        if (shell.body.blocked.left || shell.body.blocked.right) {
            shell.direction *= -1;
            shell.setVelocityX(shell.direction * 420);
        }
    });
}

function updateKoopaEnemies() {
    if (!enemies) {
        return;
    }

    enemies.getChildren().forEach(enemy => {
        if (!enemy || !enemy.active || !enemy.isKoopa) {
            return;
        }

        enemy.body.setAllowGravity(false);
        enemy.setY(enemy.platformY - 18);
        if (enemy.shellState === 'walking' || enemy.shellState === 'shellless') {
            const isShellless = enemy.shellState === 'shellless';
            const speed = isShellless ? 120 : enemy.speed;
            enemy.setTexture(isShellless ? 'koopa_naked' : 'koopa');
            enemy.setFlipX(enemy.direction > 0);
            const probeX = enemy.x + (enemy.direction * 22);
            const groundTile = getFloorLayer() && getFloorLayer().getTileAtWorldXY(probeX, enemy.platformY + 1);
            if (!groundTile || groundTile.index <= 0 || groundTile.pixelY !== enemy.platformY) {
                enemy.direction *= -1;
            }
            enemy.setVelocityX(enemy.direction * speed);
        }
    });
    updateKoopaShells();
}

function handlePlayerShellCollision(playerSprite, shell) {
    if (!shell || !shell.active || !shell.isKoopaShell) {
        return;
    }
    const pushDir = playerSprite.x < shell.x ? 1 : -1;
    shell.direction = pushDir;
    shell.isLaunched = true;
    shell.owner = null;
    shell.setVelocityX(pushDir * 420);
    shell.setFlipX(pushDir > 0);
}

function handlePlayerEnemyCollision(scene, playerSprite, enemy) {
    if (!enemy || !enemy.active || !enemy.isKoopa) {
        hitPlayer(scene, playerSprite);
        return;
    }

    const playerAboveEnemy = playerSprite.body.velocity.y > 100 && playerSprite.body.bottom <= enemy.body.top + 20;
    if (playerAboveEnemy) {
        if (enemy.shellState === 'walking') {
            enemy.shellState = 'shellless';
            enemy.direction = playerSprite.x < enemy.x ? -1 : 1;
            enemy.setVelocityX(0);
            enemy.body.setSize(30, 30);
            enemy.body.setOffset(6, 6);
            enemy.shellSprite = createDetachedShell(enemy);
            playerSprite.setVelocityY(-630);
            return;
        }
        if (enemy.shellState === 'shellless') {
            enemy.disableBody(true, true);
            if (enemy.shellSprite) {
                enemy.shellSprite.destroy();
                enemy.shellSprite = null;
            }
            playerSprite.setVelocityY(-630);
            return;
        }
    }
    hitPlayer(scene, playerSprite);
}

function shellHitsEnemy(shell, enemy) {
    if (!shell || !enemy || !enemy.active || !enemy.isKoopa) {
        return;
    }
    if (enemy.shellState !== 'shellless') {
        return;
    }
    if (shell.owner === enemy) {
        return;
    }
    shell.disableBody(true, true);
    enemy.disableBody(true, true);
    if (enemy.shellSprite) {
        enemy.shellSprite.destroy();
        enemy.shellSprite = null;
    }
}

function findGroundYAtX(x) {
    const level = getMap();
    const floor = getFloorLayer();
    if (!floor || !level) {
        return 1680;
    }
    for (let y = 0; y < level.heightInPixels; y += level.tileHeight) {
        const tile = floor.getTileAtWorldXY(x, y + 1);
        if (tile && tile.index > 0) {
            return tile.pixelY - 18;
        }
    }
    return 1680;
}

function spawnEnemies(scene) {
    createKoopaTextures(scene);
    enemySpawns.forEach(spawn => {
        const groundY = findGroundYAtX(spawn.x);
        const enemy = enemies.create(spawn.x, groundY, 'koopa');
        if (!enemy) {
            return;
        }
        enemy.isKoopa = true;
        enemy.shellState = 'walking';
        enemy.shellSprite = null;
        enemy.platformY = groundY + 18;
        enemy.speed = 80;
        enemy.direction = -1;
        enemy.setActive(true);
        enemy.setVisible(true);
        enemy.setDepth(45);
        enemy.setScale(1.5);
        enemy.body.setAllowGravity(false);
        enemy.setCollideWorldBounds(false);
        enemy.setBounce(0, 0);
        enemy.body.setSize(45, 45);
        enemy.body.setOffset(6, 6);
        enemy.setVelocityX(-enemy.speed);
        enemy.setVelocityY(0);
    });
}

function shootBullet(scene) {
    const player = getPlayer();
    const offsetX = player.facing === 'left' ? -30 : 30;
    const bullet = bullets.get(player.x + offsetX, player.y - 10, 'fireball');
    if (!bullet) {
        return;
    }
    bullet.enableBody(true, player.x + offsetX, player.y - 10, true, true);
    bullet.body.setAllowGravity(false);
    bullet.body.setVelocityX(player.facing === 'left' ? -900 : 900);
    bullet.body.setVelocityY(0);
    bullet.body.setCollideWorldBounds(true);
    bullet.body.onWorldBounds = true;
    bullet.setDepth(60);
    bullet.setActive(true);
    bullet.setVisible(true);
}

function bulletHitEnemy(bullet, enemy) {
    if (!bullet || !enemy) {
        return;
    }
    bullet.disableBody(true, true);
    enemy.disableBody(true, true);
}

function throwKatana(scene) {
    const player = getPlayer();
    const direction = player.facing === 'left' ? -1 : 1;
    const katana = katanaThrows.get(player.x + direction * 30, player.y + 9, 'katana');
    if (!katana) {
        return;
    }
    katana.enableBody(true, player.x + direction * 30, player.y + 9, true, true);
    katana.body.setAllowGravity(false);
    katana.body.setVelocity(direction * 900, 0);
    katana.setDisplaySize(38, 38);
    katana.body.setSize(68, 24);
    katana.setFlipX(direction < 0);
    katana.setAngle(direction < 0 ? -45 : 45);
    katana.setDepth(60);
    katana.setData('expireAt', scene.time.now + 1400);
}

function updateKatanaThrows(time) {
    if (!katanaThrows) {
        return;
    }
    katanaThrows.getChildren().forEach(projectile => {
        if (projectile.active && time >= projectile.getData('expireAt')) {
            consumeKatanaThrow(projectile);
        }
    });
}

function consumeKatanaThrow(katana) {
    if (!katana || !katana.active) {
        return;
    }
    katana.disableBody(true, true);
}

function katanaHitEnemy(katana, enemy) {
    if (!katana || !enemy || !katana.active || !enemy.active) {
        return;
    }
    consumeKatanaThrow(katana);
    enemy.disableBody(true, true);
}
