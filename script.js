// === DOM Elementer ===
// Setup Screen (nå startskjerm)
const customPracticeSetup = document.getElementById('custom-practice-setup'); // OK
const customPracticeSettings = document.getElementById('custom-practice-settings'); // OK
// NYE knapper i setup
const startPracticeButton = document.getElementById('start-practice-button'); // OK (Start Øving)
const startGameWithSettingsButton = document.getElementById('start-game-with-settings-button'); // NY (Start Spill)
// FJERN backToStartButton

// Game Wrapper & Status
const gameWrapper = document.getElementById('game-wrapper'); // OK
const gameStatusBar = document.getElementById('game-status-bar'); // OK
const scoreElement = document.getElementById('score'); // OK
const livesDisplay = document.getElementById('lives-display'); // OK
const timerDisplay = document.getElementById('timer-display'); // OK

// Clock & Task Elements (OK)
const analogClockElement = document.getElementById('analog-clock');
const hourHand = document.getElementById('hour-hand');
const minuteHand = document.getElementById('minute-hand');
const digitalClockDisplay = document.getElementById('digital-clock-display');
const digitalHour = document.getElementById('digital-hour');
const digitalMinute = document.getElementById('digital-minute');
const taskQuestion = document.getElementById('task-question');
const answerOptionsContainer = document.getElementById('answer-options');
const checkAnswerButton = document.getElementById('check-answer-button'); // OK
const feedbackElement = document.getElementById('feedback'); // OK

// Controls & Game Over
const nextTaskButton = document.getElementById('next-task-button'); // OK
const gameOverMessage = document.getElementById('game-over-message'); // OK
const finalScoreElement = document.getElementById('final-score'); // OK
const restartButton = document.getElementById('restart-button'); // OK (Spill Igjen)
const backToSettingsButtonGameOver = document.getElementById('back-to-settings-button-gameover'); // NY (Tilbake fra game over)
// NYE knapper under spill/øving
const changePracticeSettingsButton = document.getElementById('change-practice-settings-button'); // NY (Endre Innst. fra øving)
const backToSettingsButtonGame = document.getElementById('back-to-settings-button-game'); // NY (Tilbake fra spill)
// FJERN exitPracticeButton

// === Spillstatus & Konstanter ===
// ... (resten av variablene er uendret) ...
let score = 0; let lives = 3; const MAX_LIVES = 5; const START_LIVES = 3;
const MAX_TIME = 15; let remainingTime = MAX_TIME; let taskTimerInterval = null;
let autoNextTaskTimeout = null; let taskActive = false; let gameModeActive = false;
let lastLifeBonusScore = 0; let isGameOver = false; let currentTaskMode = '';
let currentDifficulty = ''; let isDragging = false; let draggedHand = null;
let dragStartX = 0; let dragStartY = 0;
const AVAILABLE_MODES = ['read_analog', 'set_analog'];
const AVAILABLE_DIFFICULTIES = ['1', '2', '3', '4', '5'];


// === Init & Skjermhåndtering ===
function showScreen(screenToShow) {
    // Skjul alle hovedseksjoner først
    customPracticeSetup.classList.add('hidden');
    gameWrapper.classList.add('hidden');
    gameOverMessage.classList.add('hidden'); // Sørg for at denne er skjult

    if (screenToShow === 'setup') {
        customPracticeSetup.classList.remove('hidden');
    } else if (screenToShow === 'game') {
        gameWrapper.classList.remove('hidden');
        // Vis/skjul statuslinje og knapper basert på modus
        if (gameModeActive) {
            gameStatusBar.classList.remove('hidden');
            changePracticeSettingsButton.classList.add('hidden'); // Skjul "endre" i spill
            backToSettingsButtonGame.classList.remove('hidden'); // Vis "tilbake" i spill
        } else {
            gameStatusBar.classList.add('hidden'); // Skjul status i øving
            changePracticeSettingsButton.classList.remove('hidden'); // Vis "endre" i øving
            backToSettingsButtonGame.classList.add('hidden'); // Skjul "tilbake" i øving
        }
        // Sørg for at game over er skjult når spillet vises
         gameOverMessage.classList.add('hidden');
         // Skjul neste-knappen ved start av spill/øving
         nextTaskButton.classList.add('hidden');


    } else if (screenToShow === 'gameOver') {
         // Game over vises inni game-controls, så gameWrapper må være synlig
         gameWrapper.classList.remove('hidden');
         gameOverMessage.classList.remove('hidden');
         // Skjul andre spill-elementer? Nei, la klokka stå kanskje.
         // Skjul statuslinjen ved game over? Valgfritt.
         gameStatusBar.classList.add('hidden');
         // Skjul vanlige spillkontroller
         nextTaskButton.classList.add('hidden');
         checkAnswerButton.classList.add('hidden');
         changePracticeSettingsButton.classList.add('hidden');
         backToSettingsButtonGame.classList.add('hidden');

    }
}

