// On-screen texts and the DOM settings panel.
let coins = 0;
let coinText = null;
let fireStatusText = null;
let timerText = null;
let timerSeconds = 300;
let timerActive = true;
let timerEnabled = true;
let gameOverText = null;
let hearts = [];

export function createHud(scene, lives, maxLives) {
    coins = 0;
    timerSeconds = 300;
    timerActive = true;
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

    timerText = scene.add.text(16, 16, formatTimer(timerSeconds), { fontSize: '32px', fill: 'red', fontStyle: 1000 });
    timerText.setScrollFactor(0);
    timerText.setDepth(100);
    timerText.setVisible(timerEnabled);

    gameOverText = scene.add.text(scene.scale.width / 2, scene.scale.height / 2, 'GAME OVER', {
        fontSize: '52px',
        color: '#ffffff',
        fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(200);
    gameOverText.setVisible(false);
}

export function updateHud(delta) {
    if (timerActive) {
        timerSeconds -= delta / 1000;
        if (timerSeconds <= 0) {
            timerSeconds = 0;
            timerActive = false;
            timerText.setFill('#FFFF00');
        }
        timerText.setText(formatTimer(timerSeconds));
    } else {
        timerText.setVisible(false);
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
        if (timerText) {
            timerText.setVisible(timerEnabled);
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
    const time = Math.max(seconds, 0);
    const wholeSeconds = Math.floor(time);
    const ms = Math.floor((time - wholeSeconds) * 1000);
    return `${wholeSeconds}s ${ms.toString().padStart(3, '0')}ms`;
}
