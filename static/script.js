// static/script.js

// Frontend State Management
let selectedDifficulty = null;
let selectedGenre = null;
let currentPuzzle = null;
let currentPuzzleIndex = 0; // 0-based for internal logic
let totalPuzzles = 0;

let hintsUsedOnCurrentPuzzle = 0;
const maxHintsPerPuzzle = 3;

// Scoring and Timer variables
let score = 0;
let startTime = 0;
let timerInterval = null;
let finalTime = "00:00:00";
const difficultyPoints = { "Easy": 1000, "Medium": 2000, "Hard": 4000 };
const hintPenalties = { 1: 100, 2: 200, 3: 400 };

// --- Element cache ---
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const endScreen = document.getElementById('end-screen');
const startGameBtn = document.getElementById('start-game-btn');
const hintCountSpan = document.getElementById('hint-count');
const feedbackDiv = document.getElementById('feedback');
const hintBtn = document.getElementById('hint-btn');
const answerInput = document.getElementById('answer-input');
const submitBtn = document.getElementById('submit-btn');
const showAnswerBtn = document.getElementById('show-answer-btn');
const timerEl = document.getElementById('timer');
const historyBtn = document.getElementById('history-btn');
const introText = document.getElementById('intro-text');
const audioPlayer = document.getElementById('audio-player'); 

