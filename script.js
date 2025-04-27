// --- DOM Elementer ---
const analogClockElement = document.getElementById('analog-clock');
const hourHand = document.getElementById('hour-hand');
const minuteHand = document.getElementById('minute-hand');
const digitalClockDisplay = document.getElementById('digital-clock-display'); // Endret ID
const digitalHour = document.getElementById('digital-hour');
const digitalMinute = document.getElementById('digital-minute');
const taskQuestion = document.getElementById('task-question');
const answerOptionsContainer = document.getElementById('answer-options');
const checkAnswerButton = document.getElementById('check-answer-button');
const feedbackElement = document.getElementById('feedback');
const scoreElement = document.getElementById('score');
// const levelElement = document.getElementById('level');
const modeSelect = document.getElementById('mode-select');
const difficultySelect = document.getElementById('difficulty-select');
const nextTaskButton = document.getElementById('next-task-button');

// --- Spillstatus ---
let score = 0;
let currentHour = 0; // Nåværende time klokka VISER (kan endres av bruker)
let currentMinute = 0; // Nåværende minutt klokka VISER (kan endres av bruker)
let targetHour = 0; // Mål-time for "Still klokka"
let targetMinute = 0; // Mål-minutt for "Still klokka"
let correctAnswerString = ""; // Tekstlig korrekt svar for "Les klokka"
let taskActive = true;

// --- Dra-status ---
let isDragging = false;
let draggedHand = null; // 'hour' or 'minute'

// --- Hjelpefunksjoner ---

function setAnalogTime(hour, minute) {
    // Korrigerer for 12 vs 0
    const displayHour = hour % 12;

    // Presis vinkelkalkulering
    const minuteDeg = (minute / 60) * 360;
    // Timeviseren påvirkes av minuttene
    const hourDeg = ((displayHour / 12) * 360) + ((minute / 60) * 30); // 30 grader per time

    // +90 fordi 0 grader er klokka 3 i CSS transform, vi vil starte på 12
    minuteHand.style.transform = `translateY(-50%) rotate(${minuteDeg + 90}deg)`;
    hourHand.style.transform = `translateY(-50%) rotate(${hourDeg + 90}deg)`;
}

function formatTwoDigits(number) {
    return number.toString().padStart(2, '0');
}

function setDigitalTime(hour, minute) {
     // Viser 1-12 på digital klokke for konsistens med analog, men kan endres
     // let displayHourDigital = hour % 12;
     // if (displayHourDigital === 0) displayHourDigital = 12;
     // La oss bruke 24-timers for digital for å være tydelig
     digitalHour.textContent = formatTwoDigits(hour % 24);
     digitalMinute.textContent = formatTwoDigits(minute);
}

// Oppdaterer BEGGE klokker OG de globale currentHour/Minute
function displayTime(hour, minute) {
    currentHour = Math.round(hour); // Lagre avrundet time
    currentMinute = Math.round(minute); // Lagre avrundet minutt
    setAnalogTime(currentHour, currentMinute);
    setDigitalTime(currentHour, currentMinute);
}


function getRandomTime(difficulty) {
    let hour = 0;
    let minute = 0;

    switch (difficulty) {
        case '1': minute = 0; break;
        case '2': minute = 30; break;
        case '3': minute = Math.random() < 0.5 ? 15 : 45; break;
        case '4': minute = Math.floor(Math.random() * 12) * 5; break;
        case '5': minute = Math.floor(Math.random() * 60); break;
        default: minute = 0;
    }
    // Generer en tilfeldig time mellom 1 og 12 for oppgaver
    hour = Math.floor(Math.random() * 12) + 1;

    return { hour, minute };
}

