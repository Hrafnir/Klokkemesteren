// === DOM Elementer ===
// Start/Setup Screens
const startScreen = document.getElementById('start-screen');
const startGameButton = document.getElementById('start-game-button');
const startPracticeButton = document.getElementById('start-practice-button');
const customPracticeSetup = document.getElementById('custom-practice-setup');
const customPracticeSettings = document.getElementById('custom-practice-settings'); // Inner container
const beginCustomPracticeButton = document.getElementById('begin-custom-practice-button');
const backToStartButton = document.getElementById('back-to-start-button'); // Fra custom setup
const backToStartButtonGameOver = document.getElementById('back-to-start-button-gameover'); // Fra game over

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
const digitalClockDisplay = document.getElementById('digital-clock-display');
const digitalHour = document.getElementById('digital-hour');
const digitalMinute = document.getElementById('digital-minute');
const taskQuestion = document.getElementById('task-question');
const answerOptionsContainer = document.getElementById('answer-options');
const checkAnswerButton = document.getElementById('check-answer-button');
const feedbackElement = document.getElementById('feedback');

// Controls & Game Over
const nextTaskButton = document.getElementById('next-task-button');
const gameOverMessage = document.getElementById('game-over-message');
const finalScoreElement = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button'); // Spill igjen
const exitPracticeButton = document.getElementById('exit-practice-button'); // Avslutt øving

// === Spillstatus & Konstanter ===
let score = 0;
let lives = 3;
const MAX_LIVES = 5; // Maks antall liv man kan ha
const START_LIVES = 3;
const MAX_TIME = 15; // Sekunder per oppgave (kun i spillmodus)
let remainingTime = MAX_TIME;
let taskTimerInterval = null;
let autoNextTaskTimeout = null; // For 3 sekunders forsinkelse
let taskActive = false;
let gameModeActive = false; // Bestemmer om timer/liv/poeng er aktivt
let lastLifeBonusScore = 0;
let isGameOver = false;
let currentTaskMode = ''; // Holder 'read_analog' eller 'set_analog' for gjeldende oppgave
let currentDifficulty = ''; // Holder '1' til '5' for gjeldende oppgave

// Dra-status
let isDragging = false;
let draggedHand = null;
let dragStartX = 0; // For touch vs mouse offset
let dragStartY = 0;

// Tilgjengelige Moduser & Nivåer
const AVAILABLE_MODES = ['read_analog', 'set_analog'];
const AVAILABLE_DIFFICULTIES = ['1', '2', '3', '4', '5'];

// === Init & Skjermhåndtering ===

function showScreen(screenToShow) {
    startScreen.classList.add('hidden');
    customPracticeSetup.classList.add('hidden');
    gameWrapper.classList.add('hidden');
    gameOverMessage.classList.add('hidden'); // Sørg for at denne også skjules

    if (screenToShow === 'start') {
        startScreen.classList.remove('hidden');
    } else if (screenToShow === 'customSetup') {
        customPracticeSetup.classList.remove('hidden');
    } else if (screenToShow === 'game') {
        gameWrapper.classList.remove('hidden');
        // Vis statuslinje kun hvis det er spillmodus
        if (gameModeActive) {
            gameStatusBar.classList.remove('hidden');
        } else {
            gameStatusBar.classList.add('hidden'); // Skjul for øving
        }
        // Vis avslutt-knapp kun hvis det er øvingsmodus
        if (!gameModeActive) {
            exitPracticeButton.classList.remove('hidden');
        } else {
            exitPracticeButton.classList.add('hidden');
        }
    }
}

function initializeGame(isGameMode) {
    console.log(`Initializing ${isGameMode ? 'Game' : 'Practice'} Mode`);
    gameModeActive = isGameMode;
    isGameOver = false;
    taskActive = false; // Ingen aktiv oppgave før den genereres
    clearTimeout(autoNextTaskTimeout); // Fjern eventuell ventende neste oppgave
    stopTaskTimer(); // Stopp eventuell timer

    // Nullstill spillstatus kun hvis det er spillmodus
    if (gameModeActive) {
        score = 0;
        lives = START_LIVES;
        lastLifeBonusScore = 0;
        updateScoreDisplay();
        updateLivesDisplay();
        gameOverMessage.classList.add('hidden'); // Skjul game over
        gameStatusBar.classList.remove('hidden'); // Vis status
        exitPracticeButton.classList.add('hidden'); // Skjul avslutt øving
    } else {
        // Ingen score/liv/timer i øvingsmodus
        gameStatusBar.classList.add('hidden');
        exitPracticeButton.classList.remove('hidden'); // Vis avslutt øving
    }

    // Skjul knapper og feedback
    nextTaskButton.classList.add('hidden');
    checkAnswerButton.classList.add('hidden');
    feedbackElement.textContent = '';
    feedbackElement.className = 'feedback';

    showScreen('game'); // Vis spillområdet
    generateNewTask();
}

