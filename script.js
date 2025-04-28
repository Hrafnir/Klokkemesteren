// === DOM Elementer ===
// Setup Screen
const customPracticeSetup = document.getElementById('custom-practice-setup');
const customPracticeSettings = document.getElementById('custom-practice-settings');
const startPracticeButton = document.getElementById('start-practice-button');
const startGameWithSettingsButton = document.getElementById('start-game-with-settings-button');

// Game Wrapper & Status
const gameWrapper = document.getElementById('game-wrapper');
const gameStatusBar = document.getElementById('game-status-bar');
const scoreElement = document.getElementById('score');
const livesDisplay = document.getElementById('lives-display');
const timerDisplay = document.getElementById('timer-display');

// Clock & Task Elements
const analogClockElement = document.getElementById('analog-clock');
const hourHand = document.getElementById('hour-hand');
const minuteHand = document.getElementById('minute-hand');
// NYE referanser for doble digitale klokker
const digitalHourAm = document.getElementById('digital-hour-am');
const digitalMinuteAm = document.getElementById('digital-minute-am');
const digitalHourPm = document.getElementById('digital-hour-pm');
const digitalMinutePm = document.getElementById('digital-minute-pm');
const taskQuestion = document.getElementById('task-question');
const answerOptionsContainer = document.getElementById('answer-options');
const checkAnswerButton = document.getElementById('check-answer-button');
const feedbackElement = document.getElementById('feedback');

// Controls & Game Over
const nextTaskButton = document.getElementById('next-task-button');
const gameOverMessage = document.getElementById('game-over-message');
const finalScoreElement = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');
const backToSettingsButtonGameOver = document.getElementById('back-to-settings-button-gameover');
const changePracticeSettingsButton = document.getElementById('change-practice-settings-button');
const backToSettingsButtonGame = document.getElementById('back-to-settings-button-game');

// === Spillstatus & Konstanter ===
let score = 0; let lives = 3; const MAX_LIVES = 5; const START_LIVES = 3;
const MAX_TIME = 15; let remainingTime = MAX_TIME; let taskTimerInterval = null;
let autoNextTaskTimeout = null; let taskActive = false; let gameModeActive = false;
let lastLifeBonusScore = 0; let isGameOver = false; let currentTaskMode = '';
let currentDifficulty = '';

// Dra-status
let isDragging = false; let draggedHand = null; let dragStartX = 0; let dragStartY = 0;

// Tilgjengelige Moduser & Nivåer
const AVAILABLE_MODES = ['read_analog', 'set_analog'];
const AVAILABLE_DIFFICULTIES = ['1', '2', '3', '4', '5'];


// === Init & Skjermhåndtering ===
function showScreen(screenToShow) { /* ... uendret ... */ customPracticeSetup.classList.add('hidden'); gameWrapper.classList.add('hidden'); gameOverMessage.classList.add('hidden'); if (screenToShow === 'setup') { customPracticeSetup.classList.remove('hidden'); } else if (screenToShow === 'game') { gameWrapper.classList.remove('hidden'); if (gameModeActive) { gameStatusBar.classList.remove('hidden'); changePracticeSettingsButton.classList.add('hidden'); backToSettingsButtonGame.classList.remove('hidden'); } else { gameStatusBar.classList.add('hidden'); changePracticeSettingsButton.classList.remove('hidden'); backToSettingsButtonGame.classList.add('hidden'); } gameOverMessage.classList.add('hidden'); nextTaskButton.classList.add('hidden'); } else if (screenToShow === 'gameOver') { gameWrapper.classList.remove('hidden'); gameOverMessage.classList.remove('hidden'); gameStatusBar.classList.add('hidden'); nextTaskButton.classList.add('hidden'); checkAnswerButton.classList.add('hidden'); changePracticeSettingsButton.classList.add('hidden'); backToSettingsButtonGame.classList.add('hidden'); } }
function initializeGame(isGameMode) { /* ... uendret ... */ console.log(`Initializing ${isGameMode ? 'Game' : 'Practice'} Mode`); gameModeActive = isGameMode; isGameOver = false; taskActive = false; clearTimeout(autoNextTaskTimeout); stopTaskTimer(); if (gameModeActive) { score = 0; lives = START_LIVES; lastLifeBonusScore = 0; updateScoreDisplay(); updateLivesDisplay(); } feedbackElement.textContent = ''; feedbackElement.className = 'feedback'; checkAnswerButton.classList.add('hidden'); showScreen('game'); generateNewTask(); }
function setDefaultPracticeOptions() { /* ... uendret (setter still analog til true) ... */ document.getElementById('mode-read-analog').checked = true; document.getElementById('mode-set-analog').checked = true; document.getElementById('diff-1').checked = true; document.getElementById('diff-2').checked = true; document.getElementById('diff-3').checked = true; document.getElementById('diff-4').checked = false; document.getElementById('diff-5').checked = false; }


