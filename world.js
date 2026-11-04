// Tilemap, parallax and the day-night sky.
import { addCoin, setWeatherLabel, setSeasonLabel } from './hud.js';

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
let weather = null;
let weatherEffects = null;
let season = null;
let seasonEffects = null;
const seasonDuration = 60000;
const seasons = [
    { name: 'Frühling', tint: 0x80b989, alpha: 0.035, particle: 0xffc4d4, speedX: 0.018, speedY: 0.02 },
    { name: 'Sommer', tint: 0xffd566, alpha: 0.035, particle: 0xffef9e, speedX: 0.008, speedY: -0.008 },
    { name: 'Herbst', tint: 0xc87a3d, alpha: 0.045, particle: 0xe6a04b, speedX: 0.045, speedY: 0.055 },
    { name: 'Winter', tint: 0x9ec9e8, alpha: 0.045, particle: 0xffffff, speedX: 0, speedY: 0 }
];
const weatherNames = {
    sunny: 'Sonne',
    cloudy: 'Bewölkt',
    rain: 'Regen',
    snow: 'Schnee',
    wind: 'Wind'
};

export function getMap() {
    return map;
}

export function getFloorLayer() {
    return floorLayer;
}

export function getWeather() {
    return weather ? weather.type : 'sunny';
}

export function getWeatherLabel() {
    return 'Wetter: ' + weatherNames[getWeather()];
}