function initializeGame(isGameMode) {
    console.log(`Initializing ${isGameMode ? 'Game' : 'Practice'} Mode`);
    gameModeActive = isGameMode;
    isGameOver = false;
    taskActive = false;
    clearTimeout(autoNextTaskTimeout);
    stopTaskTimer();

    if (gameModeActive) {
        score = 0; lives = START_LIVES; lastLifeBonusScore = 0;
        updateScoreDisplay(); updateLivesDisplay();
    }

    feedbackElement.textContent = ''; feedbackElement.className = 'feedback';
    checkAnswerButton.classList.add('hidden'); // Skjul denne også

    showScreen('game'); // Vis spillområdet
    generateNewTask(); // Start første oppgave
}

// Funksjon for å sette default checkboxes
function setDefaultPracticeOptions() {
    // Modus: Les Analog på som default
    document.getElementById('mode-read-analog').checked = true;
    document.getElementById('mode-set-analog').checked = false; // Slå av denne

    // Vanskelighetsgrad: 1, 2, 3 på som default
    document.getElementById('diff-1').checked = true;
    document.getElementById('diff-2').checked = true;
    document.getElementById('diff-3').checked = true;
    document.getElementById('diff-4').checked = false; // Slå av denne
    document.getElementById('diff-5').checked = false; // Slå av denne
}


// === Klokkefunksjoner (uendret) ===
function setAnalogTime(hour, minute){ /* ... */ const displayHour = hour % 12; const minuteDeg = (minute / 60) * 360; const hourDeg = ((displayHour / 12) * 360) + ((minute / 60) * 30); minuteHand.style.transform = `translateY(-50%) rotate(${minuteDeg + 90}deg)`; hourHand.style.transform = `translateY(-50%) rotate(${hourDeg + 90}deg)`;}
function formatTwoDigits(number){ /* ... */ return number.toString().padStart(2, '0');}
function setDigitalTime(hour, minute){ /* ... */ digitalHour.textContent = formatTwoDigits(hour % 24); digitalMinute.textContent = formatTwoDigits(minute);}
function displayTime(hour, minute){ /* ... */ currentHour = Math.round(hour); currentMinute = Math.round(minute); currentHour = (currentHour % 24 + 24) % 24; currentMinute = (currentMinute % 60 + 60) % 60; setAnalogTime(currentHour, currentMinute); setDigitalTime(currentHour, currentMinute);}
function timeToText(hour, minute, difficultyLevel){ /* ... */ const difficulty = parseInt(difficultyLevel, 10); let displayHour = hour % 12; if (displayHour === 0) displayHour = 12; let nextHour = (displayHour % 12) + 1; if (minute === 0 && difficulty >= 1) return `Klokka ${displayHour}`; if (minute === 30 && difficulty >= 2) return `Halv ${nextHour}`; if (minute === 15 && difficulty >= 3) return `Kvart over ${displayHour}`; if (minute === 45 && difficulty >= 3) return `Kvart på ${nextHour}`; if (difficulty >= 4) { if (minute === 5) return `Fem over ${displayHour}`; if (minute === 10) return `Ti over ${displayHour}`; if (minute === 20) return `Ti på halv ${nextHour}`; if (minute === 25) return `Fem på halv ${nextHour}`; if (minute === 35) return `Fem over halv ${nextHour}`; if (minute === 40) return `Ti over halv ${nextHour}`; if (minute === 50) return `Ti på ${nextHour}`; if (minute === 55) return `Fem på ${nextHour}`; } if (difficulty >= 5 && minute !== 0 && minute !== 15 && minute !== 30 && minute !== 45) { if (minute < 30) return `${minute} ${minute === 1 ? 'minutt' : 'minutter'} over ${displayHour}`; else return `${60 - minute} ${60 - minute === 1 ? 'minutt' : 'minutter'} på ${nextHour}`; } return `${displayHour}:${formatTwoDigits(minute)}`; }