// === Klokkefunksjoner ===
function setAnalogTime(hour, minute){ /* ... uendret ... */ const displayHour = hour % 12; const minuteDeg = (minute / 60) * 360; const hourDeg = ((displayHour / 12) * 360) + ((minute / 60) * 30); minuteHand.style.transform = `translateY(-50%) rotate(${minuteDeg + 90}deg)`; hourHand.style.transform = `translateY(-50%) rotate(${hourDeg + 90}deg)`;}
function formatTwoDigits(number){ /* ... uendret ... */ return number.toString().padStart(2, '0');}

// ** OPPDATERT setDigitalTime **
// Viser 12-timers format på begge klokker basert på analog visning
function setDigitalTime(hour, minute) {
     // Kalkuler 12-timers representasjon (1-12)
     let displayHour12 = hour % 12;
     if (displayHour12 === 0) displayHour12 = 12; // 0 og 12 blir 12

     const formattedHour = formatTwoDigits(displayHour12);
     const formattedMinute = formatTwoDigits(minute);

     // Oppdater begge klokkene med samme 12-timers tid
     digitalHourAm.textContent = formattedHour;
     digitalMinuteAm.textContent = formattedMinute;
     digitalHourPm.textContent = formattedHour;
     digitalMinutePm.textContent = formattedMinute;
}

function displayTime(hour, minute){ currentHour = Math.round(hour); currentMinute = Math.round(minute); currentHour = (currentHour % 24 + 24) % 24; currentMinute = (currentMinute % 60 + 60) % 60; setAnalogTime(currentHour, currentMinute); setDigitalTime(currentHour, currentMinute); /* Kaller oppdatert funksjon */ }
function timeToText(hour, minute, difficultyLevel){ /* ... uendret ... */ const difficulty = parseInt(difficultyLevel, 10); let displayHour = hour % 12; if (displayHour === 0) displayHour = 12; let nextHour = (displayHour % 12) + 1; if (minute === 0 && difficulty >= 1) return `Klokka ${displayHour}`; if (minute === 30 && difficulty >= 2) return `Halv ${nextHour}`; if (minute === 15 && difficulty >= 3) return `Kvart over ${displayHour}`; if (minute === 45 && difficulty >= 3) return `Kvart på ${nextHour}`; if (difficulty >= 4) { if (minute === 5) return `Fem over ${displayHour}`; if (minute === 10) return `Ti over ${displayHour}`; if (minute === 20) return `Ti på halv ${nextHour}`; if (minute === 25) return `Fem på halv ${nextHour}`; if (minute === 35) return `Fem over halv ${nextHour}`; if (minute === 40) return `Ti over halv ${nextHour}`; if (minute === 50) return `Ti på ${nextHour}`; if (minute === 55) return `Fem på ${nextHour}`; } if (difficulty >= 5 && minute !== 0 && minute !== 15 && minute !== 30 && minute !== 45) { if (minute < 30) return `${minute} ${minute === 1 ? 'minutt' : 'minutter'} over ${displayHour}`; else return `${60 - minute} ${60 - minute === 1 ? 'minutt' : 'minutter'} på ${nextHour}`; } return `${displayHour}:${formatTwoDigits(minute)}`; }

