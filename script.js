// --- DOM Elementer ---
const hourHand = document.getElementById('hour-hand');
const minuteHand = document.getElementById('minute-hand');
// const secondHand = document.getElementById('second-hand'); // Hvis du legger til sekundviser
const digitalHour = document.getElementById('digital-hour');
const digitalMinute = document.getElementById('digital-minute');
const taskQuestion = document.getElementById('task-question');
const answerOptionsContainer = document.getElementById('answer-options');
const feedbackElement = document.getElementById('feedback');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level'); // Kan brukes senere for progresjon
const modeSelect = document.getElementById('mode-select');
const difficultySelect = document.getElementById('difficulty-select');
const nextTaskButton = document.getElementById('next-task-button');

// --- Spillstatus ---
let score = 0;
let currentHour = 0;
let currentMinute = 0;
let correctAnswerString = ""; // Lagrer riktig svar for gjeldende oppgave
let taskActive = true; // For å hindre flere svar per oppgave

// --- Hjelpefunksjoner ---

// Setter tid på den analoge klokka
function setAnalogTime(hour, minute) {
    // Grader for minuttviser: (minutt / 60) * 360
    const minuteDeg = (minute / 60) * 360;
    // Grader for timeviser: ((time % 12) / 12) * 360 + (minutt / 60) * 30 (30 grader per time)
    const hourDeg = ((hour % 12) / 12) * 360 + (minute / 60) * 30;

    minuteHand.style.transform = `translate(0, -50%) rotate(${minuteDeg + 90}deg)`; // +90 for å starte fra 12
    hourHand.style.transform = `translate(0, -50%) rotate(${hourDeg + 90}deg)`; // +90 for å starte fra 12
}

// Formaterer tall til to siffer (f.eks. 5 -> "05")
function formatTwoDigits(number) {
    return number.toString().padStart(2, '0');
}

// Setter tid på den digitale klokka
function setDigitalTime(hour, minute) {
    digitalHour.textContent = formatTwoDigits(hour % 24); // Bruk 24-timers format internt for enkelhet? Eller hold til 12? La oss starte med 12+AM/PM logikk senere. Foreløpig 24.
    digitalMinute.textContent = formatTwoDigits(minute);
}

// Viser tid på begge klokker
function displayTime(hour, minute) {
    currentHour = hour;
    currentMinute = minute;
    setAnalogTime(hour, minute);
    setDigitalTime(hour, minute);
}

// --- Funksjoner for å generere tid basert på vanskelighetsgrad ---

function getRandomTime(difficulty) {
    let hour = Math.floor(Math.random() * 12); // 0-11
    let minute = 0;

    switch (difficulty) {
        case '1': // Hele timer
            minute = 0;
            break;
        case '2': // Halvtimer
            minute = 30;
            break;
        case '3': // Kvart over/på
            const quarter = Math.random() < 0.5 ? 15 : 45;
            minute = quarter;
            break;
        case '4': // 5-minutter
            minute = Math.floor(Math.random() * 12) * 5; // 0, 5, 10... 55
            break;
        case '5': // Alle minutter
            minute = Math.floor(Math.random() * 60); // 0-59
            break;
        default:
            minute = 0;
    }
     // Sørger for at timen er 1-12 for visning, men bruk 0-23 internt hvis vi vil ha AM/PM senere
     hour = Math.floor(Math.random() * 12) + 1; // 1-12

    return { hour, minute };
}

// --- Funksjoner for å lage oppgavetekst og svaralternativer ---

// Konverterer numerisk tid til norsk tekst (forenklet)
function timeToText(hour, minute, difficulty) {
    hour = hour % 12; // Bruk 12-timers format for tekst
    if (hour === 0) hour = 12; // Klokka 0 er 12

    if (minute === 0 && difficulty >= 1) return `Klokka ${hour}`;
    if (minute === 30 && difficulty >= 2) return `Halv ${hour === 12 ? 1 : hour + 1}`; // Halv *neste* time
    if (minute === 15 && difficulty >= 3) return `Kvart over ${hour}`;
    if (minute === 45 && difficulty >= 3) return `Kvart på ${hour === 12 ? 1 : hour + 1}`; // Kvart på *neste* time

    // For 5-min og alle minutter (kan utvides med "ti over", "fem på" osv senere)
    if (difficulty >= 4) {
         if (minute === 5) return `Fem over ${hour}`;
         if (minute === 10) return `Ti over ${hour}`;
         if (minute === 20) return `Ti på halv ${hour === 12 ? 1 : hour + 1}`; // Mer avansert
         if (minute === 25) return `Fem på halv ${hour === 12 ? 1 : hour + 1}`; // Mer avansert
         if (minute === 35) return `Fem over halv ${hour === 12 ? 1 : hour + 1}`; // Mer avansert
         if (minute === 40) return `Ti over halv ${hour === 12 ? 1 : hour + 1}`; // Mer avansert - eller "Tjue på X+1"
         if (minute === 50) return `Ti på ${hour === 12 ? 1 : hour + 1}`;
         if (minute === 55) return `Fem på ${hour === 12 ? 1 : hour + 1}`;
    }

    // Fallback til digitalt format hvis ingen tekst passer eller vanskelighetsgrad er lav
    return `${hour}:${formatTwoDigits(minute)}`;
}

