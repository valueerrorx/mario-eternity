// On-screen texts and the DOM settings panel.
let coins = 0;
let coinText = null;
let fireStatusText = null;
let timerText = null;
let timerPanel = null;
let timerRing = null;
let timerSeconds = 300;
const timerDuration = 300;
let timerActive = true;
let timerEnabled = true;
let gameOverText = null;
let hearts = [];

export function createHud(scene, lives, maxLives) {
    coins = 0;
    timerSeconds = 300;
    timerActive = true;
    timerEnabled = document.getElementById('timer-toggle').checked;
    hearts = [];

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
    timerPanel.setVisible(timerEnabled);
    updateTimerRing();

    gameOverText = scene.add.text(scene.scale.width / 2, scene.scale.height / 2, 'GAME OVER', {
        fontSize: '52px',
        color: '#ffffff',
        fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(200);
    gameOverText.setVisible(false);
}

export function updateHud(delta) {
    if (timerActive && timerEnabled) {
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

export function showGameOver() {
    if (gameOverText) {
        gameOverText.setVisible(true);
    }
}

export function setupSettings(onTimeMode) {
    const settingsToggle = document.getElementById('settings-toggle');
    const settingsPanel = document.getElementById('settings-panel');

    settingsToggle.addEventListener('click', () => {
        settingsPanel.hidden = !settingsPanel.hidden;
        settingsToggle.setAttribute('aria-expanded', String(!settingsPanel.hidden));
        settingsToggle.setAttribute('aria-label', settingsPanel.hidden ? 'Einstellungen öffnen' : 'Einstellungen schließen');
    });

    document.querySelectorAll('[data-time-mode]').forEach(button => {
        button.addEventListener('click', () => {
            onTimeMode(button.dataset.timeMode);
            document.querySelectorAll('[data-time-mode]').forEach(option => {
                option.setAttribute('aria-pressed', String(option === button));
            });
        });
    });

    document.getElementById('timer-toggle').addEventListener('change', event => {
        timerEnabled = event.target.checked;
        if (timerPanel) {
            timerPanel.setVisible(timerEnabled);
        }
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