// === Oppgavegenerering ===
function getRandomTime(difficulty) { /* ... uendret ... */ let hour = 0; let minute = 0; difficulty = difficulty.toString(); switch (difficulty) { case '1': minute = 0; break; case '2': minute = 30; break; case '3': minute = Math.random() < 0.5 ? 15 : 45; break; case '4': minute = Math.floor(Math.random() * 12) * 5; break; case '5': minute = Math.floor(Math.random() * 60); break; default: minute = 0; } hour = Math.floor(Math.random() * 12) + 1; let internalHour = hour; if (Math.random() < 0.5) { if (internalHour !== 12) internalHour += 12; } else { if (internalHour === 12) internalHour = 0; } return { hour: internalHour, minute }; }
function createAnswerOptions(correctHour, correctMinute, difficulty) { /* ... uendret ... */ answerOptionsContainer.innerHTML = ''; const options = new Set(); correctAnswerString = timeToText(correctHour, correctMinute, difficulty); options.add(correctAnswerString); let attempts = 0; while (options.size < 4 && attempts < 30) { const randomTime = getRandomTime(difficulty); if (randomTime.hour !== correctHour || randomTime.minute !== correctMinute) { const wrongAnswerString = timeToText(randomTime.hour, randomTime.minute, difficulty); if(!options.has(wrongAnswerString)){ options.add(wrongAnswerString); } } attempts++; } while (options.size < 4 && attempts < 50) { const randH = Math.floor(Math.random() * 24); const randM = Math.floor(Math.random() * 12) * 5; if (randH !== correctHour || randM !== correctMinute) { const wrongAnswerString = timeToText(randH, randM, Math.max(parseInt(difficulty, 10), 4)); if(!options.has(wrongAnswerString)){ options.add(wrongAnswerString); } } attempts++; } const optionsArray = Array.from(options); optionsArray.sort(() => Math.random() - 0.5); optionsArray.forEach(optionText => { const button = document.createElement('button'); button.textContent = optionText; answerOptionsContainer.appendChild(button); }); }

// === Timer & Spillflyt ===
function startTaskTimer() { /* ... uendret ... */ if (!gameModeActive) return; stopTaskTimer(); remainingTime = MAX_TIME; timerDisplay.textContent = remainingTime; timerDisplay.classList.remove('low-time'); taskTimerInterval = setInterval(() => { remainingTime--; timerDisplay.textContent = remainingTime; if (remainingTime <= 5) { timerDisplay.classList.add('low-time'); } else { timerDisplay.classList.remove('low-time'); } if (remainingTime <= 0) { handleTimeout(); } }, 1000); }
function stopTaskTimer() { /* ... uendret ... */ clearInterval(taskTimerInterval); taskTimerInterval = null; }
function handleTimeout() { /* ... uendret ... */ if (!taskActive || isGameOver || !gameModeActive) return; stopTaskTimer(); taskActive = false; lives--; updateLivesDisplay(); feedbackElement.textContent = "⏰ Tiden er ute!"; feedbackElement.className = 'feedback incorrect'; analogClockElement.classList.remove('interactive-clock'); checkAnswerButton.classList.add('hidden'); answerOptionsContainer.querySelectorAll('button').forEach(btn => btn.disabled = true); if (lives <= 0) { gameOver(); } else { nextTaskButton.classList.remove('hidden'); } }
function generateNewTask() { /* ... uendret ... */ if (isGameOver) return; console.log("generateNewTask: Starting..."); clearTimeout(autoNextTaskTimeout); stopTaskTimer(); taskActive = false; console.log("generateNewTask: taskActive set to false"); feedbackElement.textContent = ''; feedbackElement.className = 'feedback'; nextTaskButton.classList.add('hidden'); checkAnswerButton.classList.add('hidden'); answerOptionsContainer.classList.remove('hidden'); analogClockElement.classList.remove('interactive-clock'); answerOptionsContainer.innerHTML = ''; const checkedModes = Array.from(customPracticeSettings.querySelectorAll('input[id^="mode-"]:checked')).map(cb => cb.value); const checkedDifficulties = Array.from(customPracticeSettings.querySelectorAll('input[id^="diff-"]:checked')).map(cb => cb.value); if (checkedModes.length === 0 || checkedDifficulties.length === 0) { feedbackElement.textContent = "Velg minst én oppgavetype og én vanskelighetsgrad i innstillingene!"; feedbackElement.className = 'feedback incorrect'; displayTime(12, 0); taskActive = false; showScreen('setup'); return; } currentTaskMode = checkedModes[Math.floor(Math.random() * checkedModes.length)]; currentDifficulty = checkedDifficulties[Math.floor(Math.random() * checkedDifficulties.length)]; console.log(`generateNewTask: Mode=${currentTaskMode}, Difficulty=${currentDifficulty}`); const { hour, minute } = getRandomTime(currentDifficulty); targetHour = hour; targetMinute = minute; console.log(`   Target Time: ${targetHour}:${targetMinute}`); if (currentTaskMode === 'set_analog') { taskQuestion.textContent = `Still klokka til ${timeToText(targetHour, targetMinute, currentDifficulty)}`; displayTime(12, 0); currentHour = 12; currentMinute = 0; answerOptionsContainer.classList.add('hidden'); checkAnswerButton.classList.remove('hidden'); analogClockElement.classList.add('interactive-clock'); } else if (currentTaskMode === 'read_analog') { taskQuestion.textContent = "Hva er klokka?"; displayTime(targetHour, targetMinute); createAnswerOptions(targetHour, targetMinute, currentDifficulty); } else { taskQuestion.textContent = "Ukjent modus?"; displayTime(12, 0); answerOptionsContainer.classList.add('hidden'); } taskActive = true; console.log("generateNewTask: Task setup complete. taskActive set to true."); if (gameModeActive) { startTaskTimer(); } }