// Lager svaralternativer
function createAnswerOptions(correctHour, correctMinute, difficulty) {
    answerOptionsContainer.innerHTML = ''; // Tøm gamle alternativer
    const options = [];
    correctAnswerString = timeToText(correctHour, correctMinute, difficulty);
    options.push(correctAnswerString);

    // Generer noen gale svaralternativer
    while (options.length < 4) {
        const randomTime = getRandomTime(difficulty);
        // Sørg for at timen justeres til 1-12 for tekst hvis getRandomTime gir 0
        let displayHour = randomTime.hour % 12;
        if (displayHour === 0) displayHour = 12;

        const wrongAnswerString = timeToText(displayHour, randomTime.minute, difficulty);

        // Sjekk at det gale svaret er unikt og ikke likt det riktige
        if (!options.includes(wrongAnswerString) && wrongAnswerString !== correctAnswerString) {
            // Ekstra sjekk: Sørg for at det ikke representerer *samme tidspunkt* selv om teksten er annerledes
            // (f.eks. unngå "Kvart på 5" som feil svar når riktig er "4:45") - forenklet her
             if(!(randomTime.hour === correctHour && randomTime.minute === correctMinute)){
                 options.push(wrongAnswerString);
             }
        }
    }

    // Bland alternativene
    options.sort(() => Math.random() - 0.5);

    // Lag knapper for hvert alternativ
    options.forEach(optionText => {
        const button = document.createElement('button');
        button.textContent = optionText;
        button.addEventListener('click', handleAnswer);
        answerOptionsContainer.appendChild(button);
    });
}

// --- Spillflyt ---

// Starter en ny oppgave
function generateNewTask() {
    taskActive = true;
    feedbackElement.textContent = '';
    feedbackElement.className = 'feedback'; // Reset feedback style
    nextTaskButton.classList.add('hidden'); // Skjul "neste" knapp
    answerOptionsContainer.style.opacity = '1'; // Vis alternativer igjen
    answerOptionsContainer.querySelectorAll('button').forEach(btn => btn.disabled = false); // Aktiver knapper

    const difficulty = difficultySelect.value;
    const mode = modeSelect.value; // Hvilken modus spilles i?

    const { hour, minute } = getRandomTime(difficulty);
    displayTime(hour, minute); // Viser tiden på klokkene

    // Tilpass spørsmål og svar basert på modus
    if (mode === 'read_analog' || mode === 'read_digital') {
         // Vis klokka (enten analog eller digital, eller begge som nå)
         // Spørsmålet er "Hva er klokka?"
         taskQuestion.textContent = "Hva er klokka?";
         createAnswerOptions(hour, minute, difficulty);
    } else {
        // Implementer logikk for "Still klokka" eller "Koble klokker" her
        taskQuestion.textContent = "Modus ikke implementert";
        answerOptionsContainer.innerHTML = ''; // Ingen svaralternativer for nå
    }
}

// Håndterer klikk på svaralternativ
function handleAnswer(event) {
    if (!taskActive) return; // Ikke gjør noe hvis oppgaven er ferdig
    taskActive = false; // Deaktiver oppgaven

    const selectedAnswer = event.target.textContent;

    // Deaktiver alle knapper og vis valgt svar
    answerOptionsContainer.querySelectorAll('button').forEach(btn => {
        btn.disabled = true;
        if(btn.textContent === selectedAnswer) {
            btn.style.border = '2px solid yellow'; // Fremhev valgt
        }
         if(btn.textContent === correctAnswerString) {
            btn.style.backgroundColor = '#28a745'; // Vis riktig svar grønt
        } else if (btn.textContent === selectedAnswer) {
             btn.style.backgroundColor = '#dc3545'; // Vis feil svar rødt
        }
    });


    if (selectedAnswer === correctAnswerString) {
        feedbackElement.textContent = "Riktig! Bra jobba!";
        feedbackElement.className = 'feedback correct';
        score++;
        scoreElement.textContent = score;
        // Legg til lyd/animasjon for riktig svar her
    } else {
        feedbackElement.textContent = `Feil. Riktig svar var ${correctAnswerString}.`;
        feedbackElement.className = 'feedback incorrect';
        // Legg til lyd/animasjon for feil svar her
    }

    // Vis "Neste oppgave"-knappen etter en liten forsinkelse
    setTimeout(() => {
         nextTaskButton.classList.remove('hidden');
    }, 1000); // Vent 1 sekund
}

// --- Event Listeners ---
modeSelect.addEventListener('change', generateNewTask);
difficultySelect.addEventListener('change', generateNewTask);
nextTaskButton.addEventListener('click', generateNewTask);

// --- Initialisering ---
generateNewTask(); // Start den første oppgaven når siden lastes
