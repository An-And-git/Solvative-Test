// Quiz State Management
let quizState = {
    currentQuestion: 0,
    score: 0,
    timer: null,
    timeLeft: 10,
    questions: [],
    selectedCategory: '',
    answers: [],  // To track user's answers
    unanswered: 0
};

// DOM Elements placeholder
let elements = {};

// Initialize the quiz
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the index page
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        // Initialize index page elements
        elements = {
            startQuizBtn: document.getElementById('start-quiz'),
            fullNameInput: document.getElementById('full-name'),
            categoryForm: document.querySelector('.form-category')
        };
        
        // Add event listener for the start quiz button
        if (elements.startQuizBtn) {
            elements.startQuizBtn.addEventListener('click', startQuiz);
        }
        // Clear validation errors on input/change
        if (elements.fullNameInput) {
            elements.fullNameInput.addEventListener('input', () => clearError('name'));
        }
        const categoryRadios = document.querySelectorAll('input[name="category"]');
        if (categoryRadios && categoryRadios.length) {
            categoryRadios.forEach(r => r.addEventListener('change', () => clearError('category')));
        }
    }
    // Check if we're on the quiz page
    else if (window.location.pathname.endsWith('quiz-page.html')) {
        // Initialize quiz page elements (use scoped selectors to avoid picking header buttons)
        elements = {
            quizContainer: document.querySelector('.quiz-container'),
            questionCounter: document.querySelector('.question-counter'),
            timer: document.querySelector('.timer'),
            questionText: document.querySelector('.question-text'),
            optionsContainer: document.querySelector('.options-container'),
            optionsError: document.getElementById('option-error'),
            // scope next/skip to within the quiz container to avoid header buttons
            nextButton: document.querySelector('.quiz-container .btn-primary'),
            skipButton: document.querySelector('.quiz-container .btn-link'),
            progressBar: document.querySelector('.progress-bar')
        };

        // Load the quiz state from session storage
        const savedQuestions = sessionStorage.getItem('quizQuestions');
        const savedCategory = sessionStorage.getItem('quizCategory');
        
        if (!savedQuestions || !savedCategory) {
            // If no quiz data, redirect to index
            window.location.href = 'index.html';
            return;
        }

        // Initialize quiz state
        quizState.questions = JSON.parse(savedQuestions);
        quizState.selectedCategory = savedCategory;
        quizState.currentQuestion = 0;
        quizState.score = 0;
        quizState.answers = [];
        quizState.unanswered = 0;

        // Start the quiz
        loadQuestion();

        // Clear option error when user selects via native input (in case they click the radio itself)
        elements.optionsContainer.addEventListener('change', (e) => {
            if (e.target && e.target.matches('input[type="radio"]')) {
                clearError('option');
            }
        });

        // Attach Next and Skip button listeners for the quiz page
        if (elements.nextButton) {
            elements.nextButton.addEventListener('click', () => {
                const selectedOption = elements.optionsContainer.querySelector('input[type="radio"]:checked');
                if (!selectedOption) {
                    // Show validation error and don't advance — user should either select or click Skip
                    showError('option', 'Please select an option or click Skip to move on');
                    return;
                }
                clearError('option');
                nextQuestion();
            });
        }

        if (elements.skipButton) {
            elements.skipButton.addEventListener('click', (e) => {
                e.preventDefault();
                clearError('option');
                quizState.unanswered++;
                nextQuestion();
            });
        }
    }
});

// Start Quiz Function
async function startQuiz() {
    const fullName = elements.fullNameInput ? elements.fullNameInput.value.trim() : '';
    const selectedCategory = document.querySelector('input[name="category"]:checked');

    // Validate inputs and show inline messages
    let hasError = false;
    if (!fullName || fullName.length < 2) {
        showError('name', 'Please enter your full name (at least 2 characters)');
        hasError = true;
    } else {
        clearError('name');
    }
    if (!selectedCategory) {
        showError('category', 'Please select a category');
        hasError = true;
    } else {
        clearError('category');
    }
    if (hasError) return;

    // Store user data in session storage
    sessionStorage.setItem('quizUserName', fullName);
    sessionStorage.setItem('quizCategory', selectedCategory.value);

    // Reset quiz state
    quizState.currentQuestion = 0;
    quizState.score = 0;
    quizState.answers = [];
    quizState.unanswered = 0;
    quizState.selectedCategory = selectedCategory.value;

    try {
        // Fetch questions for selected category
        const response = await fetch('assets/data.json');
        const data = await response.json();
        
        // Find the selected category
        const categoryData = data.categories.find(cat => cat.name.toLowerCase() === quizState.selectedCategory.toLowerCase());
        if (categoryData) {
            quizState.questions = categoryData.questions;
            
            // Store questions in session storage and redirect to quiz page
            sessionStorage.setItem('quizQuestions', JSON.stringify(quizState.questions));
            window.location.href = 'quiz-page.html';
        }
    } catch (error) {
        console.error('Error loading questions:', error);
        alert('Error loading questions. Please try again.');
    }
}

