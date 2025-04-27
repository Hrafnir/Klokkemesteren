// --- DOM Elementer ---
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
const scoreElement = document.getElementById('score');
const livesDisplay = document.getElementById('lives-display'); // NY
const timerDisplay = document.getElementById('timer-display'); // NY
const nextTaskButton = document.getElementById('next-task-button');
const gameOverMessage = document.getElementById('game-over-message'); // NY
const finalScoreElement = document.getElementById('final-score'); // NY
const restartButton = document.getElementById('restart-button'); // NY
const gameModeSelect = document.getElementById('game-mode-select'); // NY (erstatter modeSelect)
const customPracticeSettings = document.getElementById('custom-practice-settings'); // NY
// Checkboxes (hentes dynamisk ved behov)

// --- Spillstatus ---
let score = 0;
let lives = 3; // Start med 3 liv
const MAX_TIME = 15; // Sekunder per oppgave
let remainingTime = MAX_TIME;
let taskTimerInterval = null; // Holder ID for setInterval
let taskActive = false; // Er en oppgave i gang?
let gameModeActive = true; // Er vi i Spillmodus?
let lastLifeBonusScore = 0; // Holder styr på når siste bonusliv ble gitt
let isGameOver = false;

// --- Mål og Nåværende Tid ---
let currentHour = 0;
let currentMinute = 0;
let targetHour = 0;
let targetMinute = 0;
let correctAnswerString = "";

// --- Dra-status ---
let isDragging = false;
let draggedHand = null;

// --- Tilgjengelige Moduser & Nivåer ---
const AVAILABLE_MODES = ['read_analog', 'set_analog']; // Utvid denne når nye moduser lages
const AVAILABLE_DIFFICULTIES = ['1', '2', '3', '4', '5'];


// === INITIALISERING & GRUNNFUNKSJONER ===

function initializeGame() {
    score = 0;
    lives = 3;
    lastLifeBonusScore = 0;
    isGameOver = false;
    updateScoreDisplay();
    updateLivesDisplay();
    gameOverMessage.classList.add('hidden');
    nextTaskButton.classList.add('hidden'); // Skjul i starten
    checkAnswerButton.classList.add('hidden');
    // Sjekk hvilken spilltype som er valgt ved start
    toggleCustomSettings(gameModeSelect.value === 'custom');
    generateNewTask();
}

function updateScoreDisplay() {
    scoreElement.textContent = score;
}

function updateLivesDisplay() {
    livesDisplay.textContent = '❤️'.repeat(Math.max(0, lives)); // Vis hjerter
}

function toggleCustomSettings(show) {
    gameModeActive = !show;
    if (show) {
        customPracticeSettings.classList.remove('hidden');
    } else {
        customPracticeSettings.classList.add('hidden');
    }
}

// === KLOKKEFUNKSJONER === (Samme som før, ingen store endringer her)

function setAnalogTime(hour, minute) {
    const displayHour = hour % 12;
    const minuteDeg = (minute / 60) * 360;
    const hourDeg = ((displayHour / 12) * 360) + ((minute / 60) * 30);
    minuteHand.style.transform = `translateY(-50%) rotate(${minuteDeg + 90}deg)`;
    hourHand.style.transform = `translateY(-50%) rotate(${hourDeg + 90}deg)`;
}

function formatTwoDigits(number) {
    return number.toString().padStart(2, '0');
}

function setDigitalTime(hour, minute) {
     digitalHour.textContent = formatTwoDigits(hour % 24);
     digitalMinute.textContent = formatTwoDigits(minute);
}

function displayTime(hour, minute) {
    currentHour = Math.round(hour);
    currentMinute = Math.round(minute);
    setAnalogTime(currentHour, currentMinute);
    setDigitalTime(currentHour, currentMinute);
}

