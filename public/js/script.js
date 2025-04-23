// DOM Elements
const startButton = document.getElementById('start-btn');
const nextButton = document.getElementById('next-btn');
const questionContainer = document.getElementById('question-screen');
const questionElement = document.getElementById('question');
const answerButtonsElement = document.getElementById('answer-buttons');
const resultsElement = document.getElementById('results-screen');
const scoreElement = document.getElementById('score');
const viewLeaderboardButton = document.getElementById('view-leaderboard');
const leaderboardContainer = document.getElementById('leaderboard-screen');
const leaderboardTable = document.getElementById('leaderboard');
const backToQuizButton = document.getElementById('back-to-quiz');
const restartQuizButton = document.getElementById('restart-quiz');
const progressElement = document.getElementById('progress');
const timerElement = document.getElementById('timer');
const timerContainer = document.getElementById('timer-container');
const timerCircle = document.querySelector('.timer-progress');
const categoryElement = document.getElementById('category');
const filterButtons = document.querySelectorAll('.filter-btn');
const viewFullLeaderboardButton = document.getElementById('view-full-leaderboard');
const usernameForm = document.getElementById('username-form');
const usernameInput = document.getElementById('username-input');
const saveScoreButton = document.getElementById('save-score-btn');
const saveMessageElement = document.getElementById('save-message');
const resultsUsernameElement = document.getElementById('results-username');
const previewLeaderboardTable = document.getElementById('preview-leaderboard');
const previewLoadingElement = document.querySelector('.preview-loading');

// Game State
let shuffledQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let timer;
let timeLeft = 30;
let username = '';

// Initialize the app
function init() {
    showScreen('start-screen');
    setupEventListeners();
    loadPreviewLeaderboard();
}

function setupEventListeners() {
    usernameForm.addEventListener('submit', (e) => {
        e.preventDefault();
        startQuiz();
    });
    
    nextButton.addEventListener('click', nextQuestion);
    viewLeaderboardButton.addEventListener('click', viewLeaderboard);
    backToQuizButton.addEventListener('click', () => showScreen('start-screen'));
    restartQuizButton.addEventListener('click', restartQuiz);
    saveScoreButton.addEventListener('click', saveScore);
    viewFullLeaderboardButton.addEventListener('click', viewLeaderboard);

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadLeaderboard(btn.dataset.filter);
        });
    });
}

function showScreen(screenId) {
    document.querySelectorAll('.quiz-section').forEach(section => {
        section.classList.remove('active');
    });
    const targetSection = document.getElementById(screenId);
    targetSection.classList.add('active');
    targetSection.style.animation = 'bounce 0.5s ease';
}

async function startQuiz() {
    username = usernameInput.value.trim();
    if (!username) {
        showError(usernameInput, 'Please enter your name');
        return;
    }

    try {
        showScreen('question-screen');
        const response = await fetch('/api/questions');
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.success || !data.data || data.data.length === 0) {
            throw new Error('No questions available');
        }

        shuffledQuestions = data.data.slice(0, 10);
        currentQuestionIndex = 0;
        score = 0;
        
        updateProgress();
        setNextQuestion();
    } catch (error) {
        console.error('Error starting quiz:', error);
        showScreen('start-screen');
        showToast(`Failed to start quiz: ${error.message}`, 'error');
    }
}

function setNextQuestion() {
    resetState();
    if (currentQuestionIndex >= shuffledQuestions.length) {
        showResults();
        return;
    }
    
    updateProgress();
    showQuestion(shuffledQuestions[currentQuestionIndex]);
    startTimer();
}

function showQuestion(question) {
    questionElement.textContent = question.question;
    categoryElement.textContent = question.category || 'General';

    const answers = [
        { text: question.option1, correct: question.correct_answer === question.option1 },
        { text: question.option2, correct: question.correct_answer === question.option2 },
        { text: question.option3, correct: question.correct_answer === question.option3 },
        { text: question.option4, correct: question.correct_answer === question.option4 }
    ].filter(a => a.text);

    // Shuffle answers
    answers.sort(() => Math.random() - 0.5);

    answers.forEach((answer, index) => {
        const button = document.createElement('button');
        button.classList.add('answer-btn');
        button.innerHTML = `
            <span class="answer-letter">${String.fromCharCode(65 + index)}</span>
            <span class="answer-text">${answer.text}</span>
        `;
        if (answer.correct) {
            button.dataset.correct = answer.correct;
        }
        button.addEventListener('click', selectAnswer);
        answerButtonsElement.appendChild(button);
    });
}

