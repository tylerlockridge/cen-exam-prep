/**
 * CEN Exam Prep - Quiz Module
 * 
 * Handles all quiz functionality including question loading, answer checking,
 * timer, and results tracking.
 */

const Quiz = {
    // Quiz state
    questions: [],
    currentQuestionIndex: 0,
    answers: [],
    startTime: null,
    timerInterval: null,
    mode: 'quick', // 'quick', 'focused', 'full'
    category: null,
    
    /**
     * Initialize quiz
     */
    async init() {
        console.log('🎯 Initializing quiz...');
        
        // Get quiz parameters from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.mode = urlParams.get('mode') || 'quick';
        this.category = urlParams.get('category') || null;
        
        // Load questions
        await this.loadQuestions();
        
        // Setup UI
        this.setupUI();
        
        // Start quiz
        this.startQuiz();
    },
    
    /**
     * Load questions based on mode and category
     */
    async loadQuestions() {
        try {
            // For now, we'll generate sample questions
            // Later you can load from JSON files
            this.questions = this.generateSampleQuestions();
            
            console.log(`📚 Loaded ${this.questions.length} questions`);
        } catch (error) {
            console.error('❌ Error loading questions:', error);
            this.questions = [];
        }
    },
    
    /**
     * Generate sample questions (temporary until real questions are added)
     */
    generateSampleQuestions() {
        const count = this.getQuestionCount();
        const questions = [];
        
        const categories = App.categories.length > 0 ? App.categories : [
            { id: 'cardiovascular', name: 'Cardiovascular' },
            { id: 'respiratory', name: 'Respiratory' },
            { id: 'neurological', name: 'Neurological' }
        ];
        
        for (let i = 0; i < count; i++) {
            const category = this.category 
                ? categories.find(c => c.id === this.category) 
                : categories[Math.floor(Math.random() * categories.length)];
            
            questions.push({
                id: `q${i + 1}`,
                category: category.id,
                categoryName: category.name,
                question: `Sample question ${i + 1} for ${category.name}?`,
                options: [
                    'Option A - This is the correct answer',
                    'Option B - This is incorrect',
                    'Option C - This is also incorrect',
                    'Option D - This is wrong too'
                ],
                correctAnswer: 0,
                rationale: 'This is the correct answer because it demonstrates the proper understanding of the concept. The other options are incorrect because they represent common misconceptions.',
                difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)]
            });
        }
        
        // Shuffle if configured
        if (CONFIG.quiz.shuffleQuestions) {
            this.shuffleArray(questions);
        }
        
        return questions;
    },
    
    /**
     * Get question count based on mode
     */
    getQuestionCount() {
        switch (this.mode) {
            case 'quick':
                return CONFIG.quiz.quickQuizQuestions;
            case 'focused':
                return CONFIG.quiz.focusedQuizQuestions;
            case 'full':
                return CONFIG.quiz.fullExamQuestions;
            default:
                return CONFIG.quiz.quickQuizQuestions;
        }
    },
    
    /**
     * Setup UI elements
     */
    setupUI() {
        // Setup answer buttons
        const answerButtons = document.querySelectorAll('.answer-option');
        answerButtons.forEach((btn, index) => {
            btn.addEventListener('click', () => this.selectAnswer(index));
        });
        
        // Setup navigation buttons
        const nextBtn = document.querySelector('[data-action="next"]');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextQuestion());
        }
        
        const prevBtn = document.querySelector('[data-action="previous"]');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousQuestion());
        }
        
        const submitBtn = document.querySelector('[data-action="submit"]');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.submitQuiz());
        }
        
        // Setup bookmark button
        const bookmarkBtn = document.querySelector('[data-action="bookmark"]');
        if (bookmarkBtn) {
            bookmarkBtn.addEventListener('click', () => this.toggleBookmark());
        }
    },
    
    /**
     * Start the quiz
     */
    startQuiz() {
        this.startTime = Date.now();
        this.currentQuestionIndex = 0;
        this.answers = new Array(this.questions.length).fill(null);
        
        // Start timer if full exam mode
        if (this.mode === 'full') {
            this.startTimer();
        }
        
        // Show first question
        this.showQuestion();
        
        console.log('▶️ Quiz started');
    },
    
    /**
     * Start timer for timed quizzes
     */
    startTimer() {
        const timerEl = document.querySelector('.timer');
        if (!timerEl) return;
        
        const totalSeconds = CONFIG.quiz.fullExamTimeMinutes * 60;
        let remainingSeconds = totalSeconds;
        
        this.timerInterval = setInterval(() => {
            remainingSeconds--;
            
            const minutes = Math.floor(remainingSeconds / 60);
            const seconds = remainingSeconds % 60;
            timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            // Warning when 5 minutes left
            if (remainingSeconds === 300) {
                App.showNotification('⏰ 5 minutes remaining!', 'warning');
            }
            
            // Time's up
            if (remainingSeconds <= 0) {
                clearInterval(this.timerInterval);
                App.showNotification('⏰ Time is up!', 'error');
                this.submitQuiz();
            }
        }, 1000);
    },
    
    /**
     * Show current question
     */
    showQuestion() {
        const question = this.questions[this.currentQuestionIndex];
        if (!question) return;
        
        // Update progress
        this.updateProgress();
        
        // Update question number
        const questionNumEl = document.querySelector('.question-number');
        if (questionNumEl) {
            questionNumEl.textContent = `Question ${this.currentQuestionIndex + 1} of ${this.questions.length}`;
        }
        
        // Update category badge
        const categoryEl = document.querySelector('.question-category');
        if (categoryEl) {
            categoryEl.textContent = question.categoryName || question.category;
        }
        
        // Update question text
        const questionEl = document.querySelector('.question-text');
        if (questionEl) {
            questionEl.textContent = question.question;
        }
        
        // Update answer options
        const answerButtons = document.querySelectorAll('.answer-option');
        const options = CONFIG.quiz.shuffleAnswers ? this.shuffleAnswers(question) : question.options;
        
        answerButtons.forEach((btn, index) => {
            if (options[index]) {
                btn.textContent = options[index];
                btn.style.display = 'block';
                btn.classList.remove('selected', 'correct', 'incorrect');
                btn.disabled = false;
            } else {
                btn.style.display = 'none';
            }
        });
        
        // Restore previous answer if exists
        if (this.answers[this.currentQuestionIndex] !== null) {
            const selectedIndex = this.answers[this.currentQuestionIndex];
            answerButtons[selectedIndex]?.classList.add('selected');
        }
        
        // Update bookmark button
        this.updateBookmarkButton();
        
        // Hide rationale initially
        this.hideRationale();
        
        // Update navigation buttons
        this.updateNavigationButtons();
    },
    
    /**
     * Shuffle answers (keeping track of correct answer)
     */
    shuffleAnswers(question) {
        // Create array of indices
        const indices = question.options.map((_, i) => i);
        this.shuffleArray(indices);
        
        // Reorder options and update correct answer index
        const shuffled = indices.map(i => question.options[i]);
        question.shuffledCorrectAnswer = indices.indexOf(question.correctAnswer);
        
        return shuffled;
    },
    
    /**
     * Shuffle array in place
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },
    
    /**
     * Select an answer
     */
    selectAnswer(index) {
        const question = this.questions[this.currentQuestionIndex];
        
        // Save answer
        this.answers[this.currentQuestionIndex] = index;
        
        // Update UI
        const answerButtons = document.querySelectorAll('.answer-option');
        answerButtons.forEach((btn, i) => {
            btn.classList.remove('selected');
            if (i === index) {
                btn.classList.add('selected');
            }
        });
        
        // Show rationale immediately if configured
        if (CONFIG.quiz.showRationaleImmediately) {
            this.showRationale(index);
        }
        
        console.log(`✓ Answer selected: ${index}`);
    },
    
    /**
     * Show rationale/explanation
     */
    showRationale(selectedIndex) {
        const question = this.questions[this.currentQuestionIndex];
        const correctIndex = question.shuffledCorrectAnswer ?? question.correctAnswer;
        const isCorrect = selectedIndex === correctIndex;
        
        // Update answer buttons
        const answerButtons = document.querySelectorAll('.answer-option');
        answerButtons.forEach((btn, i) => {
            btn.disabled = true;
            if (i === correctIndex) {
                btn.classList.add('correct');
            } else if (i === selectedIndex && !isCorrect) {
                btn.classList.add('incorrect');
            }
        });
        
        // Show rationale
        const rationaleEl = document.querySelector('.rationale');
        if (rationaleEl) {
            rationaleEl.style.display = 'block';
            rationaleEl.innerHTML = `
                <div class="rationale-header ${isCorrect ? 'correct' : 'incorrect'}">
                    ${isCorrect ? '✅ Correct!' : '❌ Incorrect'}
                </div>
                <div class="rationale-content">
                    <strong>Explanation:</strong>
                    <p>${question.rationale}</p>
                </div>
            `;
        }
    },
    
    /**
     * Hide rationale
     */
    hideRationale() {
        const rationaleEl = document.querySelector('.rationale');
        if (rationaleEl) {
            rationaleEl.style.display = 'none';
        }
    },
    
    /**
     * Update progress bar
     */
    updateProgress() {
        const progressBar = document.querySelector('.quiz-progress-fill');
        if (progressBar) {
            const percentage = ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
            progressBar.style.width = `${percentage}%`;
        }
        
        const progressText = document.querySelector('.progress-text');
        if (progressText) {
            const answered = this.answers.filter(a => a !== null).length;
            progressText.textContent = `${answered}/${this.questions.length} answered`;
        }
    },
    
    /**
     * Update navigation buttons
     */
    updateNavigationButtons() {
        const prevBtn = document.querySelector('[data-action="previous"]');
        const nextBtn = document.querySelector('[data-action="next"]');
        const submitBtn = document.querySelector('[data-action="submit"]');
        
        // Previous button
        if (prevBtn) {
            prevBtn.disabled = this.currentQuestionIndex === 0;
        }
        
        // Next/Submit button
        const isLastQuestion = this.currentQuestionIndex === this.questions.length - 1;
        
        if (isLastQuestion) {
            if (nextBtn) nextBtn.style.display = 'none';
            if (submitBtn) submitBtn.style.display = 'inline-block';
        } else {
            if (nextBtn) nextBtn.style.display = 'inline-block';
            if (submitBtn) submitBtn.style.display = 'none';
        }
    },
    
    /**
     * Go to next question
     */
    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            this.showQuestion();
        }
    },
    
    /**
     * Go to previous question
     */
    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.showQuestion();
        }
    },
    
    /**
     * Toggle bookmark for current question
     */
    toggleBookmark() {
        const question = this.questions[this.currentQuestionIndex];
        Storage.toggleBookmark(question.id);
        this.updateBookmarkButton();
        
        const isBookmarked = Storage.isBookmarked(question.id);
        App.showNotification(
            isBookmarked ? '🔖 Question bookmarked' : 'Bookmark removed',
            'info'
        );
    },
    
    /**
     * Update bookmark button state
     */
    updateBookmarkButton() {
        const bookmarkBtn = document.querySelector('[data-action="bookmark"]');
        if (!bookmarkBtn) return;
        
        const question = this.questions[this.currentQuestionIndex];
        const isBookmarked = Storage.isBookmarked(question.id);
        
        bookmarkBtn.textContent = isBookmarked ? '🔖 Bookmarked' : '🔖 Bookmark';
        bookmarkBtn.classList.toggle('active', isBookmarked);
    },
    
    /**
     * Submit quiz and show results
     */
    submitQuiz() {
        // Check if all questions answered
        const unanswered = this.answers.filter(a => a === null).length;
        if (unanswered > 0) {
            const confirm = window.confirm(
                `You have ${unanswered} unanswered question(s). Submit anyway?`
            );
            if (!confirm) return;
        }
        
        // Stop timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        // Calculate results
        const results = this.calculateResults();
        
        // Save to storage
        Storage.saveQuizResult(results);
        
        // Update progress
        this.updateProgress();
        
        // Show results
        this.showResults(results);
        
        console.log('📊 Quiz submitted', results);
    },
    
    /**
     * Calculate quiz results
     */
    calculateResults() {
        let correct = 0;
        let incorrect = 0;
        let unanswered = 0;
        
        this.questions.forEach((question, index) => {
            const userAnswer = this.answers[index];
            const correctAnswer = question.shuffledCorrectAnswer ?? question.correctAnswer;
            
            if (userAnswer === null) {
                unanswered++;
            } else if (userAnswer === correctAnswer) {
                correct++;
            } else {
                incorrect++;
            }
        });
        
        const totalTime = Math.floor((Date.now() - this.startTime) / 1000);
        const percentage = Math.round((correct / this.questions.length) * 100);
        
        return {
            mode: this.mode,
            category: this.category,
            totalQuestions: this.questions.length,
            correct,
            incorrect,
            unanswered,
            percentage,
            timeSeconds: totalTime,
            passed: percentage >= CONFIG.exam.passingScorePercent
        };
    },
    
    /**
     * Show results screen
     */
    showResults(results) {
        const container = document.querySelector('.quiz-container');
        if (!container) return;
        
        const passedClass = results.passed ? 'passed' : 'failed';
        const passedEmoji = results.passed ? '🎉' : '📚';
        const passedMessage = results.passed 
            ? 'Great job! You passed!' 
            : 'Keep studying! You\'ll get there!';
        
        container.innerHTML = `
            <div class="results-screen ${passedClass}">
                <div class="results-header">
                    <h1>${passedEmoji} Quiz Complete!</h1>
                    <p class="results-message">${passedMessage}</p>
                </div>
                
                <div class="results-score">
                    <div class="score-circle">
                        <span class="score-percentage">${results.percentage}%</span>
                        <span class="score-label">${results.correct}/${results.totalQuestions}</span>
                    </div>
                </div>
                
                <div class="results-details">
                    <div class="result-stat">
                        <span class="stat-label">✅ Correct</span>
                        <span class="stat-value">${results.correct}</span>
                    </div>
                    <div class="result-stat">
                        <span class="stat-label">❌ Incorrect</span>
                        <span class="stat-value">${results.incorrect}</span>
                    </div>
                    <div class="result-stat">
                        <span class="stat-label">⏱️ Time</span>
                        <span class="stat-value">${App.formatTime(results.timeSeconds)}</span>
                    </div>
                </div>
                
                <div class="results-actions">
                    <button class="btn btn-primary" onclick="window.location.href='quiz.html?mode=${this.mode}${this.category ? '&category=' + this.category : ''}'">
                        Try Again
                    </button>
                    <button class="btn btn-secondary" onclick="window.location.href='progress.html'">
                        View Progress
                    </button>
                    <button class="btn btn-secondary" onclick="window.location.href='index.html'">
                        Back to Home
                    </button>
                </div>
            </div>
        `;
    }
};

// Auto-initialize if on quiz page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.location.pathname.includes('quiz.html')) {
            Quiz.init();
        }
    });
} else {
    if (window.location.pathname.includes('quiz.html')) {
        Quiz.init();
    }
}

// Make Quiz available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Quiz;
}