function timeToText(hour, minute, difficultyLevel) {
    // Konverterer tallverdi (1-5) til et minimumsnivå for tekstformat
    const difficulty = parseInt(difficultyLevel, 10);
    let displayHour = hour % 12;
    if (displayHour === 0) displayHour = 12;
    let nextHour = (displayHour % 12) + 1;

    if (minute === 0 && difficulty >= 1) return `Klokka ${displayHour}`;
    if (minute === 30 && difficulty >= 2) return `Halv ${nextHour}`;
    if (minute === 15 && difficulty >= 3) return `Kvart over ${displayHour}`;
    if (minute === 45 && difficulty >= 3) return `Kvart på ${nextHour}`;

    if (difficulty >= 4) {
        if (minute === 5) return `Fem over ${displayHour}`;
        if (minute === 10) return `Ti over ${displayHour}`;
        if (minute === 20) return `Ti på halv ${nextHour}`;
        if (minute === 25) return `Fem på halv ${nextHour}`;
        if (minute === 35) return `Fem over halv ${nextHour}`;
        if (minute === 40) return `Ti over halv ${nextHour}`;
        if (minute === 50) return `Ti på ${nextHour}`;
        if (minute === 55) return `Fem på ${nextHour}`;
    }

     if (difficulty >= 5 && minute !== 0 && minute !== 15 && minute !== 30 && minute !== 45) {
         if (minute < 30) {
            return `${minute} ${minute === 1 ? 'minutt' : 'minutter'} over ${displayHour}`;
         } else {
             return `${60 - minute} ${60 - minute === 1 ? 'minutt' : 'minutter'} på ${nextHour}`;
         }
     }

    // Fallback hvis ingen tekst passer (f.eks. nivå 1 ber om 05 min)
    return `${displayHour}:${formatTwoDigits(minute)}`;
}


// === OPPGAVEGENERERING ===

function getRandomTime(difficulty) {
    let hour = 0;
    let minute = 0;
    difficulty = difficulty.toString(); // Sørg for at det er en streng

    switch (difficulty) {
        case '1': minute = 0; break;
        case '2': minute = 30; break;
        case '3': minute = Math.random() < 0.5 ? 15 : 45; break;
        case '4': minute = Math.floor(Math.random() * 12) * 5; break;
        case '5': minute = Math.floor(Math.random() * 60); break;
        default: minute = 0; // Fallback
    }
    hour = Math.floor(Math.random() * 12) + 1; // 1-12
    return { hour, minute };
}

function createAnswerOptions(correctHour, correctMinute, difficulty) {
    // ... (Samme logikk som før for å lage knapper) ...
    answerOptionsContainer.innerHTML = '';
    const options = new Set();
    correctAnswerString = timeToText(correctHour, correctMinute, difficulty);
    options.add(correctAnswerString);

    let attempts = 0;
    while (options.size < 4 && attempts < 30) { // Økt grense litt
        // Viktig: Generer feil svar basert på SAMME vanskelighetsgrad
        const randomTime = getRandomTime(difficulty);
        if (randomTime.hour !== correctHour || randomTime.minute !== correctMinute) {
            const wrongAnswerString = timeToText(randomTime.hour, randomTime.minute, difficulty);
             if(!options.has(wrongAnswerString)){
                 options.add(wrongAnswerString);
             }
        }
        attempts++;
    }
     // Fyll på med enkle feil om nødvendig
     while (options.size < 4 && attempts < 50) {
         const randH = Math.floor(Math.random() * 12) + 1;
         const randM = Math.floor(Math.random() * 12) * 5;
          if (randH !== correctHour || randM !== correctMinute) {
              const wrongAnswerString = timeToText(randH, randM, Math.max(parseInt(difficulty, 10), 4));
               if(!options.has(wrongAnswerString)){
                 options.add(wrongAnswerString);
             }
          }
         attempts++;
     }

    const optionsArray = Array.from(options);
    optionsArray.sort(() => Math.random() - 0.5);

    optionsArray.forEach(optionText => {
        const button = document.createElement('button');
        button.textContent = optionText;
        button.addEventListener('click', handleAnswerSelection);
        answerOptionsContainer.appendChild(button);
    });
}

// === TIMER OG SPILLFLYT ===

function startTaskTimer() {
    stopTaskTimer(); // Stopp eventuell gammel timer
    remainingTime = MAX_TIME;
    timerDisplay.textContent = remainingTime;
    timerDisplay.classList.remove('low-time');
    taskActive = true; // Oppgaven starter NÅ

    taskTimerInterval = setInterval(() => {
        remainingTime--;
        timerDisplay.textContent = remainingTime;

        if (remainingTime <= 5) {
            timerDisplay.classList.add('low-time');
        } else {
            timerDisplay.classList.remove('low-time');
        }

        if (remainingTime <= 0) {
            handleTimeout();
        }
    }, 1000); // Kjør hvert sekund
}

function stopTaskTimer() {
    clearInterval(taskTimerInterval);
    taskTimerInterval = null;
}