function timeToText(hour, minute, difficulty) {
    // Sørg for at vi bruker 1-12 for tekst-representasjon
    let displayHour = hour % 12;
    if (displayHour === 0) displayHour = 12; // Kl 0 er 12 AM/PM

    let nextHour = (displayHour % 12) + 1;

    if (minute === 0 && difficulty >= 1) return `Klokka ${displayHour}`;
    if (minute === 30 && difficulty >= 2) return `Halv ${nextHour}`;
    if (minute === 15 && difficulty >= 3) return `Kvart over ${displayHour}`;
    if (minute === 45 && difficulty >= 3) return `Kvart på ${nextHour}`;

    // Mer detaljert tekst for høyere nivåer
    if (difficulty >= 4) {
        if (minute === 5) return `Fem over ${displayHour}`;
        if (minute === 10) return `Ti over ${displayHour}`;
        if (minute === 20) return `Ti på halv ${nextHour}`; // 20 min = 10 min før halv
        if (minute === 25) return `Fem på halv ${nextHour}`;
        if (minute === 35) return `Fem over halv ${nextHour}`;
        if (minute === 40) return `Ti over halv ${nextHour}`; // Eller "Tjue på neste"
        if (minute === 50) return `Ti på ${nextHour}`;
        if (minute === 55) return `Fem på ${nextHour}`;
    }

    // Fallback for minutter som ikke har spesielle navn (eller lav vanskelighetsgrad)
     if (minute !== 0 && minute !== 15 && minute !== 30 && minute !== 45) {
         if (minute < 30) {
            return `${minute} ${minute === 1 ? 'minutt' : 'minutter'} over ${displayHour}`;
         } else {
             return `${60 - minute} ${60 - minute === 1 ? 'minutt' : 'minutter'} på ${nextHour}`;
         }
     }


    // Siste fallback (bør egentlig ikke nås med logikken over)
    return `${displayHour}:${formatTwoDigits(minute)}`;
}


function createAnswerOptions(correctHour, correctMinute, difficulty) {
    answerOptionsContainer.innerHTML = '';
    const options = new Set(); // Bruk Set for å enkelt sikre unike svar
    correctAnswerString = timeToText(correctHour, correctMinute, difficulty);
    options.add(correctAnswerString);

    // Generer gale svaralternativer
    let attempts = 0;
    while (options.size < 4 && attempts < 20) { // Legg til forsøksgrense
        const randomTime = getRandomTime(difficulty);
        // Sjekk om tiden faktisk er forskjellig fra den korrekte
        if (randomTime.hour !== correctHour || randomTime.minute !== correctMinute) {
            const wrongAnswerString = timeToText(randomTime.hour, randomTime.minute, difficulty);
             // Legg til kun hvis teksten er unik
             if(!options.has(wrongAnswerString)){
                 options.add(wrongAnswerString);
             }
        }
        attempts++;
    }
     // Hvis vi fortsatt ikke har 4 alternativer, fyll på med enkle feil hvis mulig
     while (options.size < 4 && attempts < 40) {
         const randH = Math.floor(Math.random() * 12) + 1;
         const randM = Math.floor(Math.random() * 12) * 5; // Enkle 5-min feil
          if (randH !== correctHour || randM !== correctMinute) {
              const wrongAnswerString = timeToText(randH, randM, Math.max(difficulty, 4)); // Bruk minst nivå 4 for tekst
               if(!options.has(wrongAnswerString)){
                 options.add(wrongAnswerString);
             }
          }
         attempts++;
     }


    // Konverter Set til Array og bland
    const optionsArray = Array.from(options);
    optionsArray.sort(() => Math.random() - 0.5);

    // Lag knapper
    optionsArray.forEach(optionText => {
        const button = document.createElement('button');
        button.textContent = optionText;
        button.addEventListener('click', handleAnswerSelection); // Endret navn for klarhet
        answerOptionsContainer.appendChild(button);
    });
}

// --- Spillflyt ---