// === Klokkefunksjoner (uendret) ===
function setAnalogTime(hour, minute) { /* ... uendret ... */
    const displayHour = hour % 12;
    const minuteDeg = (minute / 60) * 360;
    const hourDeg = ((displayHour / 12) * 360) + ((minute / 60) * 30);
    minuteHand.style.transform = `translateY(-50%) rotate(${minuteDeg + 90}deg)`;
    hourHand.style.transform = `translateY(-50%) rotate(${hourDeg + 90}deg)`;
}
function formatTwoDigits(number) { /* ... uendret ... */
    return number.toString().padStart(2, '0');
}
function setDigitalTime(hour, minute) { /* ... uendret ... */
     digitalHour.textContent = formatTwoDigits(hour % 24);
     digitalMinute.textContent = formatTwoDigits(minute);
}
function displayTime(hour, minute) { /* ... uendret ... */
    currentHour = Math.round(hour);
    currentMinute = Math.round(minute);
    // Sikrer at klokka ikke går over 23:59 eller under 00:00 internt
    currentHour = (currentHour % 24 + 24) % 24; // Holder seg 0-23
    currentMinute = (currentMinute % 60 + 60) % 60; // Holder seg 0-59

    setAnalogTime(currentHour, currentMinute);
    setDigitalTime(currentHour, currentMinute);
}
function timeToText(hour, minute, difficultyLevel) { /* ... uendret ... */
    const difficulty = parseInt(difficultyLevel, 10);
    let displayHour = hour % 12; if (displayHour === 0) displayHour = 12;
    let nextHour = (displayHour % 12) + 1;
    if (minute === 0 && difficulty >= 1) return `Klokka ${displayHour}`;
    if (minute === 30 && difficulty >= 2) return `Halv ${nextHour}`;
    if (minute === 15 && difficulty >= 3) return `Kvart over ${displayHour}`;
    if (minute === 45 && difficulty >= 3) return `Kvart på ${nextHour}`;
    if (difficulty >= 4) {
        if (minute === 5) return `Fem over ${displayHour}`; if (minute === 10) return `Ti over ${displayHour}`;
        if (minute === 20) return `Ti på halv ${nextHour}`; if (minute === 25) return `Fem på halv ${nextHour}`;
        if (minute === 35) return `Fem over halv ${nextHour}`; if (minute === 40) return `Ti over halv ${nextHour}`;
        if (minute === 50) return `Ti på ${nextHour}`; if (minute === 55) return `Fem på ${nextHour}`; }
    if (difficulty >= 5 && minute !== 0 && minute !== 15 && minute !== 30 && minute !== 45) {
         if (minute < 30) return `${minute} ${minute === 1 ? 'minutt' : 'minutter'} over ${displayHour}`;
         else return `${60 - minute} ${60 - minute === 1 ? 'minutt' : 'minutter'} på ${nextHour}`; }
    return `${displayHour}:${formatTwoDigits(minute)}`; // Fallback
}

