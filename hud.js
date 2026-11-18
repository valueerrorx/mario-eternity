// On-screen texts and the DOM settings panel.
let coins = 0;
let coinText = null;
let fireStatusText = null;
let weatherText = null;
let seasonText = null;
let timerText = null;
let timerPanel = null;
let timerRing = null;
let timerSeconds = 300;
const timerDuration = 300;
let timerActive = true;
let gameOverShown = false;
let hearts = [];
const gameOverTaunts = [
    'Even the spikes saw that coming.',
    'The Koopas barely had to try.',
    'That fall had no style points.',
    'Maybe next time, watch your step.'
];

export function createHud(scene, lives, maxLives) {
    coins = 0;
    timerSeconds = 300;
    timerActive = true;
    hearts = [];
    gameOverShown = false;
    setControlVisibility(true, true);

    const startX = scene.scale.width - 26;
    for (let i = 0; i < maxLives; i++) {
        const heart = scene.add.text(startX - i * 28, 18, '❤', {
            fontSize: '28px',
            color: '#ff4d6d',
            fontStyle: 'bold'
        }).setScrollFactor(0);
        heart.setDepth(100);
        hearts.push(heart);
    }
    updateLifeHud(lives);

    fireStatusText = scene.add.text(16, 56, 'Feuerblume: fehlt', { fontSize: '18px', fill: '#ffffff' });
    fireStatusText.setScrollFactor(0);
    fireStatusText.setDepth(100);

    weatherText = scene.add.text(16, 104, 'Wetter: Sonne', {
        fontSize: '18px',
        fill: '#ffffff',
        shadow: { offsetX: 1, offsetY: 1, color: '#172333', blur: 3, fill: true }
    });
    weatherText.setScrollFactor(0);
    weatherText.setDepth(100);

    seasonText = scene.add.text(16, 128, 'Jahreszeit: Frühling', {
        fontSize: '16px',
        fill: '#ffffff',
        shadow: { offsetX: 1, offsetY: 1, color: '#172333', blur: 3, fill: true }
    });
    seasonText.setScrollFactor(0);
    seasonText.setDepth(100);

    coinText = scene.add.text(16, 76, 'Coins: ' + coins, { fontSize: '24px', fill: '#ffffff' });
    coinText.setScrollFactor(0);
    coinText.setDepth(100);

    timerPanel = scene.add.container(scene.scale.width / 2, 14).setScrollFactor(0).setDepth(100);
    const timerBackground = scene.add.graphics();
    timerBackground.fillStyle(0x102126, 0.94);
    timerBackground.fillRoundedRect(-82, 0, 164, 64, 12);
    timerBackground.lineStyle(1, 0xd8cda7, 0.55);
    timerBackground.strokeRoundedRect(-82, 0, 164, 64, 12);
    timerPanel.add(timerBackground);

    timerRing = scene.add.graphics();
    timerPanel.add(timerRing);

    timerPanel.add(scene.add.text(-53, 12, 'ZEIT', {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '10px',
        color: '#b8c9bd',
        fontStyle: 'bold'
    }));
    timerText = scene.add.text(-54, 25, formatTimer(timerSeconds), {
        fontFamily: 'monospace',
        fontSize: '25px',
        color: '#fff1c6',
        fontStyle: 'bold'
    });
    timerPanel.add(timerText);
    updateTimerRing();
}

export function updateHud(delta) {
    if (timerActive) {
        timerSeconds -= delta / 1000;
        if (timerSeconds <= 0) {
            timerSeconds = 0;
            timerActive = false;
        }
        timerText.setText(formatTimer(timerSeconds));
        updateTimerRing();
    }
}

export function addCoin() {
    coins += 1;
    coinText.setText('Coins: ' + coins);
}

export function updateLifeHud(lives) {
    hearts.forEach((heart, index) => {
        heart.setVisible(index < lives);
    });
}

export function setFireStatus(text) {
    fireStatusText.setText(text);
}

export function setWeatherLabel(text) {
    if (weatherText && weatherText.text !== text) {
        weatherText.setText(text);
    }
}

export function setSeasonLabel(text) {
    if (seasonText && seasonText.text !== text) {
        seasonText.setText(text);
    }
}