export function getSeasonLabel() {
    return 'Jahreszeit: ' + (season ? seasons[season.index].name : seasons[0].name);
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
    createWeatherEffects(scene);
    createSeasonEffects(scene);
    season = { index: 0, elapsed: 0 };
    weather = {
        type: pickWeather(),
        timeToChange: Phaser.Math.Between(18000, 30000)
    };

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
    updateWeather(scene, delta);
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

function createWeatherEffects(scene) {
    weatherEffects = {
        overlay: scene.add.rectangle(0, 0, scene.scale.width, scene.scale.height, 0x172333, 1)
            .setOrigin(0, 0).setScrollFactor(0).setDepth(49).setAlpha(0),
        rain: [],
        snow: [],
        wind: []
    };

    for (let index = 0; index < 48; index++) {
        const drop = scene.add.rectangle(
            Phaser.Math.Between(0, scene.scale.width),
            Phaser.Math.Between(0, scene.scale.height),
            2,
            14,
            0xd8efff,
            0.38
        ).setScrollFactor(0).setDepth(80).setAngle(15);
        weatherEffects.rain.push(drop);
    }

    for (let index = 0; index < 24; index++) {
        const flake = scene.add.circle(
            Phaser.Math.Between(0, scene.scale.width),
            Phaser.Math.Between(0, scene.scale.height),
            Phaser.Math.Between(1, 3),
            0xffffff,
            0.68
        ).setScrollFactor(0).setDepth(80);
        weatherEffects.snow.push(flake);
    }

    for (let index = 0; index < 9; index++) {
        const streak = scene.add.rectangle(
            Phaser.Math.Between(0, scene.scale.width),
            Phaser.Math.Between(20, scene.scale.height - 20),
            Phaser.Math.Between(18, 38),
            2,
            0xf3f6e8,
            0.25
        ).setScrollFactor(0).setDepth(80);
        weatherEffects.wind.push(streak);
    }
}

function updateWeather(scene, delta) {
    if (!weather || !weatherEffects) {
        return;
    }

    updateSeason(scene, delta);
    weather.type = applySeasonToWeather(weather.type);
    weather.timeToChange -= delta;
    if (weather.timeToChange <= 0) {
        weather.type = pickWeather(weather.type);
        weather.timeToChange = Phaser.Math.Between(18000, 30000);
    }

    setWeatherLabel(getWeatherLabel());
    setSeasonLabel(getSeasonLabel());
    updateSeasonEffects(scene, delta);
    const overlayStyle = {
        sunny: [0x172333, 0],
        cloudy: [0x172333, 0.14],
        rain: [0x536d7b, 0.09],
        snow: [0xadc2cc, 0.07],
        wind: [0xe3e8dc, 0.025]
    }[weather.type];
    weatherEffects.overlay.setFillStyle(overlayStyle[0]).setAlpha(overlayStyle[1]);

    weatherEffects.rain.forEach(drop => {
        drop.setVisible(weather.type === 'rain');
        if (weather.type === 'rain') {
            drop.x -= delta * 0.12;
            drop.y += delta * 0.72;
            if (drop.y > scene.scale.height + 16) {
                drop.y = -16;
                drop.x = Phaser.Math.Between(0, scene.scale.width);
            }
        }
    });
    weatherEffects.snow.forEach(flake => {
        flake.setVisible(weather.type === 'snow');
        if (weather.type === 'snow') {
            flake.y += delta * 0.035;
            flake.x += Math.sin((scene.time.now + flake.y * 8) * 0.001) * delta * 0.012;
            if (flake.y > scene.scale.height + 4) {
                flake.y = -4;
                flake.x = Phaser.Math.Between(0, scene.scale.width);
            }
        }
    });
    weatherEffects.wind.forEach(streak => {
        streak.setVisible(weather.type === 'wind');
        if (weather.type === 'wind') {
            const direction = Math.sin(scene.time.now * 0.0007) >= 0 ? 1 : -1;
            streak.x += delta * 0.24 * direction;
            if (streak.x > scene.scale.width + 40) {
                streak.x = -40;
                streak.y = Phaser.Math.Between(20, scene.scale.height - 20);
            } else if (streak.x < -40) {
                streak.x = scene.scale.width + 40;
                streak.y = Phaser.Math.Between(20, scene.scale.height - 20);
            }
        }
    });
}

function pickWeather(currentWeather) {
    const options = Object.keys(weatherNames).filter(type => type !== currentWeather);
    return applySeasonToWeather(Phaser.Utils.Array.GetRandom(options));
}

function applySeasonToWeather(type) {
    const isWinter = season.index === seasons.length - 1;
    if (isWinter && type === 'rain') {
        return 'snow';
    }
    if (!isWinter && type === 'snow') {
        return 'rain';
    }
    return type;
}

function updateSeason(scene, delta) {
    season.elapsed += delta;
    while (season.elapsed >= seasonDuration) {
        season.elapsed -= seasonDuration;
        season.index = (season.index + 1) % seasons.length;
        weather.timeToChange = Phaser.Math.Between(18000, 30000);
    }
}

function createSeasonEffects(scene) {
    seasonEffects = {
        overlay: scene.add.rectangle(0, 0, scene.scale.width, scene.scale.height, 0xffffff, 1)
            .setOrigin(0, 0).setScrollFactor(0).setDepth(48).setAlpha(0),
        particles: []
    };

    for (let index = 0; index < 18; index++) {
        const particle = scene.add.rectangle(
            Phaser.Math.Between(0, scene.scale.width),
            Phaser.Math.Between(0, scene.scale.height),
            Phaser.Math.Between(3, 6),
            Phaser.Math.Between(5, 10),
            0xffffff,
            0.58
        ).setScrollFactor(0).setDepth(79).setAngle(Phaser.Math.Between(-35, 35));
        seasonEffects.particles.push(particle);
    }
}

function updateSeasonEffects(scene, delta) {
    if (!seasonEffects || !season) {
        return;
    }

    const style = seasons[season.index];
    seasonEffects.overlay.setFillStyle(style.tint).setAlpha(style.alpha);
    seasonEffects.particles.forEach(particle => {
        particle.setFillStyle(style.particle, 0.58);
        particle.setVisible(season.index !== seasons.length - 1);
        if (season.index === seasons.length - 1) {
            return;
        }

        particle.x += Math.sin((scene.time.now + particle.y * 5) * 0.001) * delta * style.speedX;
        particle.y += delta * style.speedY;
        if (particle.y > scene.scale.height + 12) {
            particle.y = -12;
            particle.x = Phaser.Math.Between(0, scene.scale.width);
        } else if (particle.y < -12) {
            particle.y = scene.scale.height + 12;
            particle.x = Phaser.Math.Between(0, scene.scale.width);
        }
    });
}