// Load Question Function
function loadQuestion() {
    if (quizState.currentQuestion >= quizState.questions.length) {
        showResults();
        return;
    }

    const question = quizState.questions[quizState.currentQuestion];
    
    // Update question counter
    elements.questionCounter.textContent = `${quizState.currentQuestion + 1}/${quizState.questions.length}`;
    
    // Update progress bar
    const progress = ((quizState.currentQuestion + 1) / quizState.questions.length) * 100;
    elements.progressBar.style.width = `${progress}%`;
    
    // Set question text
    elements.questionText.textContent = question.question;
    
    // Create options
    const options = [...question.incorrect_answers, question.correct_answer];
    shuffleArray(options);  // Randomize options order
    
    // Clear previous options
    elements.optionsContainer.innerHTML = '';
    
    // Add new options
    options.forEach((option, index) => {
        const optionElement = createOptionElement(option, index);
        elements.optionsContainer.appendChild(optionElement);
    });

    // Start timer
    startTimer();
}

// Create Option Element
function createOptionElement(optionText, index) {
    const div = document.createElement('div');
    div.className = 'form-check mb-3 border rounded';
    div.innerHTML = `
        <input class="form-check-input" type="radio" name="quizOption" id="option${index + 1}">
        <label class="form-check-label w-100" for="option${index + 1}">
            ${optionText}
        </label>
    `;
    // Add click event listener: check the input so CSS :checked styles apply, then handle selection
    div.addEventListener('click', (e) => {
        // Prevent double handling if the actual input was clicked
        const input = div.querySelector('input[type="radio"]');
        if (input) {
            input.checked = true;
        }
        // Clear any option validation error
        clearError('option');
        // Call selection handler
        handleOptionSelect(optionText);
    });
    return div;
}

// Handle Option Selection
function handleOptionSelect(selectedOption) {
    clearInterval(quizState.timer);
    const currentQuestion = quizState.questions[quizState.currentQuestion];
    const isCorrect = selectedOption === currentQuestion.correct_answer;

    // Track answer
    quizState.answers.push({
        question: currentQuestion.question,
        selectedAnswer: selectedOption,
        isCorrect: isCorrect
    });

    if (isCorrect) {
        quizState.score++;
    }

    // Highlight correct/incorrect (add these styles to your CSS)
    const options = elements.optionsContainer.querySelectorAll('.form-check');
    options.forEach(option => {
        const optionText = option.querySelector('.form-check-label').textContent.trim();
        if (optionText === selectedOption) {
            option.classList.add(isCorrect ? 'correct' : 'incorrect');
        }
    });

    // Disable all options after selection
    const inputs = elements.optionsContainer.querySelectorAll('input[type="radio"]');
    inputs.forEach(input => input.disabled = true);

    // Auto-advance after a brief delay
    setTimeout(() => {
        nextQuestion();
    }, 1000);
}

// Timer Functions
function startTimer() {
    quizState.timeLeft = 10;
    updateTimerDisplay();

    clearInterval(quizState.timer);
    quizState.timer = setInterval(() => {
        quizState.timeLeft--;
        updateTimerDisplay();

        if (quizState.timeLeft <= 0) {
            clearInterval(quizState.timer);
            quizState.unanswered++;
            nextQuestion();
        }
    }, 1000);
}

function updateTimerDisplay() {
    elements.timer.textContent = `0:${quizState.timeLeft.toString().padStart(2, '0')}`;
}

// Next Question Function
function nextQuestion() {
    clearInterval(quizState.timer);
    quizState.currentQuestion++;
    
    if (quizState.currentQuestion < quizState.questions.length) {
        loadQuestion();
    } else {
        showResults();
    }
}

// Show Results Function
function showResults() {
    const percentage = Math.round((quizState.score / quizState.questions.length) * 100);
    let resultPage = 'success.html';

    if (percentage < 60) {
        resultPage = 'poor.html';
    } else if (percentage < 80) {
        resultPage = 'average.html';
    }

    // Store results in sessionStorage
    const results = {
        score: percentage,
        totalQuestions: quizState.questions.length,
        correctAnswers: quizState.score,
        incorrectAnswers: quizState.questions.length - quizState.score - quizState.unanswered,
        unanswered: quizState.unanswered
    };
    sessionStorage.setItem('quizResults', JSON.stringify(results));

    // Redirect to appropriate result page
    window.location.href = resultPage;
}

// Utility function to shuffle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Validation helpers
function showError(field, message) {
    if (field === 'name') {
        const el = document.getElementById('name-error');
        if (el) {
            el.textContent = message;
            el.style.display = 'block';
        }
        if (elements.fullNameInput) elements.fullNameInput.classList.add('is-invalid');
    } else if (field === 'category') {
        const el = document.getElementById('category-error');
        if (el) {
            el.textContent = message;
            el.style.display = 'block';
        }
        // add a visual cue to the category group
        if (elements.categoryForm) elements.categoryForm.classList.add('has-error');
    } else if (field === 'option') {
        const el = elements.optionsError || document.getElementById('option-error');
        if (el) {
            el.textContent = message;
            el.style.display = 'block';
        }
    }
}

function clearError(field) {
    if (field === 'name') {
        const el = document.getElementById('name-error');
        if (el) el.style.display = 'none';
        if (elements.fullNameInput) elements.fullNameInput.classList.remove('is-invalid');
    } else if (field === 'category') {
        const el = document.getElementById('category-error');
        if (el) el.style.display = 'none';
        if (elements.categoryForm) elements.categoryForm.classList.remove('has-error');
    } else if (field === 'option') {
        const el = elements.optionsError || document.getElementById('option-error');
        if (el) el.style.display = 'none';
        // no additional class to remove for options
    }
}

// Note: Next/Skip listeners are attached during quiz-page initialization