function generateNewTask() {
    taskActive = true;
    feedbackElement.textContent = '';
    feedbackElement.className = 'feedback';
    nextTaskButton.classList.add('hidden');
    checkAnswerButton.classList.add('hidden'); // Skjul denne også som standard
    answerOptionsContainer.classList.remove('hidden'); // Vis svaralternativer som standard
    analogClockElement.classList.remove('interactive-clock'); // Ikke interaktiv som standard

    // Sørg for at gamle svar-knapper er borte
    answerOptionsContainer.innerHTML = '';

    const difficulty = difficultySelect.value;
    const mode = modeSelect.value;

    // Generer måltiden
    const { hour, minute } = getRandomTime(difficulty);
    targetHour = hour; // Lagre måltiden for "Still klokka"
    targetMinute = minute;

    if (mode === 'set_analog') {
        taskQuestion.textContent = `Still klokka til ${timeToText(targetHour, targetMinute, difficulty)}`;
        // Nullstill klokka visuelt for brukeren å stille inn
        displayTime(12, 0); // Starter på 12:00
        currentHour = 12; // Viktig å nullstille current også
        currentMinute = 0;
        answerOptionsContainer.classList.add('hidden'); // Skjul svaralternativer
        checkAnswerButton.classList.remove('hidden'); // Vis "Sjekk Svaret"-knapp
        analogClockElement.classList.add('interactive-clock'); // Gjør klokka klikkbar/dra-bar

    } else if (mode === 'read_analog') {
        taskQuestion.textContent = "Hva er klokka?";
        displayTime(targetHour, targetMinute); // Vis den genererte tiden
        createAnswerOptions(targetHour, targetMinute, difficulty);

    } else {
        // Fallback for ikke-implementerte moduser
        taskQuestion.textContent = "Modus ikke implementert";
        displayTime(12, 0);
        answerOptionsContainer.classList.add('hidden');
    }
}

// --- Hendelseshåndterere ---

// For "Les Klokka"-modus
function handleAnswerSelection(event) {
    if (!taskActive) return;
    taskActive = false;
    const selectedAnswer = event.target.textContent;

    // Deaktiver knapper og gi visuell feedback
    answerOptionsContainer.querySelectorAll('button').forEach(btn => {
        btn.disabled = true;
        if (btn.textContent === correctAnswerString) {
            btn.classList.add('correct-answer-display'); // Grønn og markert
        } else if (btn.textContent === selectedAnswer) {
            btn.classList.add('selected-wrong-answer'); // Rød/nedtonet
        }
    });

    if (selectedAnswer === correctAnswerString) {
        feedbackElement.textContent = "Riktig! 🎉";
        feedbackElement.className = 'feedback correct';
        score++;
        scoreElement.textContent = score;
    } else {
        feedbackElement.textContent = `Feil. Riktig var: ${correctAnswerString}`;
        feedbackElement.className = 'feedback incorrect';
    }
    nextTaskButton.classList.remove('hidden');
}

// For "Still Klokka"-modus
function handleCheckAnswer() {
    if (!taskActive) return;
    taskActive = false;
    analogClockElement.classList.remove('interactive-clock'); // Ikke interaktiv lenger

    // Sammenlign currentHour/Minute (satt av bruker) med targetHour/Minute
    // Tillat litt slingringsmonn? Nei, la oss være nøyaktige for nå.
    // Merk: Sammenlign timer etter modulo 12 for å håndtere 12 vs 0 riktig.
    const currentHour12 = currentHour % 12 === 0 ? 12 : currentHour % 12;
    const targetHour12 = targetHour % 12 === 0 ? 12 : targetHour % 12;

    console.log(`Sjekker: Stilt=${currentHour12}:${currentMinute} vs Mål=${targetHour12}:${targetMinute}`);


    if (currentHour12 === targetHour12 && currentMinute === targetMinute) {
        feedbackElement.textContent = "Riktig stilt! 👍";
        feedbackElement.className = 'feedback correct';
        score++;
        scoreElement.textContent = score;
    } else {
        feedbackElement.textContent = `Nesten! Du stilte ${timeToText(currentHour, currentMinute, 5)}. Riktig var ${timeToText(targetHour, targetMinute, 5)}.`;
        feedbackElement.className = 'feedback incorrect';
        // Vis den korrekte tiden etter feil svar
        setAnalogTime(targetHour, targetMinute); // Korriger viserne
        setDigitalTime(targetHour, targetMinute); // Korriger digital
    }
    checkAnswerButton.classList.add('hidden'); // Skjul sjekk-knapp
    nextTaskButton.classList.remove('hidden'); // Vis neste-knapp
}


// --- Dra-og-slipp Håndtering ---

function getAngle(event) {
    const rect = analogClockElement.getBoundingClientRect();
    // Finn senter av klokka relativt til viewport
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    // Finn musens posisjon relativt til viewport
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    // Kalkuler vinkel fra senter til mus
    let angle = Math.atan2(mouseY - centerY, mouseX - centerX) * (180 / Math.PI);
    // Juster vinkelen slik at 0 grader er "opp" (klokka 12)
    angle = (angle + 90 + 360) % 360;
    return angle;
}