// Modals
const rulesBtn = document.getElementById('rules-btn');
const rulesModal = document.getElementById('rules-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const historyModal = document.getElementById('history-modal');
const closeHistoryModalBtn = document.getElementById('close-history-modal-btn');
const historyList = document.getElementById('history-list');
const noHistoryMsg = document.getElementById('no-history-msg');

// --- Theming Functions ---

function applyTheme(genre) {
    const headings = document.querySelectorAll("h1, h2, #timer");
    const container = document.querySelector(".container");
    const generalButtons = document.querySelectorAll("button, input[type='text'], .output-box, .status-message");
    const modalContents = document.querySelectorAll(".modal-content");
    const modalButtons = document.querySelectorAll("#close-modal-btn, #close-history-modal-btn");
    const historyItems = document.querySelectorAll(".history-item"); 
    const metaTags = document.querySelectorAll(".meta");

    // --- UPDATED: "modern" theme values ---
    const themes = {
        "home": { bg:"#1b1f2a", accent:"#8ab4f8", text:"#e8ebf4", glow:"rgba(138,180,248,0.25)", button_bg:"#232836", inner:"linear-gradient(180deg,#1f2433 0%,#2b3142 100%)" },
        "sci-fi": { bg:"#0b1020", accent:"#00ffd5", text:"#e6ffff", glow:"rgba(0,255,213,0.28)", button_bg:"#07101a", inner:"linear-gradient(180deg,#071024 0%,#0d1622 100%)" },
        "medieval": { bg:"#1f1812", accent:"#c9a56f", text:"#f2e8dc", glow:"rgba(201,165,111,0.22)", button_bg:"#2a200f", inner:"linear-gradient(180deg,#2b2118 0%,#24170f 100%)" },
        "mythological": { bg:"#f2efe7", accent:"#b8860b", text:"#1b1620", glow:"rgba(184,134,11,0.18)", button_bg:"#e6dcc8", inner:"linear-gradient(180deg,#efe7d6 0%,#e6ddc9 100%)" },
        "horror": { bg:"#070608", accent:"#c92b2b", text:"#f6eaea", glow:"rgba(201,43,43,0.28)", button_bg:"#120808", inner:"linear-gradient(180deg,#0b0a0a 0%,#090708 100%)" },
        "modern": { bg:"#f4f7fb", accent:"#2e4a7a", text:"#0b1b2b", glow:"rgba(46,74,122,0.10)", button_bg:"#f0f6fc", inner:"linear-gradient(180deg,#ffffff 0%,#f0f6fc 100%)" }
    };

    const theme = themes[genre.toLowerCase()];
    if (!theme) return;

    // Apply main theme colors
    document.body.style.backgroundColor = theme.bg;
    document.body.style.color = theme.text;
    container.style.borderColor = theme.accent;
    // REMOVED: Conditional box shadow. All themes now use 'glow'.
    container.style.boxShadow = `0 0 20px ${theme.glow}`;
    container.style.background = theme.inner; 

    headings.forEach(h => {
        h.style.color = theme.accent;
        h.style.textShadow = `0 0 5px ${theme.accent}`;
    });
    
    // Apply text color to static paragraphs
    introText.style.color = theme.text;
    document.querySelectorAll("p").forEach(p => p.style.color = theme.text);
    
    // Apply accent color to meta tags
    metaTags.forEach(m => {
        m.style.color = theme.accent;
    });

    // Apply colors to general buttons/inputs
    generalButtons.forEach(el => {
        if (el.id === 'show-answer-btn') return; // Skip abort button for now
        el.style.borderColor = theme.accent;
        el.style.color = theme.text;
        el.style.boxShadow = `0 0 10px ${theme.accent}`;
        el.style.backgroundColor = theme.button_bg;
        
        if (el.tagName === 'BUTTON') {
            el.onmouseover = () => el.style.boxShadow = `0 0 15px ${theme.accent}`;
            el.onmouseout = () => el.style.boxShadow = `0 0 10px ${theme.accent}`;
        }
    });
    
    // Apply theme to modals
    modalContents.forEach(modal => {
        modal.style.borderColor = theme.accent;
        modal.style.boxShadow = `0 0 20px ${theme.glow}`;
        modal.style.background = theme.inner;
    });
    
    modalButtons.forEach(btn => {
        btn.style.borderColor = theme.accent;
        btn.style.color = theme.text;
        btn.style.backgroundColor = theme.button_bg;
    });
    
    // Theme the history item borders
    historyItems.forEach(item => {
        item.style.borderBottomColor = theme.accent;
    });

    // Abort Button Fix
    showAnswerBtn.style.borderColor = '#ff0000';
    showAnswerBtn.style.color = '#ff0000';
    showAnswerBtn.style.backgroundColor = theme.button_bg; // Use theme bg
    showAnswerBtn.onmouseover = () => {
        showAnswerBtn.style.backgroundColor = '#4d0000';
        showAnswerBtn.style.boxShadow = '0 0 10px #ff0000';
    };
    showAnswerBtn.onmouseout = () => {
        showAnswerBtn.style.backgroundColor = theme.button_bg;
        showAnswerBtn.style.boxShadow = 'none';
    };
    
    // REMOVED: Modern Animation Trigger
    document.documentElement.classList.remove('theme-modern-animate');
}

function resetToHomeTheme() {
    applyTheme("home");
}

// --- Audio Functions ---
const fadeAudioOut = (callback) => {
    // If no audio is playing or volume is already 0, just run the callback
    if (!audioPlayer.src || audioPlayer.volume === 0) {
        if (callback) callback();
        return;
    }

    const fadeInterval = setInterval(() => {
        let newVolume = audioPlayer.volume - 0.05;
        if (newVolume <= 0) {
            audioPlayer.volume = 0;
            audioPlayer.pause();
            audioPlayer.src = ""; // Clear the source
            clearInterval(fadeInterval);
            if (callback) callback(); // <-- Run the callback function when done
        } else {
            audioPlayer.volume = newVolume;
        }
    }, 200);// Fades out over 2 seconds
};

const fadeAudioIn = (genre) => {
    // Map genre to the filename (assuming .mp3 format)
    const audioMap = {
        "Sci-fi": "scifi.mp3",
        "Medieval": "medieval.mp3",
        "Mythological": "mythological.mp3",
        "Horror": "horror.mp3",
        "Modern": "modern.mp3"
    };

    const trackName = audioMap[genre];
    if (!trackName) {
        console.error("No audio track found for genre:", genre);
        return;
    }

    // Set source and start playing, muted
    audioPlayer.src = `/static/audio/${trackName}`;
    audioPlayer.volume = 0;

    // Use a .then() to ensure the audio has loaded before playing
    audioPlayer.play().then(() => {
        const fadeInterval = setInterval(() => {
            let newVolume = audioPlayer.volume + 0.05;
            if (newVolume >= 0.5) { // Fade in to 50% volume
                audioPlayer.volume = 0.5;
                clearInterval(fadeInterval);
            } else {
                audioPlayer.volume = newVolume;
            }
        }, 200); // Fades in over 2 seconds
    }).catch(error => {
        console.error("Audio play failed:", error);
        // This often happens if the user hasn't interacted with the page yet.
        // The 'startGame' click counts as interaction, so this is mainly a safety catch.
    });
};

function handleGameReset() {
    // Call fadeAudioOut and pass the reload command as the callback
    fadeAudioOut(() => {
        window.location.reload();
    });
}

// --- Utility Functions ---
function setFeedback(message, type) {
    feedbackDiv.textContent = message;
    feedbackDiv.className = `status-message ${type}`;
    feedbackDiv.classList.remove('hidden');
}

function clearFeedback() {
    feedbackDiv.classList.add('hidden');
    feedbackDiv.textContent = '';
}

function updateHintDisplay() {
    let hintsLeft = maxHintsPerPuzzle - hintsUsedOnCurrentPuzzle;
    hintCountSpan.textContent = hintsLeft;
    hintBtn.disabled = (hintsLeft <= 0);
}

function toggleButtons(selector, selectedValue) {
    document.querySelectorAll(selector).forEach(btn => {
        // --- THIS LINE IS NOW FIXED ---
        // Use outline for selection highlight so it doesn't conflict with theme border
        btn.style.outline = btn.dataset.value === selectedValue ? '2px solid #ffc0cb' : 'none'; 
    });
    startGameBtn.disabled = !(selectedDifficulty && selectedGenre);
    startGameBtn.textContent = selectedDifficulty && selectedGenre 
        ? `Start Game: ${selectedDifficulty} ${selectedGenre}` 
        : 'Start Game (Select Difficulty & Genre)';
}

// --- Timer Functions ---
function formatTime(ms) {
    let seconds = Math.floor(ms / 1000);
    let hours = Math.floor(seconds / 3600);
    seconds = seconds % 3600;
    let minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function startTimer() {
    startTime = Date.now();
    timerEl.classList.remove('hidden');
    historyBtn.classList.add('hidden'); 
    timerInterval = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        timerEl.textContent = formatTime(elapsedTime);
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    const elapsedTime = Date.now() - startTime;
    finalTime = formatTime(elapsedTime);
    timerEl.classList.add('hidden');
    historyBtn.classList.remove('hidden'); 
}

// --- Event Listeners ---
document.querySelectorAll('[data-type]').forEach(button => {
    button.addEventListener('click', (e) => {
        const type = e.target.dataset.type;
        const value = e.target.dataset.value;
        
        if (type === 'difficulty') {
            selectedDifficulty = value;
            toggleButtons('[data-type="difficulty"]', value);
        } else if (type === 'genre') {
            selectedGenre = value;
            toggleButtons('[data-type="genre"]', value);
            applyTheme(value); 
        }
    });
});

startGameBtn.addEventListener('click', startGame);

// Rules Modal Event Listeners
rulesBtn.addEventListener('click', () => {
    rulesModal.classList.remove('hidden');
});

closeModalBtn.addEventListener('click', () => {
    rulesModal.classList.add('hidden');
});

rulesModal.addEventListener('click', (e) => {
    if (e.target === rulesModal) {
        rulesModal.classList.add('hidden');
    }
});

// History Modal Event Listeners
historyBtn.addEventListener('click', () => {
    loadGameHistory(); // Load data and show modal
});

closeHistoryModalBtn.addEventListener('click', () => {
    historyModal.classList.add('hidden');
});

historyModal.addEventListener('click', (e) => {
    if (e.target === historyModal) {
        historyModal.classList.add('hidden');
    }
});

// --- Game History Functions ---
function loadGameHistory() {
    const historyData = localStorage.getItem('argGameHistory');
    historyList.innerHTML = ''; 

    const headerLi = document.createElement('li');
    headerLi.className = 'history-header';
    headerLi.innerHTML = `
        <span>Game/Genre</span>
        <span>Time</span>
        <span>Score</span>
    `;
    historyList.appendChild(headerLi);
    
    if (!historyData) {
        noHistoryMsg.classList.remove('hidden');
        historyList.appendChild(noHistoryMsg);
    } else {
        noHistoryMsg.classList.add('hidden');
        const history = JSON.parse(historyData);
        
        history.forEach((game, index) => {
            const li = document.createElement('li');
            li.className = 'history-item';
            li.innerHTML = `
                <span>${index + 1}. ${game.difficulty} ${game.genre}</span>
                <span>${game.time}</span>
                <span>${game.score}pts</span>
            `;
            historyList.appendChild(li);
        });
    }
    // Apply current theme to new history items
    applyTheme(selectedGenre || 'home');
    historyModal.classList.remove('hidden');
}

function saveGameToHistory(gameData) {
    const historyData = localStorage.getItem('argGameHistory');
    let history = [];
    if (historyData) {
        history = JSON.parse(historyData);
    }
    history.push(gameData); 
    localStorage.setItem('argGameHistory', JSON.stringify(history));
}

// --- Core Game Functions ---

async function startGame() {
    clearFeedback();
    startScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    
    // Theme is already applied from the button click, so we just show loading text
    document.getElementById('narrative-output').innerHTML = "Loading: Analyzing genre and difficulty... Generating custom puzzle sequence via GAI Protocol. Please wait...";
    
    try {
        const response = await fetch('/generate_story', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                difficulty: selectedDifficulty, 
                genre: selectedGenre 
            })
        });

        const data = await response.json();

        if (data.error) {
            setFeedback(data.error, 'error');
            document.getElementById('narrative-output').textContent = "ERROR: Failed to load game data.";
            return;
        }

        // Initialize Game State
        document.getElementById('game-title').textContent = data.title;
        document.getElementById('narrative-output').textContent = data.introduction;
        currentPuzzle = data.puzzle;
        currentPuzzleIndex = data.puzzle_index - 1; 
        totalPuzzles = data.total_puzzles;
        
        // Reset hints and score
        hintsUsedOnCurrentPuzzle = 0;
        score = 0;
        updateHintDisplay();
        showAnswerBtn.classList.add('hidden'); 
        
        displayPuzzle();
        startTimer(); // Start the clock!
        fadeAudioIn(selectedGenre); // Start genre-specific audio

    } catch (error) {
        setFeedback(`A communication error occurred: ${error.message}`, 'error');
        console.error('Start Game Error:', error);
    }
}

