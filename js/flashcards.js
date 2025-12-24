/**
 * CEN Exam Prep - Flashcards Module
 * 
 * Implements spaced repetition system for effective memorization.
 * Uses a simplified version of the SM-2 algorithm.
 */

const Flashcards = {
    // Flashcard state
    cards: [],
    currentCardIndex: 0,
    isFlipped: false,
    category: null,
    reviewMode: 'all', // 'all', 'due', 'new'
    
    /**
     * Initialize flashcards
     */
    async init() {
        console.log('🎴 Initializing flashcards...');
        
        // Get parameters from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.category = urlParams.get('category') || null;
        this.reviewMode = urlParams.get('mode') || 'all';
        
        // Load flashcards
        await this.loadFlashcards();
        
        // Setup UI
        this.setupUI();
        
        // Show first card
        if (this.cards.length > 0) {
            this.showCard();
        } else {
            this.showNoCards();
        }
    },
    
    /**
     * Load flashcards
     */
    async loadFlashcards() {
        try {
            // For now, generate sample flashcards
            // Later you can load from JSON files
            this.cards = this.generateSampleFlashcards();
            
            // Filter based on review mode
            this.filterCards();
            
            // Shuffle if configured
            if (CONFIG.flashcards.shuffleCards) {
                this.shuffleArray(this.cards);
            }
            
            console.log(`🎴 Loaded ${this.cards.length} flashcards`);
        } catch (error) {
            console.error('❌ Error loading flashcards:', error);
            this.cards = [];
        }
    },
    
    /**
     * Generate sample flashcards (temporary)
     */
    generateSampleFlashcards() {
        const categories = App.categories.length > 0 ? App.categories : [
            { id: 'cardiovascular', name: 'Cardiovascular' },
            { id: 'respiratory', name: 'Respiratory' },
            { id: 'neurological', name: 'Neurological' }
        ];
        
        const cards = [];
        const count = 20; // Generate 20 sample cards
        
        const sampleTopics = [
            { front: 'What is the normal heart rate range?', back: '60-100 beats per minute for adults at rest' },
            { front: 'What does STEMI stand for?', back: 'ST-Elevation Myocardial Infarction' },
            { front: 'What is the Glasgow Coma Scale range?', back: '3-15, with 3 being the lowest (deep coma) and 15 being fully alert' },
            { front: 'What is normal blood pressure?', back: 'Systolic < 120 mmHg and Diastolic < 80 mmHg' },
            { front: 'What does SAMPLE stand for?', back: 'Signs/Symptoms, Allergies, Medications, Past medical history, Last oral intake, Events leading up' },
            { front: 'What is the normal respiratory rate?', back: '12-20 breaths per minute for adults' },
            { front: 'What is the Cushing\'s Triad?', back: 'Hypertension, bradycardia, and irregular respirations - indicates increased intracranial pressure' },
            { front: 'What is Beck\'s Triad?', back: 'Hypotension, muffled heart sounds, and JVD - indicates cardiac tamponade' },
            { front: 'What is normal oxygen saturation?', back: '95-100% on room air' },
            { front: 'What does OPQRST stand for?', back: 'Onset, Provocation, Quality, Radiation, Severity, Time' }
        ];
        
        for (let i = 0; i < count; i++) {
            const category = this.category 
                ? categories.find(c => c.id === this.category) 
                : categories[Math.floor(Math.random() * categories.length)];
            
            const topic = sampleTopics[i % sampleTopics.length];
            
            cards.push({
                id: `card${i + 1}`,
                category: category.id,
                categoryName: category.name,
                front: topic.front,
                back: topic.back,
                difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)],
                tags: ['sample', category.id]
            });
        }
        
        return cards;
    },
    
    /**
     * Filter cards based on review mode
     */
    filterCards() {
        const now = Date.now();
        
        switch (this.reviewMode) {
            case 'due':
                // Only cards due for review
                this.cards = this.cards.filter(card => {
                    const progress = Storage.getFlashcardProgress(card.id);
                    return progress.nextReview <= now;
                });
                break;
            
            case 'new':
                // Only cards never reviewed
                this.cards = this.cards.filter(card => {
                    const progress = Storage.getFlashcardProgress(card.id);
                    return progress.reviews === 0;
                });
                break;
            
            case 'all':
            default:
                // All cards (no filter)
                break;
        }
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
     * Setup UI elements
     */
    setupUI() {
        // Card flip
        const cardEl = document.querySelector('.flashcard');
        if (cardEl) {
            cardEl.addEventListener('click', () => this.flipCard());
        }
        
        // Difficulty buttons
        const easyBtn = document.querySelector('[data-difficulty="easy"]');
        const mediumBtn = document.querySelector('[data-difficulty="medium"]');
        const hardBtn = document.querySelector('[data-difficulty="hard"]');
        
        if (easyBtn) easyBtn.addEventListener('click', () => this.rateCard('easy'));
        if (mediumBtn) mediumBtn.addEventListener('click', () => this.rateCard('medium'));
        if (hardBtn) hardBtn.addEventListener('click', () => this.rateCard('hard'));
        
        // Navigation
        const prevBtn = document.querySelector('[data-action="previous"]');
        const nextBtn = document.querySelector('[data-action="next"]');
        
        if (prevBtn) prevBtn.addEventListener('click', () => this.previousCard());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextCard());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    },
    
    /**
     * Show current card
     */
    showCard() {
        const card = this.cards[this.currentCardIndex];
        if (!card) return;
        
        this.isFlipped = false;
        
        // Update progress
        this.updateProgress();
        
        // Update card content
        const frontEl = document.querySelector('.card-front .card-content');
        const backEl = document.querySelector('.card-back .card-content');
        
        if (frontEl) frontEl.textContent = card.front;
        if (backEl) backEl.textContent = card.back;
        
        // Update category
        const categoryEl = document.querySelector('.card-category');
        if (categoryEl) {
            categoryEl.textContent = card.categoryName || card.category;
        }
        
        // Reset flip state
        const cardEl = document.querySelector('.flashcard');
        if (cardEl) {
            cardEl.classList.remove('flipped');
        }
        
        // Hide difficulty buttons initially
        this.hideDifficultyButtons();
        
        // Update navigation buttons
        this.updateNavigationButtons();
        
        // Show review info
        this.showReviewInfo(card);
    },
    
    /**
     * Show review information
     */
    showReviewInfo(card) {
        const progress = Storage.getFlashcardProgress(card.id);
        const infoEl = document.querySelector('.review-info');
        
        if (infoEl && progress.reviews > 0) {
            const nextReview = new Date(progress.nextReview);
            const isDue = progress.nextReview <= Date.now();
            
            infoEl.innerHTML = `
                <span class="review-count">Reviewed ${progress.reviews} time(s)</span>
                <span class="review-next ${isDue ? 'due' : ''}">
                    ${isDue ? '⚠️ Due for review' : `Next: ${this.formatDate(nextReview)}`}
                </span>
            `;
            infoEl.style.display = 'flex';
        } else if (infoEl) {
            infoEl.style.display = 'none';
        }
    },
    
    /**
     * Flip the card
     */
    flipCard() {
        this.isFlipped = !this.isFlipped;
        
        const cardEl = document.querySelector('.flashcard');
        if (cardEl) {
            cardEl.classList.toggle('flipped');
        }
        
        // Show difficulty buttons when flipped
        if (this.isFlipped) {
            this.showDifficultyButtons();
        } else {
            this.hideDifficultyButtons();
        }
    },
    
    /**
     * Show difficulty rating buttons
     */
    showDifficultyButtons() {
        const buttonsEl = document.querySelector('.difficulty-buttons');
        if (buttonsEl) {
            buttonsEl.style.display = 'flex';
        }
    },
    
    /**
     * Hide difficulty rating buttons
     */
    hideDifficultyButtons() {
        const buttonsEl = document.querySelector('.difficulty-buttons');
        if (buttonsEl) {
            buttonsEl.style.display = 'none';
        }
    },
    
    /**
     * Rate card difficulty (spaced repetition)
     */
    rateCard(difficulty) {
        const card = this.cards[this.currentCardIndex];
        const progress = Storage.getFlashcardProgress(card.id);
        
        // Calculate next review interval using simplified SM-2 algorithm
        const intervals = this.calculateInterval(progress.interval, difficulty);
        
        // Update progress
        progress.interval = intervals.newInterval;
        progress.nextReview = Date.now() + (intervals.nextReviewDays * 24 * 60 * 60 * 1000);
        progress.reviews++;
        progress.lastReview = Date.now();
        
        // Save progress
        Storage.saveFlashcardProgress(card.id, progress);
        
        // Show feedback
        this.showFeedback(difficulty, intervals.nextReviewDays);
        
        // Move to next card after delay
        setTimeout(() => {
            this.nextCard();
        }, 1000);
    },
    
    /**
     * Calculate next review interval (simplified SM-2)
     */
    calculateInterval(currentInterval, difficulty) {
        let newInterval;
        let nextReviewDays;
        
        switch (difficulty) {
            case 'hard':
                // Review soon
                newInterval = 0;
                nextReviewDays = 1;
                break;
            
            case 'medium':
                // Review in a few days
                newInterval = Math.max(1, currentInterval);
                nextReviewDays = currentInterval === 0 ? 3 : currentInterval * 1.5;
                break;
            
            case 'easy':
                // Review later
                newInterval = Math.max(1, currentInterval);
                nextReviewDays = currentInterval === 0 ? 7 : currentInterval * 2.5;
                break;
            
            default:
                newInterval = 0;
                nextReviewDays = 1;
        }
        
        return {
            newInterval: Math.round(newInterval),
            nextReviewDays: Math.round(nextReviewDays)
        };
    },
    
    /**
     * Show feedback after rating
     */
    showFeedback(difficulty, nextReviewDays) {
        const messages = {
            hard: `📚 You'll see this again tomorrow`,
            medium: `📅 Review in ${nextReviewDays} days`,
            easy: `✅ Review in ${nextReviewDays} days`
        };
        
        App.showNotification(messages[difficulty] || 'Saved!', 'success');
    },
    
    /**
     * Go to next card
     */
    nextCard() {
        if (this.currentCardIndex < this.cards.length - 1) {
            this.currentCardIndex++;
            this.showCard();
        } else {
            this.showComplete();
        }
    },
    
    /**
     * Go to previous card
     */
    previousCard() {
        if (this.currentCardIndex > 0) {
            this.currentCardIndex--;
            this.showCard();
        }
    },
    
    /**
     * Update progress indicator
     */
    updateProgress() {
        const progressBar = document.querySelector('.flashcard-progress-fill');
        if (progressBar) {
            const percentage = ((this.currentCardIndex + 1) / this.cards.length) * 100;
            progressBar.style.width = `${percentage}%`;
        }
        
        const progressText = document.querySelector('.progress-text');
        if (progressText) {
            progressText.textContent = `${this.currentCardIndex + 1} / ${this.cards.length}`;
        }
    },
    
    /**
     * Update navigation buttons
     */
    updateNavigationButtons() {
        const prevBtn = document.querySelector('[data-action="previous"]');
        const nextBtn = document.querySelector('[data-action="next"]');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentCardIndex === 0;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentCardIndex === this.cards.length - 1;
        }
    },
    
    /**
     * Handle keyboard shortcuts
     */
    handleKeyPress(e) {
        // Only handle if on flashcards page
        if (!window.location.pathname.includes('flashcards.html')) return;
        
        switch (e.key) {
            case ' ':
            case 'Enter':
                e.preventDefault();
                this.flipCard();
                break;
            
            case 'ArrowLeft':
                e.preventDefault();
                this.previousCard();
                break;
            
            case 'ArrowRight':
                e.preventDefault();
                if (this.isFlipped) {
                    this.rateCard('medium');
                } else {
                    this.nextCard();
                }
                break;
            
            case '1':
                if (this.isFlipped) this.rateCard('hard');
                break;
            
            case '2':
                if (this.isFlipped) this.rateCard('medium');
                break;
            
            case '3':
                if (this.isFlipped) this.rateCard('easy');
                break;
        }
    },
    
    /**
     * Show completion message
     */
    showComplete() {
        const container = document.querySelector('.flashcard-container');
        if (!container) return;
        
        const totalReviewed = this.cards.length;
        
        container.innerHTML = `
            <div class="completion-screen">
                <div class="completion-icon">🎉</div>
                <h1>Session Complete!</h1>
                <p>You reviewed <strong>${totalReviewed}</strong> flashcard(s)</p>
                
                <div class="completion-stats">
                    <div class="stat">
                        <span class="stat-label">Total Cards</span>
                        <span class="stat-value">${totalReviewed}</span>
                    </div>
                </div>
                
                <div class="completion-actions">
                    <button class="btn btn-primary" onclick="window.location.reload()">
                        Review Again
                    </button>
                    <button class="btn btn-secondary" onclick="window.location.href='flashcards.html?mode=due'">
                        Review Due Cards
                    </button>
                    <button class="btn btn-secondary" onclick="window.location.href='index.html'">
                        Back to Home
                    </button>
                </div>
                
                <div class="keyboard-shortcuts">
                    <h3>⌨️ Keyboard Shortcuts</h3>
                    <ul>
                        <li><kbd>Space</kbd> or <kbd>Enter</kbd> - Flip card</li>
                        <li><kbd>1</kbd> - Hard (review tomorrow)</li>
                        <li><kbd>2</kbd> - Medium (review in a few days)</li>
                        <li><kbd>3</kbd> - Easy (review later)</li>
                        <li><kbd>←</kbd> / <kbd>→</kbd> - Previous / Next</li>
                    </ul>
                </div>
            </div>
        `;
    },
    
    /**
     * Show no cards message
     */
    showNoCards() {
        const container = document.querySelector('.flashcard-container');
        if (!container) return;
        
        const modeMessages = {
            due: 'No cards are due for review right now. Great job staying on top of your studies!',
            new: 'No new cards available. Try reviewing all cards or a specific category.',
            all: 'No flashcards found. Try selecting a different category.'
        };
        
        container.innerHTML = `
            <div class="no-cards-screen">
                <div class="no-cards-icon">🎴</div>
                <h2>No Flashcards Available</h2>
                <p>${modeMessages[this.reviewMode] || 'No flashcards found.'}</p>
                
                <div class="no-cards-actions">
                    <button class="btn btn-primary" onclick="window.location.href='flashcards.html?mode=all'">
                        View All Cards
                    </button>
                    <button class="btn btn-secondary" onclick="window.location.href='index.html'">
                        Back to Home
                    </button>
                </div>
            </div>
        `;
    },
    
    /**
     * Format date for display
     */
    formatDate(date) {
        const now = new Date();
        const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays < 7) return `In ${diffDays} days`;
        
        return date.toLocaleDateString();
    }
};

// Auto-initialize if on flashcards page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.location.pathname.includes('flashcards.html')) {
            Flashcards.init();
        }
    });
} else {
    if (window.location.pathname.includes('flashcards.html')) {
        Flashcards.init();
    }
}

// Make Flashcards available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Flashcards;
}