function handleMouseDown(event) {
    if (modeSelect.value !== 'set_analog' || !taskActive) return; // Kun i riktig modus og aktiv oppgave
    event.preventDefault(); // Forhindre standard tekstmarkering etc.

    const angle = getAngle(event);

    // Enkel logikk for å velge viser: Sjekk hvilken vinkel den peker mot
    // (Dette er ikke perfekt, kan forbedres ved å sjekke avstand til visertupp)
    const minuteAngle = (currentMinute / 60) * 360;
    const hourAngle = ((currentHour % 12) / 12) * 360 + (currentMinute / 60) * 30;

    // Beregn vinkelforskjell (ta hensyn til sirkelen)
    const diffMinute = Math.min(Math.abs(angle - minuteAngle), 360 - Math.abs(angle - minuteAngle));
    const diffHour = Math.min(Math.abs(angle - hourAngle), 360 - Math.abs(angle - hourAngle));

    // Velg den viseren som er nærmest vinkelmessig (med en toleranse)
    if (diffMinute < diffHour && diffMinute < 30) { // Lavere terskel for minuttviser?
         draggedHand = 'minute';
    } else if (diffHour < 45) { // Større toleranse for timeviser?
         draggedHand = 'hour';
    } else {
        draggedHand = null; // Klikket ikke nær nok en viser
        return;
    }

    isDragging = true;
    analogClockElement.style.cursor = 'grabbing'; // Vis at noe dras
    // console.log("Start dragging:", draggedHand);

    // Flytt logikken for bevegelse til mousemove for å unngå "hopp" ved første klikk
    // handleMouseMove(event); // Kall en gang for å sette posisjon umiddelbart?
}

function handleMouseMove(event) {
    if (!isDragging || !taskActive) return;

    const angle = getAngle(event);
    let newHour = currentHour;
    let newMinute = currentMinute;

    if (draggedHand === 'minute') {
        newMinute = Math.round((angle / 360) * 60) % 60; // Rund av til nærmeste minutt
        // Når minuttviseren dras, oppdater timeviseren litt også
         newHour = currentHour; // Behold timen, men den visuelle posisjonen justeres i displayTime
    } else if (draggedHand === 'hour') {
        // Konverter vinkel til time (0-11.99~)
        let preciseHour = (angle / 360) * 12;
        // Rund av til nærmeste *hele* time for brukerens input? Eller la den være presis?
        // La oss runde av til nærmeste time for nå.
        newHour = Math.round(preciseHour);
        if (newHour === 0) newHour = 12; // Håndter midnatt/middag som 12
        // Når timeviseren dras, behold minuttet som det var? Eller nullstill? La oss beholde.
        newMinute = currentMinute;
         // Den *visuelle* posisjonen vil justeres av displayTime basert på minuttet også
    }


    // Unngå å oppdatere DOM for ofte hvis tiden ikke endres
    if (newHour !== currentHour || newMinute !== currentMinute) {
       displayTime(newHour, newMinute); // Oppdater global state og visuell klokke
    }
}

function handleMouseUp(event) {
    if (!isDragging) return;
    isDragging = false;
    draggedHand = null;
    // Sett tilbake cursor bare hvis modus fortsatt er set_analog
    if (modeSelect.value === 'set_analog' && taskActive) {
       analogClockElement.style.cursor = 'grab';
    } else {
        analogClockElement.style.cursor = 'default';
    }
    // console.log("Stopped dragging");
}

// Stopp også dragging hvis musen forlater klokkeområdet
analogClockElement.addEventListener('mouseleave', handleMouseUp);


// --- Event Listeners ---
modeSelect.addEventListener('change', generateNewTask);
difficultySelect.addEventListener('change', generateNewTask);
nextTaskButton.addEventListener('click', generateNewTask);
checkAnswerButton.addEventListener('click', handleCheckAnswer);

// Dra-og-slipp listeners for analog klokke
analogClockElement.addEventListener('mousedown', handleMouseDown);
// Legg listeners på hele dokumentet for å fange opp musebevegelser/slipp selv om pekeren går utenfor klokka
document.addEventListener('mousemove', handleMouseMove);
document.addEventListener('mouseup', handleMouseUp);


// --- Initialisering ---
generateNewTask(); // Start den første oppgaven