function displayPuzzle() {
    document.getElementById('puzzle-header').textContent = `[PUZZLE ${currentPuzzleIndex + 1} of ${totalPuzzles}] - ${currentPuzzle.title}`;
    document.getElementById('puzzle-text').textContent = currentPuzzle.puzzle_text;
    answerInput.value = '';
    document.getElementById('puzzle-area').classList.remove('hidden');
}

function showEndScreen(narrative, endingText) {
    fadeAudioOut(); // Fade out genre-specific audio
    stopTimer();
    
    // UPDATED: Reset to "home" theme for the end screen
    resetToHomeTheme(); 

    gameScreen.classList.add('hidden');
    endScreen.classList.remove('hidden');
    
    // Calculate final scores
    const baseScore = score; 
    const elapsedTime = Date.now() - startTime;
    const totalMinutes = Math.floor(elapsedTime / 60000); 
    
    let timeBonus = 6000 - (totalMinutes * 100);
    timeBonus = Math.max(0, timeBonus); 
    
    const finalScore = baseScore + timeBonus;

    // Save the completed game to history
    const gameData = {
        difficulty: selectedDifficulty,
        genre: selectedGenre,
        time: finalTime,
        score: finalScore
    };
    saveGameToHistory(gameData);

    // Populate end screen
    document.getElementById('final-time').textContent = `Total Time: ${finalTime}`;
    document.getElementById('base-score').textContent = `Base Score (Puzzles - Hints): ${baseScore}pts`;
    document.getElementById('time-bonus').textContent = `Time Bonus (Under 1hr): ${timeBonus}pts`;
    document.getElementById('final-score').textContent = `Final Score: ${finalScore}pts`;
    document.getElementById('final-screen-title').textContent = endingText; // Genre-specific text
}