// === Oppgavegenerering (uendret) ===
function getRandomTime(difficulty) { /* ... */ let hour = 0; let minute = 0; difficulty = difficulty.toString(); switch (difficulty) { case '1': minute = 0; break; case '2': minute = 30; break; case '3': minute = Math.random() < 0.5 ? 15 : 45; break; case '4': minute = Math.floor(Math.random() * 12) * 5; break; case '5': minute = Math.floor(Math.random() * 60); break; default: minute = 0; } hour = Math.floor(Math.random() * 12) + 1; let internalHour = hour; if (Math.random() < 0.5) { if (internalHour !== 12) internalHour += 12; } else { if (internalHour === 12) internalHour = 0; } return { hour: internalHour, minute }; }
function createAnswerOptions(correctHour, correctMinute, difficulty) { /* ... uendret, bruker ikke direkte listener ... */ answerOptionsContainer.innerHTML = ''; const options = new Set(); correctAnswerString = timeToText(correctHour, correctMinute, difficulty); options.add(correctAnswerString); let attempts = 0; while (options.size < 4 && attempts < 30) { const randomTime = getRandomTime(difficulty); if (randomTime.hour !== correctHour || randomTime.minute !== correctMinute) { const wrongAnswerString = timeToText(randomTime.hour, randomTime.minute, difficulty); if(!options.has(wrongAnswerString)){ options.add(wrongAnswerString); } } attempts++; } while (options.size < 4 && attempts < 50) { const randH = Math.floor(Math.random() * 24); const randM = Math.floor(Math.random() * 12) * 5; if (randH !== correctHour || randM !== correctMinute) { const wrongAnswerString = timeToText(randH, randM, Math.max(parseInt(difficulty, 10), 4)); if(!options.has(wrongAnswerString)){ options.add(wrongAnswerString); } } attempts++; } const optionsArray = Array.from(options); optionsArray.sort(() => Math.random() - 0.5); optionsArray.forEach(optionText => { const button = document.createElement('button'); button.textContent = optionText; answerOptionsContainer.appendChild(button); }); }

// === Timer & Spillflyt (uendret) ===
function startTaskTimer() { /* ... */ if (!gameModeActive) return; stopTaskTimer(); remainingTime = MAX_TIME; timerDisplay.textContent = remainingTime; timerDisplay.classList.remove('low-time'); taskTimerInterval = setInterval(() => { remainingTime--; timerDisplay.textContent = remainingTime; if (remainingTime <= 5) { timerDisplay.classList.add('low-time'); } else { timerDisplay.classList.remove('low-time'); } if (remainingTime <= 0) { handleTimeout(); } }, 1000); }
function stopTaskTimer() { /* ... */ clearInterval(taskTimerInterval); taskTimerInterval = null; }
function handleTimeout() { /* ... */ if (!taskActive || isGameOver || !gameModeActive) return; stopTaskTimer(); taskActive = false; lives--; updateLivesDisplay(); feedbackElement.textContent = "⏰ Tiden er ute!"; feedbackElement.className = 'feedback incorrect'; analogClockElement.classList.remove('interactive-clock'); checkAnswerButton.classList.add('hidden'); answerOptionsContainer.querySelectorAll('button').forEach(btn => btn.disabled = true); if (lives <= 0) { gameOver(); } else { nextTaskButton.classList.remove('hidden'); } }