function handleTimeout() {
    if (!taskActive) return; // Ikke gjør noe hvis oppgaven allerede er besvart/avbrutt
    stopTaskTimer();
    taskActive = false;
    lives--;
    updateLivesDisplay();
    feedbackElement.textContent = "⏰ Tiden er ute!";
    feedbackElement.className = 'feedback incorrect';
    analogClockElement.classList.remove('interactive-clock');
    checkAnswerButton.classList.add('hidden');
    // Deaktiver svaralternativer hvis de finnes
    answerOptionsContainer.querySelectorAll('button').forEach(btn => btn.disabled = true);

    if (lives <= 0) {
        gameOver();
    } else {
        nextTaskButton.classList.remove('hidden');
    }
}

function generateNewTask() {
    if (isGameOver) return; // Ikke start ny oppgave hvis spillet er over

    stopTaskTimer(); // Stopp forrige timer
    taskActive = false; // Midlertidig inaktiv mens vi setter opp
    feedbackElement.textContent = '';
    feedbackElement.className = 'feedback';
    nextTaskButton.classList.add('hidden');
    checkAnswerButton.classList.add('hidden');
    answerOptionsContainer.classList.remove('hidden');
    analogClockElement.classList.remove('interactive-clock');
    answerOptionsContainer.innerHTML = ''; // Tøm gamle knapper

    let selectedMode = '';
    let selectedDifficulty = '';

    if (gameModeActive) {
        // --- Spillmodus ---
        selectedMode = AVAILABLE_MODES[Math.floor(Math.random() * AVAILABLE_MODES.length)];
        selectedDifficulty = AVAILABLE_DIFFICULTIES[Math.floor(Math.random() * AVAILABLE_DIFFICULTIES.length)];
    } else {
        // --- Egendefinert Øving ---
        const checkedModes = Array.from(customPracticeSettings.querySelectorAll('input[id^="mode-"]:checked')).map(cb => cb.value);
        const checkedDifficulties = Array.from(customPracticeSettings.querySelectorAll('input[id^="diff-"]:checked')).map(cb => cb.value);

        if (checkedModes.length === 0 || checkedDifficulties.length === 0) {
            feedbackElement.textContent = "Velg minst én oppgavetype og én vanskelighetsgrad!";
            feedbackElement.className = 'feedback incorrect';
            // Sett en standardtid for å unngå feil, men ikke start timer?
            displayTime(12, 0);
            return; // Ikke fortsett
        }
        selectedMode = checkedModes[Math.floor(Math.random() * checkedModes.length)];
        selectedDifficulty = checkedDifficulties[Math.floor(Math.random() * checkedDifficulties.length)];
    }

    // Generer måltiden basert på valgt vanskelighetsgrad
    const { hour, minute } = getRandomTime(selectedDifficulty);
    targetHour = hour;
    targetMinute = minute;

    // Sett opp oppgaven basert på valgt modus
    if (selectedMode === 'set_analog') {
        taskQuestion.textContent = `Still klokka til ${timeToText(targetHour, targetMinute, selectedDifficulty)}`;
        displayTime(12, 0); // Nullstill for bruker
        currentHour = 12;
        currentMinute = 0;
        answerOptionsContainer.classList.add('hidden');
        checkAnswerButton.classList.remove('hidden');
        analogClockElement.classList.add('interactive-clock');
    } else if (selectedMode === 'read_analog') {
        taskQuestion.textContent = "Hva er klokka?";
        displayTime(targetHour, targetMinute);
        createAnswerOptions(targetHour, targetMinute, selectedDifficulty);
    } else {
        taskQuestion.textContent = "Ukjent modus valgt?";
        displayTime(12, 0);
        answerOptionsContainer.classList.add('hidden');
    }

    startTaskTimer(); // Starter nedtellingen NÅ
}

// === HÅNDTERING AV SVAR ===

function awardPointsAndCheckBonus() {
    const timeUsed = MAX_TIME - remainingTime;
    // Poeng: Minst 1, maks 10. Færre poeng jo lengre tid brukt.
    const taskScore = Math.max(1, 10 - Math.floor(timeUsed));
    score += taskScore;

    // Sjekk for bonusliv
    if (score >= lastLifeBonusScore + 100) {
        lives++;
        score -= 100; // Trekk fra poeng for bonuslivet
        lastLifeBonusScore += 100; // Oppdater terskelen
        updateLivesDisplay();
        feedbackElement.textContent += " + Ekstra Liv! ❤️"; // Legg til i feedback
    }
    updateScoreDisplay();
}