async function checkAnswer() {
    clearFeedback();
    const answer = answerInput.value;
    if (!answer) {
        setFeedback("INPUT REQUIRED: Please enter a code before submitting.", 'error');
        return;
    }

    try {
        const response = await fetch('/check_answer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answer: answer })
        });

        const data = await response.json();

        if (data.status === 'incorrect') {
            setFeedback("CODE REJECTED: Decryption failed. Try again.", 'error');
        
        } else if (data.status === 'correct' || data.status === 'complete') {
            // Correct answer! Add points and show feedback.
            score += difficultyPoints[selectedDifficulty];
            setFeedback("CODE ACCEPTED: Access granted. Proceeding...", 'success');
            
            document.getElementById('narrative-output').textContent = data.narrative;
            
            if (data.status === 'complete') {
                // Game is finished, move to end screen
                setTimeout(() => {
                    showEndScreen(data.narrative, data.ending_text);
                }, 1500); // 1.5 second delay
            } else {
                // Move to next puzzle
                hintsUsedOnCurrentPuzzle = 0;
                updateHintDisplay();
                showAnswerBtn.classList.add('hidden');

                currentPuzzle = data.puzzle;
                currentPuzzleIndex = data.puzzle_index - 1; 
                displayPuzzle();
            }
        }
    } catch (error)
{
        setFeedback(`A communication error occurred: ${error.message}`, 'error');
        console.error('Check Answer Error:', error);
    }
}