// === Håndtering av Svar ===
function updateScoreDisplay(){ /* ... uendret ... */ if (gameModeActive) scoreElement.textContent = score; }
function updateLivesDisplay(){ /* ... uendret ... */ if (gameModeActive) livesDisplay.textContent = '❤️'.repeat(Math.max(0, lives));}
function awardPointsAndCheckBonus(){ /* ... uendret ... */ if (!gameModeActive) return; const timeUsed = MAX_TIME - remainingTime; const taskScore = Math.max(1, 10 - Math.floor(timeUsed)); score += taskScore; if (score >= lastLifeBonusScore + 100) { if (lives < MAX_LIVES) { lives++; feedbackElement.textContent += " + Ekstra Liv! ❤️"; updateLivesDisplay(); } else { feedbackElement.textContent += " (Maks liv!)"; } lastLifeBonusScore += 100; } updateScoreDisplay(); }
function handleCorrectAnswer() { /* ... uendret ... */ console.log("handleCorrectAnswer called"); if (!taskActive) return; stopTaskTimer(); taskActive = false; console.log("handleCorrectAnswer: taskActive set to false"); feedbackElement.className = 'feedback correct'; awardPointsAndCheckBonus(); checkAnswerButton.classList.add('hidden'); answerOptionsContainer.querySelectorAll('button').forEach(btn => btn.disabled = true); analogClockElement.classList.remove('interactive-clock'); clearTimeout(autoNextTaskTimeout); console.log("handleCorrectAnswer: Starting 3s timeout for next task"); autoNextTaskTimeout = setTimeout(() => { console.log("handleCorrectAnswer: Timeout finished, generating next task"); generateNewTask(); }, 3000); }
function handleIncorrectAnswer(correctAnswerText) { /* ... uendret ... */ console.log("handleIncorrectAnswer called"); if (!taskActive) return; stopTaskTimer(); taskActive = false; console.log("handleIncorrectAnswer: taskActive set to false"); feedbackElement.textContent = `Feil. ${correctAnswerText ? 'Riktig var: ' + correctAnswerText : ''}`; feedbackElement.className = 'feedback incorrect'; checkAnswerButton.classList.add('hidden'); answerOptionsContainer.querySelectorAll('button').forEach(btn => btn.disabled = true); analogClockElement.classList.remove('interactive-clock'); nextTaskButton.classList.remove('hidden'); console.log("handleIncorrectAnswer: Showing 'Next Task' button"); }
function handleAnswerSelection(event) { /* ... uendret ... */ console.log("handleAnswerSelection called via delegation! Button:", event.target.textContent); console.log(`   State check: taskActive=${taskActive}, isGameOver=${isGameOver}`); if (!taskActive || isGameOver) { console.log("   handleAnswerSelection blocked by state."); return; } const selectedAnswer = event.target.textContent; answerOptionsContainer.querySelectorAll('button').forEach(btn => { btn.disabled = true; if (btn.textContent === correctAnswerString) btn.classList.add('correct-answer-display'); else if (btn === event.target) btn.classList.add('selected-wrong-answer'); }); if (selectedAnswer === correctAnswerString) { feedbackElement.textContent = "Riktig! 🎉"; handleCorrectAnswer(); } else { handleIncorrectAnswer(correctAnswerString); setAnalogTime(targetHour, targetMinute); setDigitalTime(targetHour, targetMinute); } }
function handleCheckAnswer() { /* ... uendret (bruker modulo 12) ... */ console.log("handleCheckAnswer called!"); console.log(`   State check: taskActive=${taskActive}, isGameOver=${isGameOver}`); if (!taskActive || isGameOver) { console.log("   handleCheckAnswer blocked by state."); return; } const currentHourMod12 = currentHour % 12; const targetHourMod12 = targetHour % 12; if (currentHourMod12 === targetHourMod12 && currentMinute === targetMinute) { feedbackElement.textContent = "Riktig stilt! 👍"; handleCorrectAnswer(); } else { const difficultyForText = currentDifficulty || '5'; const userTimeString = timeToText(currentHour, currentMinute, difficultyForText); const correctTimeString = timeToText(targetHour, targetMinute, difficultyForText); handleIncorrectAnswer(`Du stilte ${userTimeString}. Riktig var ${correctTimeString}.`); setAnalogTime(targetHour, targetMinute); setDigitalTime(targetHour, targetMinute); } }