export function showGameOver(scene) {
    if (gameOverShown) {
        return;
    }
    gameOverShown = true;
    setControlVisibility(false, false);
    scene.physics.world.pause();

    scene.add.rectangle(0, 0, scene.scale.width, scene.scale.height, 0x101820, 1)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(200);

    const centerX = scene.scale.width / 2;
    const centerY = scene.scale.height / 2;
    const panel = scene.add.graphics().setScrollFactor(0).setDepth(201);
    panel.fillStyle(0x1b2b32, 0.98);
    panel.fillRoundedRect(centerX - 190, centerY - 112, 380, 224, 18);
    panel.lineStyle(3, 0xffab2c, 1);
    panel.strokeRoundedRect(centerX - 190, centerY - 112, 380, 224, 18);

    scene.add.text(centerX, centerY - 54, 'GAME OVER', {
        fontFamily: 'Arial Black',
        fontSize: '42px',
        color: '#fff1c6',
        stroke: '#101820',
        strokeThickness: 5,
        align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(202);

    scene.add.text(centerX, centerY + 2, Phaser.Utils.Array.GetRandom(gameOverTaunts), {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '18px',
        color: '#c5d0d3',
        align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(202);

    const retryButton = scene.add.rectangle(centerX, centerY + 62, 180, 48, 0xffab2c)
        .setScrollFactor(0)
        .setDepth(202)
        .setStrokeStyle(2, 0xffd66b, 1)
        .setInteractive({ useHandCursor: true });
    scene.add.text(centerX, centerY + 62, 'RETRY', {
        fontFamily: 'Arial',
        fontSize: '22px',
        color: '#ffffff',
        fontStyle: 'bold',
        align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(203);

    retryButton.on('pointerover', () => retryButton.setFillStyle(0x0d9e91));
    retryButton.on('pointerout', () => retryButton.setFillStyle(0xffab2c));
    retryButton.on('pointerdown', () => scene.scene.restart());
}

export function setControlVisibility(settingsVisible, pauseVisible) {
    const settingsToggle = document.getElementById('settings-toggle');
    const settingsPanel = document.getElementById('settings-panel');
    const pauseToggle = document.getElementById('pause-toggle');
    if (!settingsToggle || !settingsPanel || !pauseToggle) {
        return;
    }
    settingsToggle.hidden = !settingsVisible;
    pauseToggle.hidden = !pauseVisible;
    if (!settingsVisible) {
        settingsPanel.hidden = true;
        settingsToggle.setAttribute('aria-expanded', 'false');
        settingsToggle.setAttribute('aria-label', 'Einstellungen öffnen');
    }
    if (!pauseVisible) {
        pauseToggle.textContent = '\u2759\u2759';
        pauseToggle.setAttribute('aria-pressed', 'false');
        pauseToggle.setAttribute('aria-label', 'Spiel pausieren');
        pauseToggle.title = 'Spiel pausieren';
    }
}

export function setupSettings(onTimeMode, game) {
    const settingsToggle = document.getElementById('settings-toggle');
    const settingsPanel = document.getElementById('settings-panel');
    const pauseToggle = document.getElementById('pause-toggle');

    settingsToggle.addEventListener('click', () => {
        settingsPanel.hidden = !settingsPanel.hidden;
        settingsToggle.setAttribute('aria-expanded', String(!settingsPanel.hidden));
        settingsToggle.setAttribute('aria-label', settingsPanel.hidden ? 'Einstellungen öffnen' : 'Einstellungen schließen');
    });

    pauseToggle.addEventListener('click', () => {
        if (!game || (!game.scene.isActive('GameScene') && !game.scene.isPaused('GameScene'))) {
            return;
        }

        const paused = game.scene.isPaused('GameScene');
        if (paused) {
            game.scene.resume('GameScene');
        } else {
            game.scene.pause('GameScene');
        }

        pauseToggle.textContent = paused ? '\u2759\u2759' : '\u25B6';
        pauseToggle.setAttribute('aria-pressed', String(!paused));
        pauseToggle.setAttribute('aria-label', paused ? 'Spiel pausieren' : 'Spiel fortsetzen');
        pauseToggle.title = paused ? 'Spiel pausieren' : 'Spiel fortsetzen';
    });

    document.querySelectorAll('[data-time-mode]').forEach(button => {
        button.addEventListener('click', () => {
            onTimeMode(button.dataset.timeMode);
            document.querySelectorAll('[data-time-mode]').forEach(option => {
                option.setAttribute('aria-pressed', String(option === button));
            });
        });
    });

    document.getElementById('restart-game').addEventListener('click', () => window.location.reload());
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !settingsPanel.hidden) {
            settingsPanel.hidden = true;
            settingsToggle.setAttribute('aria-expanded', 'false');
            settingsToggle.setAttribute('aria-label', 'Einstellungen öffnen');
            settingsToggle.focus();
        }
    });
}

function formatTimer(seconds) {
    const wholeSeconds = Math.ceil(Math.max(seconds, 0));
    const minutes = Math.floor(wholeSeconds / 60);
    const remainder = wholeSeconds % 60;
    return `${minutes}:${remainder.toString().padStart(2, '0')}`;
}

function updateTimerRing() {
    const progress = timerSeconds / timerDuration;
    const color = progress <= 0.1 ? 0xf06b58 : progress <= 0.2 ? 0xf1bd62 : 0x79c99e;
    timerRing.clear();
    timerRing.lineStyle(3, 0x52615b, 0.8);
    timerRing.beginPath();
    timerRing.arc(0, 32, 21, -Math.PI / 2, Math.PI * 1.5);
    timerRing.strokePath();
    timerRing.lineStyle(3, color, 1);
    timerRing.beginPath();
    timerRing.arc(0, 32, 21, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
    timerRing.strokePath();
    timerText.setColor(progress <= 0.1 ? '#ff8b76' : '#fff1c6');
}