// === Oppgavegenerering ===
function getRandomTime(difficulty) { /* ... uendret ... */
    let hour = 0; let minute = 0; difficulty = difficulty.toString();
    switch (difficulty) {
        case '1': minute = 0; break; case '2': minute = 30; break;
        case '3': minute = Math.random() < 0.5 ? 15 : 45; break;
        case '4': minute = Math.floor(Math.random() * 12) * 5; break;
        case '5': minute = Math.floor(Math.random() * 60); break;
        default: minute = 0; }
    hour = Math.floor(Math.random() * 12) + 1; // 1-12 for oppgavedefinisjon
    // Konverter til 0-23 internt for konsistens? La oss gjøre det her.
    let internalHour = hour;
    if (Math.random() < 0.5) { // 50% sjanse for PM (hvis ikke 12)
        if (internalHour !== 12) internalHour += 12;
    } else { // AM
        if (internalHour === 12) internalHour = 0; // 12 AM er 0
    }
    return { hour: internalHour, minute }; // Returnerer 0-23 timer
}
function createAnswerOptions(correctHour, correctMinute, difficulty) { /* ... uendret ... */
    answerOptionsContainer.innerHTML = ''; const options = new Set();
    // Bruk korrekt time (0-23) for tekstgenerering
    correctAnswerString = timeToText(correctHour, correctMinute, difficulty);
    options.add(correctAnswerString); let attempts = 0;
    while (options.size < 4 && attempts < 30) {
        const randomTime = getRandomTime(difficulty);
        // Sammenlign interne timer (0-23)
        if (randomTime.hour !== correctHour || randomTime.minute !== correctMinute) {
            const wrongAnswerString = timeToText(randomTime.hour, randomTime.minute, difficulty);
             if(!options.has(wrongAnswerString)){ options.add(wrongAnswerString); } }
        attempts++; }
    while (options.size < 4 && attempts < 50) { /* ... fallback ... */
         const randH = Math.floor(Math.random() * 24); // 0-23 for feil svar
         const randM = Math.floor(Math.random() * 12) * 5;
          if (randH !== correctHour || randM !== correctMinute) {
              const wrongAnswerString = timeToText(randH, randM, Math.max(parseInt(difficulty, 10), 4));
               if(!options.has(wrongAnswerString)){ options.add(wrongAnswerString); } }
         attempts++; }
    const optionsArray = Array.from(options); optionsArray.sort(() => Math.random() - 0.5);
    optionsArray.forEach(optionText => {
        const button = document.createElement('button'); button.textContent = optionText;
        button.addEventListener('click', handleAnswerSelection);
        answerOptionsContainer.appendChild(button); });
}

// === Timer & Spillflyt ===
function startTaskTimer() {
    if (!gameModeActive) return; // Kun i spillmodus
    stopTaskTimer();
    remainingTime = MAX_TIME;
    timerDisplay.textContent = remainingTime;
    timerDisplay.classList.remove('low-time');

    taskTimerInterval = setInterval(() => {
        remainingTime--;
        timerDisplay.textContent = remainingTime;
        if (remainingTime <= 5) { timerDisplay.classList.add('low-time'); }
        else { timerDisplay.classList.remove('low-time'); }
        if (remainingTime <= 0) { handleTimeout(); }
    }, 1000);
}
function stopTaskTimer() {
    clearInterval(taskTimerInterval);
    taskTimerInterval = null;
}
function handleTimeout() {
    if (!taskActive || isGameOver || !gameModeActive) return;
    stopTaskTimer();
    taskActive = false;
    lives--;
    updateLivesDisplay();
    feedbackElement.textContent = "⏰ Tiden er ute!";
    feedbackElement.className = 'feedback incorrect';
    analogClockElement.classList.remove('interactive-clock');
    checkAnswerButton.classList.add('hidden');
    answerOptionsContainer.querySelectorAll('button').forEach(btn => btn.disabled = true);

    if (lives <= 0) {
        gameOver();
    } else {
        // Vis "Neste Oppgave" ved timeout
        nextTaskButton.classList.remove('hidden');
    }
}