function generateNewTask() { // (Uendret logikk internt)
    if (isGameOver) return;
    console.log("generateNewTask: Starting...");
    clearTimeout(autoNextTaskTimeout); stopTaskTimer(); taskActive = false;
    console.log("generateNewTask: taskActive set to false");
    feedbackElement.textContent = ''; feedbackElement.className = 'feedback';
    nextTaskButton.classList.add('hidden'); checkAnswerButton.classList.add('hidden');
    answerOptionsContainer.classList.remove('hidden');
    analogClockElement.classList.remove('interactive-clock');
    answerOptionsContainer.innerHTML = '';

    // Hent valgte innstillinger (enten fra spillstart eller custom)
    const checkedModes = Array.from(customPracticeSettings.querySelectorAll('input[id^="mode-"]:checked')).map(cb => cb.value);
    const checkedDifficulties = Array.from(customPracticeSettings.querySelectorAll('input[id^="diff-"]:checked')).map(cb => cb.value);

    if (checkedModes.length === 0 || checkedDifficulties.length === 0) {
        feedbackElement.textContent = "Velg minst én oppgavetype og én vanskelighetsgrad!";
        feedbackElement.className = 'feedback incorrect'; displayTime(12, 0);
        taskActive = false; // Sørg for at den forblir false
        return; // Stopp her
    }
    currentTaskMode = checkedModes[Math.floor(Math.random() * checkedModes.length)];
    currentDifficulty = checkedDifficulties[Math.floor(Math.random() * checkedDifficulties.length)];

    console.log(`generateNewTask: Mode=${currentTaskMode}, Difficulty=${currentDifficulty}`);
    const { hour, minute } = getRandomTime(currentDifficulty);
    targetHour = hour; targetMinute = minute;
    console.log(`   Target Time: ${targetHour}:${targetMinute}`);

    if (currentTaskMode === 'set_analog') {
        taskQuestion.textContent = `Still klokka til ${timeToText(targetHour, targetMinute, currentDifficulty)}`;
        displayTime(12, 0); currentHour = 12; currentMinute = 0;
        answerOptionsContainer.classList.add('hidden'); checkAnswerButton.classList.remove('hidden');
        analogClockElement.classList.add('interactive-clock');
    } else if (currentTaskMode === 'read_analog') {
        taskQuestion.textContent = "Hva er klokka?";
        displayTime(targetHour, targetMinute);
        createAnswerOptions(targetHour, targetMinute, currentDifficulty);
    } else {
        taskQuestion.textContent = "Ukjent modus?"; displayTime(12, 0);
        answerOptionsContainer.classList.add('hidden');
    }

    taskActive = true; // Sett aktiv NÅR klar
    console.log("generateNewTask: Task setup complete. taskActive set to true.");
    if (gameModeActive) { startTaskTimer(); }
}

// === Håndtering av Svar (uendret logikk internt) ===
function updateScoreDisplay(){ if (gameModeActive) scoreElement.textContent = score; }
function updateLivesDisplay(){ if (gameModeActive) livesDisplay.textContent = '❤️'.repeat(Math.max(0, lives));}
function awardPointsAndCheckBonus(){ if (!gameModeActive) return; const timeUsed = MAX_TIME - remainingTime; const taskScore = Math.max(1, 10 - Math.floor(timeUsed)); score += taskScore; if (score >= lastLifeBonusScore + 100) { if (lives < MAX_LIVES) { lives++; feedbackElement.textContent += " + Ekstra Liv! ❤️"; updateLivesDisplay(); } else { feedbackElement.textContent += " (Maks liv!)"; } lastLifeBonusScore += 100; } updateScoreDisplay(); }

