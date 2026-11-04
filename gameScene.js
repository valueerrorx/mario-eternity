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
    gfx.fillStyle(0x5abf4b, 1);
    gfx.fillRoundedRect(0, 0, 42, 36, 8);
    gfx.fillStyle(0x8fe07d, 1);
    gfx.fillRoundedRect(7, 7, 28, 18, 6);
    gfx.fillStyle(0x2f6d2a, 1);
    gfx.fillRoundedRect(8, 20, 26, 10, 4);
    gfx.fillStyle(0x2d1b12, 1);
    gfx.fillCircle(12, 12, 3);
    gfx.fillCircle(30, 12, 3);
    gfx.generateTexture('koopa', 42, 36);

    gfx.clear();
    gfx.fillStyle(0x3f9730, 1);
    gfx.fillRoundedRect(0, 0, 30, 22, 7);
    gfx.fillStyle(0x285c2c, 1);
    gfx.fillRoundedRect(7, 5, 16, 10, 4);
    gfx.fillStyle(0x1f1a18, 1);
    gfx.fillCircle(9, 9, 2);
    gfx.fillCircle(21, 9, 2);
    gfx.generateTexture('koopa_shell', 30, 22);

    gfx.clear();
    gfx.fillStyle(0x5abf4b, 1);
    gfx.fillRoundedRect(0, 0, 42, 36, 8);
    gfx.fillStyle(0x8fe07d, 1);
    gfx.fillRoundedRect(7, 7, 28, 18, 6);
    gfx.fillStyle(0x2d1b12, 1);
    gfx.fillCircle(12, 12, 3);
    gfx.fillCircle(30, 12, 3);
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
    shell.setVelocity(0, 0);
    shell.body.setAllowGravity(false);
    shell.body.setSize(30, 22);
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
        enemy.body.setAllowGravity(false);
        enemy.setCollideWorldBounds(false);
        enemy.setBounce(0, 0);
        enemy.body.setSize(30, 30);
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