function generateNewTask() {
    if (isGameOver) return; // Ikke start ny hvis spillet er over

    console.log("Generating new task...");
    clearTimeout(autoNextTaskTimeout); // Fjern eventuell ventende
    stopTaskTimer();
    taskActive = false; // Sett til false til oppgaven er klar
    feedbackElement.textContent = '';
    feedbackElement.className = 'feedback';
    nextTaskButton.classList.add('hidden'); // Skjul neste-knapp som standard
    checkAnswerButton.classList.add('hidden');
    answerOptionsContainer.classList.remove('hidden');
    analogClockElement.classList.remove('interactive-clock');
    answerOptionsContainer.innerHTML = '';

    if (gameModeActive) {
        currentTaskMode = AVAILABLE_MODES[Math.floor(Math.random() * AVAILABLE_MODES.length)];
        currentDifficulty = AVAILABLE_DIFFICULTIES[Math.floor(Math.random() * AVAILABLE_DIFFICULTIES.length)];
    } else {
        // Egendefinert Øving
        const checkedModes = Array.from(customPracticeSettings.querySelectorAll('input[id^="mode-"]:checked')).map(cb => cb.value);
        const checkedDifficulties = Array.from(customPracticeSettings.querySelectorAll('input[id^="diff-"]:checked')).map(cb => cb.value);

        if (checkedModes.length === 0 || checkedDifficulties.length === 0) {
            feedbackElement.textContent = "Velg minst én oppgavetype og én vanskelighetsgrad!";
            feedbackElement.className = 'feedback incorrect';
            displayTime(12, 0); // Vis en standardtid
            return;
        }
        currentTaskMode = checkedModes[Math.floor(Math.random() * checkedModes.length)];
        currentDifficulty = checkedDifficulties[Math.floor(Math.random() * checkedDifficulties.length)];
    }

    console.log(`   Mode: ${currentTaskMode}, Difficulty: ${currentDifficulty}`);
    const { hour, minute } = getRandomTime(currentDifficulty);
    targetHour = hour; // 0-23
    targetMinute = minute; // 0-59
    console.log(`   Target Time: ${targetHour}:${targetMinute}`);

    if (currentTaskMode === 'set_analog') {
        taskQuestion.textContent = `Still klokka til ${timeToText(targetHour, targetMinute, currentDifficulty)}`;
        displayTime(12, 0); // Nullstill visuelt (12:00)
        currentHour = 12; // Sett interne verdier også
        currentMinute = 0;
        answerOptionsContainer.classList.add('hidden');
        checkAnswerButton.classList.remove('hidden');
        analogClockElement.classList.add('interactive-clock');
    } else if (currentTaskMode === 'read_analog') {
        taskQuestion.textContent = "Hva er klokka?";
        displayTime(targetHour, targetMinute); // Vis måltiden
        createAnswerOptions(targetHour, targetMinute, currentDifficulty);
    } else {
        taskQuestion.textContent = "Ukjent modus?";
        displayTime(12, 0);
        answerOptionsContainer.classList.add('hidden');
    }

    taskActive = true; // NÅ er oppgaven klar og aktiv
    if (gameModeActive) {
        startTaskTimer(); // Start timer kun i spillmodus
    }
}

// === Håndtering av Svar ===
function updateScoreDisplay() { if (gameModeActive) scoreElement.textContent = score; }
function updateLivesDisplay() { if (gameModeActive) livesDisplay.textContent = '❤️'.repeat(Math.max(0, lives));}

function awardPointsAndCheckBonus() {
    if (!gameModeActive) return; // Kun i spillmodus

    const timeUsed = MAX_TIME - remainingTime;
    const taskScore = Math.max(1, 10 - Math.floor(timeUsed));
    score += taskScore;

    // Bonusliv ved hver 100 poeng, men ikke over MAX_LIVES
    if (score >= lastLifeBonusScore + 100) {
        if (lives < MAX_LIVES) {
            lives++;
            feedbackElement.textContent += " + Ekstra Liv! ❤️";
            updateLivesDisplay();
        } else {
             feedbackElement.textContent += " (Maks liv!)";
        }
        // Poeng trekkes *ikke* fra, det er en belønning for å nå milepælen
        lastLifeBonusScore += 100; // Oppdater neste milepæl
    }
    updateScoreDisplay();
}

function handleCorrectAnswer() {
    stopTaskTimer();
    taskActive = false; // Oppgave løst
    feedbackElement.className = 'feedback correct';
    awardPointsAndCheckBonus(); // Gi poeng etc. (hvis gameModeActive)

    // Skjul knapper mens vi venter
    checkAnswerButton.classList.add('hidden');
    answerOptionsContainer.querySelectorAll('button').forEach(btn => btn.disabled = true);
    analogClockElement.classList.remove('interactive-clock');

    // Vent 3 sekunder før neste oppgave
    clearTimeout(autoNextTaskTimeout); // Fjern gammel timeout hvis den finnes
    autoNextTaskTimeout = setTimeout(generateNewTask, 3000);
}

function handleIncorrectAnswer(correctAnswerText) {
    stopTaskTimer();
    taskActive = false; // Oppgave (feil) løst
    feedbackElement.textContent = `Feil. ${correctAnswerText ? 'Riktig var: ' + correctAnswerText : ''}`;
    feedbackElement.className = 'feedback incorrect';

    // Vis "Neste oppgave"-knappen ved feil svar
    nextTaskButton.classList.remove('hidden');
    checkAnswerButton.classList.add('hidden');
    answerOptionsContainer.querySelectorAll('button').forEach(btn => btn.disabled = true);
    analogClockElement.classList.remove('interactive-clock');

    // Trekk liv kun i spillmodus (men ikke ved feil svar, kun timeout)
    // if (gameModeActive) {
    //     lives--; updateLivesDisplay(); if (lives <= 0) gameOver();
    // }
}

