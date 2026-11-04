// Tilemap, parallax and the day-night sky.
import { addCoin } from './hud.js';

let map = null;
let floorLayer = null;
let assetLayer = null;
let clouds = null;
let green = null;
let darkgreen = null;
let dayNight = null;
let nightTint = null;
let nightClouds = null;
let starField = null;
let timeMode = 'auto';

export function getMap() {
    return map;
}

export function getFloorLayer() {
    return floorLayer;
}

export function setTimeMode(mode) {
    timeMode = mode;
}

export function createWorld(scene) {
    map = scene.make.tilemap({ key: '1' });
    const tiles = map.addTilesetImage('tileset', 'tileset');

    clouds = scene.add.tileSprite(0, 0, map.widthInPixels, map.heightInPixels, 'clouds').setOrigin(0, 0);
    green = scene.add.tileSprite(0, map.heightInPixels - 640, map.widthInPixels, map.heightInPixels, 'green').setOrigin(0, 0);
    darkgreen = scene.add.tileSprite(0, map.heightInPixels - 480, map.widthInPixels, map.heightInPixels, 'darkgreen').setOrigin(0, 0);
    createSkyEffects(scene, map.widthInPixels, map.heightInPixels);

    floorLayer = map.createLayer('floor', tiles, 0, 0).setCollisionBetween(1, 10000);
    map.createLayer('enemylayer', tiles, 0, 0).setCollisionBetween(1, 10000);
    assetLayer = map.createLayer('assetlayer', tiles, 0, 0).setCollisionBetween(1, 10000);
    map.createLayer('background', tiles, 0, 0).setDepth(40);
    map.createLayer('foreground', tiles, 0, 0).setDepth(60);

    scene.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    scene.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
}

export function updateWorld(scene, delta) {
    const scrollX = scene.cameras.main.scrollX;
    clouds.x = scrollX;
    green.x = scrollX * 0.4;
    darkgreen.x = scrollX * 0.2;
    updateDayNight(scene, delta);
}

export function bindAssetOverlap(scene, playerSprite, onHazard) {
    scene.physics.add.overlap(playerSprite, assetLayer, (sprite, tile) => {
        if (!tile) {
            return;
        }
        if (isHazardTile(tile.index)) {
            onHazard();
            return;
        }
        assetLayer.removeTileAt(tile.x, tile.y);
        addCoin();
    }, (sprite, tile) => tile.index > 0, scene);
}

function isHazardTile(tileIndex) {
    return (tileIndex >= 77 && tileIndex <= 140) || (tileIndex >= 155 && tileIndex <= 206);
}

function createSkyEffects(scene, worldWidth, worldHeight) {
    dayNight = { elapsed: 0, duration: 120000, night: 0 };
    nightTint = scene.add.rectangle(0, 0, worldWidth, worldHeight, 0x101b3b, 1).setOrigin(0, 0).setAlpha(0);
    nightTint.setDepth(0);

    nightClouds = scene.add.graphics();
    nightClouds.setDepth(0);
    for (let x = 100; x < worldWidth; x += 520) {
        const y = 180 + ((x * 13) % (worldHeight - 900));
        const cloudWidth = 210 + ((x * 7) % 120);
        nightClouds.fillStyle(0x11172e, 0.96);
        nightClouds.fillEllipse(x + cloudWidth * 0.5, y + 26, cloudWidth, 58);
        nightClouds.fillEllipse(x + cloudWidth * 0.3, y + 13, cloudWidth * 0.42, 48);
        nightClouds.fillEllipse(x + cloudWidth * 0.58, y + 3, cloudWidth * 0.48, 62);
        nightClouds.fillEllipse(x + cloudWidth * 0.8, y + 17, cloudWidth * 0.38, 46);
        nightClouds.fillStyle(0x202744, 0.92);
        nightClouds.fillEllipse(x + cloudWidth * 0.49, y + 30, cloudWidth * 0.88, 37);
    }

    starField = scene.add.graphics();
    starField.setDepth(0);
    let seed = 73421;
    for (let index = 0; index < 210; index++) {
        seed = (seed * 16807) % 2147483647;
        const x = (seed / 2147483647) * worldWidth;
        seed = (seed * 16807) % 2147483647;
        const y = 60 + (seed / 2147483647) * (worldHeight - 900);
        const radius = index % 9 === 0 ? 2.4 : 1 + (index % 3) * 0.35;
        starField.fillStyle(0xffd95e, 0.22);
        starField.fillCircle(x, y, radius * 3.4);
        starField.fillStyle(index % 7 === 0 ? 0xfff1a6 : 0xffd95e, 0.96);
        starField.fillCircle(x, y, radius);
        if (index % 9 === 0) {
            starField.lineStyle(1.5, 0xffe990, 0.92);
            starField.lineBetween(x - 7, y, x + 7, y);
            starField.lineBetween(x, y - 7, x, y + 7);
        }
    }
}

function updateDayNight(scene, delta) {
    if (!dayNight) {
        return;
    }
    dayNight.elapsed = (dayNight.elapsed + delta) % dayNight.duration;
    const phase = dayNight.elapsed / dayNight.duration;
    const night = timeMode === 'night' ? 1 : timeMode === 'day' ? 0 : (1 - Math.cos(phase * Math.PI * 2)) / 2;
    dayNight.night = night;
    nightTint.setAlpha(night * 0.48);
    nightClouds.setAlpha(night * 0.92);
    starField.setAlpha(night * (0.78 + Math.sin(scene.time.now * 0.003) * 0.16));
}