function selectAnswer(e) {
    clearInterval(timer);
    const selectedButton = e.target.closest('.answer-btn');
    const correct = selectedButton.dataset.correct === 'true';

    // Disable all buttons after selection
    Array.from(answerButtonsElement.children).forEach(button => {
        button.removeEventListener('click', selectAnswer);
        button.style.pointerEvents = 'none';
    });

    if (correct) {
        score++;
        triggerConfetti('medium');
    }

    // Show feedback for all answers
    Array.from(answerButtonsElement.children).forEach(button => {
        setStatusClass(button, button.dataset.correct === 'true');
    });

    // Enable next button or show results
    if (shuffledQuestions.length > currentQuestionIndex + 1) {
        setTimeout(() => {
            nextButton.classList.remove('hide');
        }, 1000);
    } else {
        setTimeout(showResults, 1500);
    }
}

function showResults() {
    showScreen('results-screen');
    scoreElement.textContent = score;
    resultsUsernameElement.textContent = username;

    // Reset save button state
    saveScoreButton.innerHTML = '<i class="fas fa-save"></i> Save Score';
    saveScoreButton.disabled = false;
    saveScoreButton.classList.remove('btn-success');
    saveMessageElement.textContent = '';

    // Confetti for high scores
    if (score >= shuffledQuestions.length * 0.8) {
        triggerConfetti('large');
    }

    updateResultsIcon();
}

function updateResultsIcon() {
    const resultsIcon = document.getElementById('results-icon');
    resultsIcon.innerHTML = '';
    const icon = document.createElement('i');
    const percentage = score / shuffledQuestions.length;

    if (percentage >= 0.8) {
        icon.className = 'fas fa-trophy';
        resultsIcon.style.background = 'linear-gradient(135deg, #ffd700, #ffcc00)';
    } else if (percentage >= 0.5) {
        icon.className = 'fas fa-award';
        resultsIcon.style.background = 'linear-gradient(135deg, #c0c0c0, #a8a8a8)';
    } else {
        icon.className = 'fas fa-star';
        resultsIcon.style.background = 'linear-gradient(135deg, #cd7f32, #b87333)';
    }

    resultsIcon.appendChild(icon);
}

async function saveScore() {
    saveScoreButton.disabled = true;
    saveScoreButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    saveMessageElement.textContent = '';
    saveMessageElement.style.color = '';

    try {
        const response = await fetch('/api/leaderboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username,
                score: score,
                total: shuffledQuestions.length,
                date: new Date().toISOString()
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to save score');
        }

        // Success state
        saveScoreButton.innerHTML = '<i class="fas fa-check"></i> Saved!';
        saveScoreButton.classList.add('btn-success');
        saveMessageElement.textContent = 'Your score has been saved to the leaderboard!';
        saveMessageElement.style.color = 'var(--success-color)';

        // Refresh leaderboard preview
        loadPreviewLeaderboard();
    } catch (error) {
        console.error('Save error:', error);
        saveMessageElement.textContent = error.message;
        saveMessageElement.style.color = 'var(--danger-color)';
        saveScoreButton.innerHTML = '<i class="fas fa-save"></i> Try Again';
        saveScoreButton.disabled = false;
        showToast(`Failed to save score: ${error.message}`, 'error');
    }
}

async function loadLeaderboard(filter = 'all') {
    const tbody = leaderboardTable.querySelector('tbody');
    tbody.innerHTML = '<tr><td colspan="4" class="loading">Loading leaderboard...</td></tr>';

    try {
        const response = await fetch(`/api/leaderboard?filter=${filter}`);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to load leaderboard');
        }

        tbody.innerHTML = '';

        if (data.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4">No scores yet. Be the first!</td></tr>';
            return;
        }

        data.data.forEach((entry, index) => {
            const row = document.createElement('tr');
            if (index === 0) row.classList.add('gold');
            if (index === 1) row.classList.add('silver');
            if (index === 2) row.classList.add('bronze');

            const date = new Date(entry.date);
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            row.innerHTML = `
                <td>${index + 1}</td>
                <td><i class="fas fa-user-circle"></i> ${entry.username}</td>
                <td>${entry.score}/${entry.total || 10}</td>
                <td>${formattedDate}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Leaderboard error:', error);
        tbody.innerHTML = `<tr><td colspan="4" class="error">Error: ${error.message}</td></tr>`;
        showToast(`Failed to load leaderboard: ${error.message}`, 'error');
    }
}

async function loadPreviewLeaderboard() {
    previewLoadingElement.classList.remove('hide');
    previewLeaderboardTable.classList.add('hide');

    try {
        const response = await fetch('/api/leaderboard?limit=5');
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to load leaderboard');
        }

        const tbody = previewLeaderboardTable.querySelector('tbody');
        tbody.innerHTML = '';

        if (data.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3">No scores yet!</td></tr>';
        } else {
            data.data.forEach((entry, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td><i class="fas fa-user-circle"></i> ${entry.username}</td>
                    <td>${entry.score}/${entry.total || 10}</td>
                `;
                tbody.appendChild(row);
            });
        }

        previewLoadingElement.classList.add('hide');
        previewLeaderboardTable.classList.remove('hide');
    } catch (error) {
        console.error('Preview leaderboard error:', error);
        previewLoadingElement.innerHTML = '<i class="fas fa-exclamation-circle"></i> Failed to load';
        showToast(`Failed to load preview leaderboard: ${error.message}`, 'error');
    }
}