// For "Les Klokka"-modus
function handleAnswerSelection(event) {
    if (!taskActive) return;
    stopTaskTimer(); // Stopp timeren
    taskActive = false;
    const selectedAnswer = event.target.textContent;

    answerOptionsContainer.querySelectorAll('button').forEach(btn => {
        btn.disabled = true;
        if (btn.textContent === correctAnswerString) btn.classList.add('correct-answer-display');
        else if (btn.textContent === selectedAnswer) btn.classList.add('selected-wrong-answer');
    });

    if (selectedAnswer === correctAnswerString) {
        feedbackElement.textContent = "Riktig! 🎉";
        feedbackElement.className = 'feedback correct';
        awardPointsAndCheckBonus(); // Gi poeng og sjekk bonus
    } else {
        feedbackElement.textContent = `Feil. Riktig var: ${correctAnswerString}`;
        feedbackElement.className = 'feedback incorrect';
        // Ingen poeng for feil svar
    }

    if (lives <= 0) { // Dobbeltsjekk etter poengberegning
         gameOver();
    } else {
        nextTaskButton.classList.remove('hidden');
    }
}

// For "Still Klokka"-modus
function handleCheckAnswer() {
    if (!taskActive) return;
    stopTaskTimer(); // Stopp timeren
    taskActive = false;
    analogClockElement.classList.remove('interactive-clock');

    const currentHour12 = currentHour % 12 === 0 ? 12 : currentHour % 12;
    const targetHour12 = targetHour % 12 === 0 ? 12 : targetHour % 12;

    // Streng sjekk: Både time og minutt må være helt likt
    if (currentHour12 === targetHour12 && currentMinute === targetMinute) {
        feedbackElement.textContent = "Riktig stilt! 👍";
        feedbackElement.className = 'feedback correct';
        awardPointsAndCheckBonus(); // Gi poeng og sjekk bonus
    } else {
        // Hent vanskelighetsgrad for korrekt tekstvisning
         const difficultyForText = gameModeActive ? '5' : Array.from(customPracticeSettings.querySelectorAll('input[id^="diff-"]:checked')).map(cb => cb.value).sort().pop() || '5'; // Høyeste valgte, eller 5
        feedbackElement.textContent = `Nesten! Du stilte ${timeToText(currentHour, currentMinute, difficultyForText)}. Riktig var ${timeToText(targetHour, targetMinute, difficultyForText)}.`;
        feedbackElement.className = 'feedback incorrect';
        setAnalogTime(targetHour, targetMinute); // Vis riktig svar
        setDigitalTime(targetHour, targetMinute);
        // Ingen poeng for feil svar
    }

    checkAnswerButton.classList.add('hidden');
     if (lives <= 0) { // Dobbeltsjekk etter poengberegning
         gameOver();
     } else {
         nextTaskButton.classList.remove('hidden');
     }
}

// === GAME OVER ===

function gameOver() {
    isGameOver = true;
    stopTaskTimer();
    taskActive = false;
    finalScoreElement.textContent = score;
    gameOverMessage.classList.remove('hidden');
    nextTaskButton.classList.add('hidden'); // Skjul "Neste"
    checkAnswerButton.classList.add('hidden');
    answerOptionsContainer.innerHTML = ''; // Tøm eventuelle knapper
    analogClockElement.classList.remove('interactive-clock');
    taskQuestion.textContent = "Spillet er over";
}


// === DRA-OG-SLIPP === (Samme som før, men sjekker `taskActive`)

function getAngle(event) {
    // ... (samme som før) ...
     const rect = analogClockElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    let angle = Math.atan2(mouseY - centerY, mouseX - centerX) * (180 / Math.PI);
    angle = (angle + 90 + 360) % 360;
    return angle;
}