// For "Les Klokka"-modus
function handleAnswerSelection(event) {
    if (!taskActive || isGameOver) return;
    const selectedAnswer = event.target.textContent;

    // Visuelt deaktiver knapper
    answerOptionsContainer.querySelectorAll('button').forEach(btn => {
        btn.disabled = true;
        if (btn.textContent === correctAnswerString) btn.classList.add('correct-answer-display');
        else if (btn.textContent === selectedAnswer) btn.classList.add('selected-wrong-answer');
    });

    if (selectedAnswer === correctAnswerString) {
        feedbackElement.textContent = "Riktig! 🎉";
        handleCorrectAnswer();
    } else {
        handleIncorrectAnswer(correctAnswerString);
        // Vis riktig tid på klokka ved feil
        setAnalogTime(targetHour, targetMinute);
        setDigitalTime(targetHour, targetMinute);
    }
}

// For "Still Klokka"-modus
function handleCheckAnswer() {
    if (!taskActive || isGameOver) return;

    // Bruk 12-timers format for sammenligning slik brukeren ser det
    const currentHour12 = currentHour === 0 ? 12 : (currentHour > 12 ? currentHour - 12 : currentHour);
    const targetHour12 = targetHour === 0 ? 12 : (targetHour > 12 ? targetHour - 12 : targetHour);
    // Men minutter er 0-59
    const targetMinutePadded = formatTwoDigits(targetMinute);


    // Streng sjekk: Både time og minutt må stemme nøyaktig
    // Viktig: Sammenlign interne 0-23 timer for logikk
    if (currentHour === targetHour && currentMinute === targetMinute) {
        feedbackElement.textContent = "Riktig stilt! 👍";
         handleCorrectAnswer();
    } else {
        // Gi feedback basert på hva brukeren stilte vs hva som var målet
        const difficultyForText = currentDifficulty || '5';
        handleIncorrectAnswer(`Du stilte ${timeToText(currentHour, currentMinute, difficultyForText)}. Riktig var ${timeToText(targetHour, targetMinute, difficultyForText)}.`);
        // Korriger klokka til riktig tid
        setAnalogTime(targetHour, targetMinute);
        setDigitalTime(targetHour, targetMinute);
    }
}

// === Game Over ===
function gameOver() {
    if (!gameModeActive) return; // Skjer kun i spillmodus
    console.log("Game Over!");
    isGameOver = true;
    stopTaskTimer();
    taskActive = false;
    finalScoreElement.textContent = score;
    gameOverMessage.classList.remove('hidden');
    nextTaskButton.classList.add('hidden');
    checkAnswerButton.classList.add('hidden');
    answerOptionsContainer.innerHTML = '';
    analogClockElement.classList.remove('interactive-clock');
    taskQuestion.textContent = "Spillet er over";
}

// === Dra-og-slipp & Touch Håndtering ===
function getPointerCoordinates(event) {
    let x, y;
    if (event.touches && event.touches.length > 0) {
        // Touch event
        x = event.touches[0].clientX;
        y = event.touches[0].clientY;
    } else if (event.changedTouches && event.changedTouches.length > 0) {
        // Touchend event
        x = event.changedTouches[0].clientX;
        y = event.changedTouches[0].clientY;
    } else {
        // Mouse event
        x = event.clientX;
        y = event.clientY;
    }
    return { x, y };
}

function getAngle(x, y) {
    const rect = analogClockElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);
    angle = (angle + 90 + 360) % 360; // 0 grader = topp (12)
    return angle;
}

function startDrag(x, y) {
    if (!taskActive || isGameOver || currentTaskMode !== 'set_analog') return;

    const angle = getAngle(x, y);
    const minuteAngle = (currentMinute / 60) * 360;
    // Bruk intern 0-23 time for kalkulering
    const hourAngle = ((currentHour % 12) / 12) * 360 + (currentMinute / 60) * 30;

    const diffMinute = Math.min(Math.abs(angle - minuteAngle), 360 - Math.abs(angle - minuteAngle));
    const diffHour = Math.min(Math.abs(angle - hourAngle), 360 - Math.abs(angle - hourAngle));

    // Prioriter minuttviser hvis de er like nære?
    if (diffMinute <= diffHour && diffMinute < 45) { draggedHand = 'minute'; }
    else if (diffHour < 55) { draggedHand = 'hour'; }
    else { draggedHand = null; return; }

    isDragging = true;
    dragStartX = x; // Lagre startpos for eventuell offset-logikk
    dragStartY = y;
    analogClockElement.style.cursor = 'grabbing';
    console.log("Start dragging:", draggedHand);
}