function viewLeaderboard() {
    showScreen('leaderboard-screen');
    loadLeaderboard();
}

function restartQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    usernameInput.value = username;
    startQuiz();
}

function startTimer() {
    clearInterval(timer);
    timeLeft = 30;
    updateTimerDisplay();
    timerContainer.classList.remove('time-warning');

    // Initialize timer circle
    const circumference = 2 * Math.PI * 22; // Circle radius is 22
    timerCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    timerCircle.style.strokeDashoffset = 0;

    timer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 10) {
            timerContainer.classList.add('time-warning');
        }

        if (timeLeft <= 0) {
            clearInterval(timer);
            handleTimeOut();
        }
    }, 1000);
}

function updateTimerDisplay() {
    timerElement.textContent = timeLeft;
    const percent = timeLeft / 30;
    const circumference = 2 * Math.PI * 22;
    timerCircle.style.strokeDashoffset = circumference * (1 - percent);

    if (timeLeft <= 10) {
        timerElement.style.color = 'var(--danger-color)';
        timerCircle.style.stroke = 'var(--danger-color)';
    } else {
        timerElement.style.color = 'inherit';
        timerCircle.style.stroke = 'var(--primary-color)';
    }
}

function handleTimeOut() {
    // Mark correct answer when time runs out
    Array.from(answerButtonsElement.children).forEach(button => {
        button.removeEventListener('click', selectAnswer);
        button.style.pointerEvents = 'none';
        if (button.dataset.correct === 'true') {
            setStatusClass(button, true);
        }
    });

    setTimeout(() => {
        if (shuffledQuestions.length > currentQuestionIndex + 1) {
            nextQuestion();
        } else {
            showResults();
        }
    }, 1500);
}

function nextQuestion() {
    currentQuestionIndex++;
    setNextQuestion();
}

function resetState() {
    clearInterval(timer);
    nextButton.classList.add('hide');
    while (answerButtonsElement.firstChild) {
        answerButtonsElement.removeChild(answerButtonsElement.firstChild);
    }
}

function setStatusClass(element, correct) {
    element.classList.remove('correct', 'wrong');
    if (correct) {
        element.classList.add('correct');
    } else {
        element.classList.add('wrong');
    }
}

function updateProgress() {
    progressElement.textContent = `Question ${currentQuestionIndex + 1}/${shuffledQuestions.length}`;
    const progressPercent = ((currentQuestionIndex + 1) / shuffledQuestions.length) * 100;
    const progressFill = document.querySelector('.progress-fill');
    progressFill.style.width = `${progressPercent}%`;
    progressFill.classList.add('animate');
}

function showError(input, message) {
    const inputGroup = input.parentElement;
    const errorElement = document.createElement('small');
    errorElement.className = 'error-message';
    errorElement.style.color = 'var(--danger-color)';
    errorElement.textContent = message;
    
    // Remove existing error if any
    const existingError = inputGroup.querySelector('.error-message');
    if (existingError) {
        inputGroup.removeChild(existingError);
    }
    
    inputGroup.appendChild(errorElement);
    input.focus();
}

function triggerConfetti(size = 'large') {
    const config = {
        particleCount: size === 'medium' ? 100 : 200,
        spread: size === 'medium' ? 50 : 80,
        origin: { y: size === 'medium' ? 0.4 : 0.6 },
        colors: ['#6366f1', '#4f46e5', '#93c5fd', '#22c55e', '#ffd700', '#ff4500'],
        shapes: ['circle', 'square', 'triangle'],
        scalar: size === 'medium' ? 1 : 1.2
    };
    confetti(config);
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Initialize the app
document.addEventListener('DOMContentLoaded', init);