function handleCorrectAnswer() {
    console.log("handleCorrectAnswer called"); if (!taskActive) return;
    stopTaskTimer(); taskActive = false; console.log("handleCorrectAnswer: taskActive set to false");
    feedbackElement.className = 'feedback correct'; awardPointsAndCheckBonus();
    checkAnswerButton.classList.add('hidden');
    answerOptionsContainer.querySelectorAll('button').forEach(btn => btn.disabled = true);
    analogClockElement.classList.remove('interactive-clock');
    clearTimeout(autoNextTaskTimeout);
    console.log("handleCorrectAnswer: Starting 3s timeout for next task");
    autoNextTaskTimeout = setTimeout(() => { console.log("handleCorrectAnswer: Timeout finished, generating next task"); generateNewTask(); }, 3000);
}
function handleIncorrectAnswer(correctAnswerText) {
    console.log("handleIncorrectAnswer called"); if (!taskActive) return;
    stopTaskTimer(); taskActive = false; console.log("handleIncorrectAnswer: taskActive set to false");
    feedbackElement.textContent = `Feil. ${correctAnswerText ? 'Riktig var: ' + correctAnswerText : ''}`;
    feedbackElement.className = 'feedback incorrect';
    checkAnswerButton.classList.add('hidden');
    answerOptionsContainer.querySelectorAll('button').forEach(btn => btn.disabled = true);
    analogClockElement.classList.remove('interactive-clock');
    nextTaskButton.classList.remove('hidden'); // Vis neste-knapp ved feil
    console.log("handleIncorrectAnswer: Showing 'Next Task' button");
}
function handleAnswerSelection(event) { // Kalles via delegation
    console.log("handleAnswerSelection called via delegation! Button:", event.target.textContent);
    console.log(`   State check: taskActive=${taskActive}, isGameOver=${isGameOver}`);
    if (!taskActive || isGameOver) { console.log("   handleAnswerSelection blocked by state."); return; }
    const selectedAnswer = event.target.textContent;
    answerOptionsContainer.querySelectorAll('button').forEach(btn => { btn.disabled = true; if (btn.textContent === correctAnswerString) btn.classList.add('correct-answer-display'); else if (btn === event.target) btn.classList.add('selected-wrong-answer'); });
    if (selectedAnswer === correctAnswerString) { feedbackElement.textContent = "Riktig! 🎉"; handleCorrectAnswer(); }
    else { handleIncorrectAnswer(correctAnswerString); setAnalogTime(targetHour, targetMinute); setDigitalTime(targetHour, targetMinute); }
}
function handleCheckAnswer() { // Kalles direkte
    console.log("handleCheckAnswer called!"); console.log(`   State check: taskActive=${taskActive}, isGameOver=${isGameOver}`);
    if (!taskActive || isGameOver) { console.log("   handleCheckAnswer blocked by state."); return; }
    const currentHour12 = currentHour === 0 ? 12 : (currentHour > 12 ? currentHour - 12 : currentHour);
    const targetHour12 = targetHour === 0 ? 12 : (targetHour > 12 ? targetHour - 12 : targetHour);
    const targetMinutePadded = formatTwoDigits(targetMinute);
    if (currentHour === targetHour && currentMinute === targetMinute) { feedbackElement.textContent = "Riktig stilt! 👍"; handleCorrectAnswer(); }
    else { const difficultyForText = currentDifficulty || '5'; handleIncorrectAnswer(`Du stilte ${timeToText(currentHour, currentMinute, difficultyForText)}. Riktig var ${timeToText(targetHour, targetMinute, difficultyForText)}.`); setAnalogTime(targetHour, targetMinute); setDigitalTime(targetHour, targetMinute); }
}

// === Game Over ===
function gameOver() {
    if (!gameModeActive) return; // Skjer kun i spillmodus
    console.log("Game Over!"); isGameOver = true; stopTaskTimer(); taskActive = false;
    finalScoreElement.textContent = score;
    showScreen('gameOver'); // Bruk showScreen for å vise game over-meldingen riktig
}