// === Game Over ===
function gameOver() { /* ... uendret ... */ if (!gameModeActive) return; console.log("Game Over!"); isGameOver = true; stopTaskTimer(); taskActive = false; finalScoreElement.textContent = score; showScreen('gameOver'); }


// === Dra-og-slipp & Touch Håndtering ===

// ** NY Funksjon for å finne minste intervall **
function getSmallestIntervalStep() {
    if (document.getElementById('diff-5').checked) return 1; // Alle minutter
    if (document.getElementById('diff-4').checked) return 5; // 5-minutter
    if (document.getElementById('diff-3').checked) return 15; // Kvart
    if (document.getElementById('diff-2').checked) return 30; // Halv
    if (document.getElementById('diff-1').checked) return 60; // Hel (teknisk sett 60 min)
    return 1; // Fallback
}

function getPointerCoordinates(event){ /* ... uendret ... */ let x, y; if (event.touches && event.touches.length > 0) { x = event.touches[0].clientX; y = event.touches[0].clientY; } else if (event.changedTouches && event.changedTouches.length > 0) { x = event.changedTouches[0].clientX; y = event.changedTouches[0].clientY; } else { x = event.clientX; y = event.clientY; } return { x, y }; }
function getAngle(x, y){ /* ... uendret ... */ const rect = analogClockElement.getBoundingClientRect(); const centerX = rect.left + rect.width / 2; const centerY = rect.top + rect.height / 2; let angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI); angle = (angle + 90 + 360) % 360; return angle; }
function startDrag(x, y) { /* ... uendret ... */ console.log(`startDrag attempt: taskActive=${taskActive}, isGameOver=${isGameOver}, mode=${currentTaskMode}`); if (!taskActive || isGameOver || currentTaskMode !== 'set_analog') return; const angle = getAngle(x, y); const minuteAngle = (currentMinute / 60) * 360; const hourAngle = ((currentHour % 12) / 12) * 360 + (currentMinute / 60) * 30; const diffMinute = Math.min(Math.abs(angle - minuteAngle), 360 - Math.abs(angle - minuteAngle)); const diffHour = Math.min(Math.abs(angle - hourAngle), 360 - Math.abs(angle - hourAngle)); if (diffMinute <= diffHour && diffMinute < 45) { draggedHand = 'minute'; } else if (diffHour < 55) { draggedHand = 'hour'; } else { draggedHand = null; return; } isDragging = true; dragStartX = x; dragStartY = y; analogClockElement.style.cursor = 'grabbing'; console.log("Start dragging:", draggedHand); }