function handleMouseDown(event) {
    if (!taskActive || isGameOver || gameModeSelect.value === 'read_analog' || !analogClockElement.classList.contains('interactive-clock')) return;
    event.preventDefault();
    const angle = getAngle(event);

    // Forenklet valg av viser basert på vinkel (kan forbedres)
     const minuteAngle = (currentMinute / 60) * 360;
    let currentHour12 = currentHour % 12;
    const hourAngle = ((currentHour12 / 12) * 360) + (currentMinute / 60) * 30;

    const diffMinute = Math.min(Math.abs(angle - minuteAngle), 360 - Math.abs(angle - minuteAngle));
    const diffHour = Math.min(Math.abs(angle - hourAngle), 360 - Math.abs(angle - hourAngle));

    if (diffMinute < diffHour && diffMinute < 40) { // Økt toleranse litt
         draggedHand = 'minute';
    } else if (diffHour < 50) { // Økt toleranse litt
         draggedHand = 'hour';
    } else {
        draggedHand = null;
        return;
    }
    isDragging = true;
    analogClockElement.style.cursor = 'grabbing';
}

function handleMouseMove(event) {
    if (!isDragging || !taskActive || isGameOver) return;

    const angle = getAngle(event);
    let newHour = currentHour;
    let newMinute = currentMinute;

    if (draggedHand === 'minute') {
        newMinute = Math.round((angle / 360) * 60) % 60;
        // La time være som den var, displayTime() justerer den visuelt
        newHour = currentHour;
    } else if (draggedHand === 'hour') {
        // Mer presis timeberegning basert på vinkel
        let preciseHour12 = (angle / 360) * 12;
         // Timeviserens posisjon påvirkes OGSÅ av eksisterende minutt når vi IKKE drar minuttviseren
         // Vi må trekke fra minuttpåvirkningen for å finne den "rene" timeverdien fra vinkelen
         let minuteContributionToHourAngle = (currentMinute / 60) * 30; // 30 grader per time
         let hourAngleWithoutMinutes = (angle - (minuteContributionToHourAngle % 360) + 360) % 360;
         preciseHour12 = (hourAngleWithoutMinutes / 360) * 12;

        newHour = Math.round(preciseHour12);
        // Juster for 24-timers format internt (0-23) basert på rundet 12-timers verdi
         // Behold AM/PM fra currentHour? Anta at brukeren ikke bytter AM/PM ved å dra timeviser alene.
         let baseHour = Math.floor(currentHour / 12) * 12; // 0 for AM, 12 for PM
         let hour12 = newHour % 12;
         if (hour12 === 0) hour12 = 12; // 0 blir 12
         // Foreløpig enkel løsning: behold AM/PM
         // En bedre løsning krever mer info om brukerens intensjon
         newHour = baseHour + hour12 % 12; // Holder seg innenfor samme 12-timers blokk
         if (newHour === 12) newHour = 0; // Korriger 12 AM til 0
         if (newHour === 0 && baseHour === 12) newHour = 12; // Korriger 12 PM

        newMinute = currentMinute; // Beholder minuttet ved timedrag
    }

    if (newHour !== currentHour || newMinute !== currentMinute) {
       displayTime(newHour, newMinute);
    }
}


function handleMouseUp(event) {
    if (!isDragging) return;
    isDragging = false;
    draggedHand = null;
    if (taskActive && analogClockElement.classList.contains('interactive-clock') && !isGameOver) {
       analogClockElement.style.cursor = 'grab';
    } else {
        analogClockElement.style.cursor = 'default';
    }
}

// === EVENT LISTENERS ===
gameModeSelect.addEventListener('change', (e) => {
    toggleCustomSettings(e.target.value === 'custom');
    // Start på nytt når man bytter modus? Eller bare neste oppgave? La oss starte på nytt.
    initializeGame();
});

// Legg til listeners for checkboxes hvis du vil at spillet skal restarte ved endring
customPracticeSettings.addEventListener('change', (e) => {
    // Hvis en checkbox endres, og vi er i custom mode, start på nytt?
    if (e.target.type === 'checkbox' && gameModeSelect.value === 'custom') {
        // Valgfritt: Kan bare generere ny oppgave ELLER restarte helt.
        // initializeGame(); // Restarter score, liv etc.
         generateNewTask(); // Bare lager ny oppgave med nye innstillinger
    }
});


nextTaskButton.addEventListener('click', generateNewTask);
checkAnswerButton.addEventListener('click', handleCheckAnswer);
restartButton.addEventListener('click', initializeGame);

// Dra-og-slipp listeners
analogClockElement.addEventListener('mousedown', handleMouseDown);
document.addEventListener('mousemove', handleMouseMove);
document.addEventListener('mouseup', handleMouseUp);
analogClockElement.addEventListener('mouseleave', handleMouseUp); // Stopp hvis mus går ut


// === START SPILLET ===
initializeGame(); // Kall denne for å sette opp alt ved start