// === Dra-og-slipp & Touch Håndtering (uendret) ===
function getPointerCoordinates(event){ /* ... */ let x, y; if (event.touches && event.touches.length > 0) { x = event.touches[0].clientX; y = event.touches[0].clientY; } else if (event.changedTouches && event.changedTouches.length > 0) { x = event.changedTouches[0].clientX; y = event.changedTouches[0].clientY; } else { x = event.clientX; y = event.clientY; } return { x, y }; }
function getAngle(x, y){ /* ... */ const rect = analogClockElement.getBoundingClientRect(); const centerX = rect.left + rect.width / 2; const centerY = rect.top + rect.height / 2; let angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI); angle = (angle + 90 + 360) % 360; return angle; }
function startDrag(x, y) { console.log(`startDrag attempt: taskActive=${taskActive}, isGameOver=${isGameOver}, mode=${currentTaskMode}`); if (!taskActive || isGameOver || currentTaskMode !== 'set_analog') return; const angle = getAngle(x, y); const minuteAngle = (currentMinute / 60) * 360; const hourAngle = ((currentHour % 12) / 12) * 360 + (currentMinute / 60) * 30; const diffMinute = Math.min(Math.abs(angle - minuteAngle), 360 - Math.abs(angle - minuteAngle)); const diffHour = Math.min(Math.abs(angle - hourAngle), 360 - Math.abs(angle - hourAngle)); if (diffMinute <= diffHour && diffMinute < 45) { draggedHand = 'minute'; } else if (diffHour < 55) { draggedHand = 'hour'; } else { draggedHand = null; return; } isDragging = true; dragStartX = x; dragStartY = y; analogClockElement.style.cursor = 'grabbing'; console.log("Start dragging:", draggedHand); }
function drag(x, y) { /* ... */ if (!isDragging || !taskActive || isGameOver) return; const angle = getAngle(x, y); let newHour = currentHour; let newMinute = currentMinute; if (draggedHand === 'minute') { newMinute = Math.round((angle / 360) * 60) % 60; } else if (draggedHand === 'hour') { let currentMinuteContribution = (currentMinute / 60) * 30; let hourAngleWithoutMinutes = (angle - currentMinuteContribution + 360) % 360; let preciseHour12 = (hourAngleWithoutMinutes / 360) * 12; let roundedHour12 = Math.round(preciseHour12); if (roundedHour12 === 0) roundedHour12 = 12; let wasPM = currentHour >= 12; if (wasPM) { newHour = (roundedHour12 % 12) + 12; if (newHour === 24) newHour = 12; } else { newHour = roundedHour12 % 12; } newMinute = currentMinute; } if (newHour !== currentHour || newMinute !== currentMinute) { displayTime(newHour, newMinute); } }
function endDrag() { /* ... */ if (!isDragging) return; console.log("End dragging"); isDragging = false; draggedHand = null; if (taskActive && currentTaskMode === 'set_analog' && !isGameOver) { analogClockElement.style.cursor = 'grab'; } else { analogClockElement.style.cursor = 'default'; } }

// === Event Listeners ===
// Setup Skjerm
startPracticeButton.addEventListener('click', () => initializeGame(false)); // false = practiceMode
startGameWithSettingsButton.addEventListener('click', () => initializeGame(true)); // true = gameMode

// Spillkontroller
nextTaskButton.addEventListener('click', generateNewTask);
restartButton.addEventListener('click', () => initializeGame(true)); // Restart starter alltid spillmodus
backToSettingsButtonGameOver.addEventListener('click', () => showScreen('setup')); // Tilbake til oppsett
changePracticeSettingsButton.addEventListener('click', () => showScreen('setup')); // Tilbake til oppsett fra øving
backToSettingsButtonGame.addEventListener('click', () => showScreen('setup')); // Tilbake til oppsett fra spill

// Svar Knapper (Event Delegation)
answerOptionsContainer.addEventListener('click', (event) => {
    if (event.target.tagName === 'BUTTON' && event.target.closest('#answer-options')) {
        handleAnswerSelection(event);
    }
});

// Sjekk Svar Knapp (Still klokka)
checkAnswerButton.addEventListener('click', handleCheckAnswer);

// Dra-og-slipp + Touch Listeners (uendret)
analogClockElement.addEventListener('mousedown', (e) => { const coords = getPointerCoordinates(e); startDrag(coords.x, coords.y); });
document.addEventListener('mousemove', (e) => { if (!isDragging) return; const coords = getPointerCoordinates(e); drag(coords.x, coords.y); });
document.addEventListener('mouseup', (e) => { if (isDragging) endDrag(); });
analogClockElement.addEventListener('mouseleave', (e) => { if (isDragging && e.target === analogClockElement) endDrag();});
analogClockElement.addEventListener('touchstart', (e) => { e.preventDefault(); const coords = getPointerCoordinates(e); startDrag(coords.x, coords.y); }, { passive: false });
document.addEventListener('touchmove', (e) => { if (!isDragging) return; e.preventDefault(); const coords = getPointerCoordinates(e); drag(coords.x, coords.y); }, { passive: false });
document.addEventListener('touchend', (e) => { if (isDragging) { e.preventDefault(); endDrag(); } });
document.addEventListener('touchcancel', (e) => { if (isDragging) endDrag(); });


// === START APPEN ===
setDefaultPracticeOptions(); // Sett default valg FØR visning
showScreen('setup'); // Vis oppsettskjermen ved start
console.log("App initialized, showing setup screen.");