function drag(x, y) {
    if (!isDragging || !taskActive || isGameOver) return;

    const angle = getAngle(x, y);
    let newHour = currentHour; // Start med gjeldende tid
    let newMinute = currentMinute;

    if (draggedHand === 'minute') {
        newMinute = Math.round((angle / 360) * 60) % 60;
        // La timen være uendret, displayTime justerer timeviserens *visuelle* posisjon
    } else if (draggedHand === 'hour') {
        // Kalkuler "ren" timevinkel uten minuttpåvirkning
        let currentMinuteContribution = (currentMinute / 60) * 30; // Grader minuttet bidrar
        let hourAngleWithoutMinutes = (angle - currentMinuteContribution + 360) % 360;
        let preciseHour12 = (hourAngleWithoutMinutes / 360) * 12;

        let roundedHour12 = Math.round(preciseHour12); // 0-11
        if (roundedHour12 === 0) roundedHour12 = 12; // Konverter 0 til 12 for logikk

        // Bevar AM/PM (0-11 vs 12-23) fra før drag startet
        let wasPM = currentHour >= 12;
        if (wasPM) {
            newHour = (roundedHour12 % 12) + 12; // Legg til 12 hvis det ikke er 12 PM
            if (newHour === 24) newHour = 12; // 12 PM
        } else {
            newHour = roundedHour12 % 12; // 12 AM blir 0
        }
        // Minuttet forblir uendret når timeviser dras
        newMinute = currentMinute;
    }

    // Oppdater kun hvis tiden faktisk endret seg
    if (newHour !== currentHour || newMinute !== currentMinute) {
        displayTime(newHour, newMinute);
    }
}

function endDrag() {
    if (!isDragging) return;
    console.log("End dragging");
    isDragging = false;
    draggedHand = null;
    if (taskActive && currentTaskMode === 'set_analog' && !isGameOver) {
       analogClockElement.style.cursor = 'grab';
    } else {
        analogClockElement.style.cursor = 'default';
    }
}

// === Event Listeners ===

// Startskjerm Knapper
startGameButton.addEventListener('click', () => initializeGame(true)); // true = gameMode
startPracticeButton.addEventListener('click', () => showScreen('customSetup'));

// Egendefinert Øving Oppsett Knapper
beginCustomPracticeButton.addEventListener('click', () => initializeGame(false)); // false = practiceMode
backToStartButton.addEventListener('click', () => showScreen('start'));

// Spillkontroll Knapper
nextTaskButton.addEventListener('click', generateNewTask);
restartButton.addEventListener('click', () => initializeGame(true)); // Restart starter alltid spillmodus
backToStartButtonGameOver.addEventListener('click', () => showScreen('start'));
exitPracticeButton.addEventListener('click', () => showScreen('start')); // Tilbake til start fra øving

// Dra-og-slipp + Touch Listeners
// Mouse
analogClockElement.addEventListener('mousedown', (e) => {
    const coords = getPointerCoordinates(e);
    startDrag(coords.x, coords.y);
});
document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const coords = getPointerCoordinates(e);
    drag(coords.x, coords.y);
});
document.addEventListener('mouseup', (e) => {
    if (isDragging) endDrag();
});
analogClockElement.addEventListener('mouseleave', (e) => {
     // Kun stopp hvis vi faktisk dro og musen forlater elementet
     if (isDragging && e.target === analogClockElement) endDrag();
});

// Touch
analogClockElement.addEventListener('touchstart', (e) => {
    // Viktig: Forhindre scrolling mens man interagerer med klokka
    e.preventDefault();
    const coords = getPointerCoordinates(e);
    startDrag(coords.x, coords.y);
}, { passive: false }); // passive: false er nødvendig for preventDefault

document.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    // Forhindre scrolling under drag
    e.preventDefault();
    const coords = getPointerCoordinates(e);
    drag(coords.x, coords.y);
}, { passive: false });

document.addEventListener('touchend', (e) => {
    if (isDragging) {
        e.preventDefault(); // Forhindre "museklikk"-event etter touch
        endDrag();
    }
});
document.addEventListener('touchcancel', (e) => {
     if (isDragging) endDrag();
});


// === START APPEN ===
showScreen('start'); // Vis startskjermen når siden lastes