// ** OPPDATERT drag() med snapping **
function drag(x, y) {
    if (!isDragging || !taskActive || isGameOver) return;

    const angle = getAngle(x, y);
    let newHour = currentHour; // Start med gjeldende tid
    let newMinute = currentMinute;

    // --- Snapping Logic ---
    const step = getSmallestIntervalStep(); // Få minste intervall (1, 5, 15, 30, 60)
    const rawMinuteFromAngle = (angle / 360) * 60; // Rå minuttverdi fra vinkel
    // Rund av til nærmeste intervall
    let snappedMinute = Math.round(rawMinuteFromAngle / step) * step;
    // Sørg for at det er innenfor 0-59 (spesielt viktig for step=60)
    snappedMinute = (snappedMinute % 60 + 60) % 60;
    // --- End Snapping Logic ---

    if (draggedHand === 'minute') {
        newMinute = snappedMinute;
        // newHour forblir currentHour, displayTime justerer visuelt
    } else if (draggedHand === 'hour') {
        // Kalkuler time basert på vinkel (som før)
        let currentMinuteContribution = (currentMinute / 60) * 30; // Bruk *nåværende* minutt her? Eller snapped? La oss bruke currentMinute for nå.
        let hourAngleWithoutMinutes = (angle - currentMinuteContribution + 360) % 360;
        let preciseHour12 = (hourAngleWithoutMinutes / 360) * 12;
        let roundedHour12 = Math.round(preciseHour12);
        if (roundedHour12 === 0) roundedHour12 = 12;
        let wasPM = currentHour >= 12;
        if (wasPM) { newHour = (roundedHour12 % 12) + 12; if (newHour === 24) newHour = 12; }
        else { newHour = roundedHour12 % 12; }

        // Sett minuttet til den snapped verdien, selv når time dras
        newMinute = snappedMinute;
    }

    // Oppdater kun hvis tiden faktisk endret seg (eller snappet til ny verdi)
    if (newHour !== currentHour || newMinute !== currentMinute) {
        displayTime(newHour, newMinute);
    }
}

function endDrag() { /* ... uendret ... */ if (!isDragging) return; console.log("End dragging"); isDragging = false; draggedHand = null; if (taskActive && currentTaskMode === 'set_analog' && !isGameOver) { analogClockElement.style.cursor = 'grab'; } else { analogClockElement.style.cursor = 'default'; } }

// === Event Listeners (uendret) ===
// Setup Skjerm
startPracticeButton.addEventListener('click', () => initializeGame(false));
startGameWithSettingsButton.addEventListener('click', () => initializeGame(true));
// Spillkontroller
nextTaskButton.addEventListener('click', generateNewTask);
restartButton.addEventListener('click', () => initializeGame(true));
backToSettingsButtonGameOver.addEventListener('click', () => showScreen('setup'));
changePracticeSettingsButton.addEventListener('click', () => showScreen('setup'));
backToSettingsButtonGame.addEventListener('click', () => showScreen('setup'));
// Svar Knapper (Event Delegation)
answerOptionsContainer.addEventListener('click', (event) => { if (event.target.tagName === 'BUTTON' && event.target.closest('#answer-options')) { handleAnswerSelection(event); } });
// Sjekk Svar Knapp (Still klokka)
checkAnswerButton.addEventListener('click', handleCheckAnswer);
// Dra-og-slipp + Touch Listeners
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