function getHint() {
    clearFeedback();
    
    if (hintsUsedOnCurrentPuzzle >= maxHintsPerPuzzle) {
        setFeedback("HINT LIMIT REACHED: You have used all 3 hints for this puzzle.", 'error');
        return;
    }

    let hintKey = '';
    let penalty = 0;

    if (hintsUsedOnCurrentPuzzle === 0) {
        hintKey = 'hint_1';
        penalty = hintPenalties[1];
    } else if (hintsUsedOnCurrentPuzzle === 1) {
        hintKey = 'hint_2';
        penalty = hintPenalties[2];
    } else if (hintsUsedOnCurrentPuzzle === 2) {
        hintKey = 'hint_3';
        penalty = hintPenalties[3];
    }

    const hintText = currentPuzzle[hintKey];
    
    // Apply penalty and update state
    score -= penalty;
    hintsUsedOnCurrentPuzzle++;
    updateHintDisplay(); // Updates counter

    // Display the hint
    const currentText = document.getElementById('narrative-output').textContent;
    document.getElementById('narrative-output').textContent = 
        currentText + `\n\n--- [HINT ${hintsUsedOnCurrentPuzzle}] ---\n${hintText}`;
    
    setFeedback(`HINT ACTIVATED: Hint ${hintsUsedOnCurrentPuzzle} displayed. Penalty: -${penalty}pts.`, 'error');
    
    // Show the answer button if this was the 3rd hint
    if (hintsUsedOnCurrentPuzzle === maxHintsPerPuzzle) {
        showAnswerBtn.classList.remove('hidden');
        setFeedback(`HINT ACTIVATED: Hint ${hintsUsedOnCurrentPuzzle} displayed. All hints used. 'Show Answer' enabled.`, 'error');
    }
}

function showAnswer() {
    if (!currentPuzzle) return; 
    fadeAudioOut(); // Fade out any playing audio

    const solution = currentPuzzle.solution;
    setFeedback(`[ABORT] Solution revealed: ${solution}. Resetting in 10 seconds...`, 'error');

    answerInput.disabled = true;
    submitBtn.disabled = true;
    hintBtn.disabled = true;
    showAnswerBtn.disabled = true;
    stopTimer(); // Stop the timer on abort

    setTimeout(() => {
        window.location.reload();
    }, 10000); // 10 seconds
}

// CRITICAL: Call the default "home" theme function once to set the initial look.
resetToHomeTheme();