/**
 * CEN Exam Prep - Main Application Module
 * 
 * Handles app initialization, navigation, and core UI functionality.
 */

const App = {
    // Current page
    currentPage: null,
    
    // Categories data
    categories: [],
    
    /**
     * Initialize the application
     */
    async init() {
        console.log('🚀 CEN Exam Prep initializing...');
        
        // Detect current page
        this.detectCurrentPage();
        
        // Load categories data
        await this.loadCategories();
        
        // Initialize page-specific functionality
        this.initializePage();
        
        // Setup global event listeners
        this.setupGlobalListeners();
        
        // Update study streak
        this.updateStudyStreak();
        
        console.log('✅ App initialized');
    },
    
    /**
     * Detect which page we're on
     */
    detectCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop() || 'index.html';
        
        if (filename === '' || filename === 'index.html') {
            this.currentPage = 'home';
        } else if (filename === 'study.html') {
            this.currentPage = 'study';
        } else if (filename === 'quiz.html') {
            this.currentPage = 'quiz';
        } else if (filename === 'flashcards.html') {
            this.currentPage = 'flashcards';
        } else if (filename === 'progress.html') {
            this.currentPage = 'progress';
        }
        
        console.log(`📄 Current page: ${this.currentPage}`);
    },
    
    /**
     * Load categories from JSON
     */
    async loadCategories() {
        try {
            const response = await fetch('data/content-outline.json');
            const data = await response.json();
            this.categories = data.categories;
            console.log(`📚 Loaded ${this.categories.length} categories`);
            return this.categories;
        } catch (error) {
            console.error('❌ Error loading categories:', error);
            this.categories = [];
            return [];
        }
    },
    
    /**
     * Get category by ID
     */
    getCategoryById(id) {
        return this.categories.find(cat => cat.id === id);
    },
    
    /**
     * Initialize page-specific functionality
     */
    initializePage() {
        switch (this.currentPage) {
            case 'home':
                this.initHomePage();
                break;
            case 'study':
                this.initStudyPage();
                break;
            case 'quiz':
                if (typeof Quiz !== 'undefined') {
                    Quiz.init();
                }
                break;
            case 'flashcards':
                if (typeof Flashcards !== 'undefined') {
                    Flashcards.init();
                }
                break;
            case 'progress':
                if (typeof Progress !== 'undefined') {
                    Progress.init();
                }
                break;
        }
    },
    
    /**
     * Initialize home page
     */
    initHomePage() {
        console.log('🏠 Initializing home page...');
        
        // Update progress stats in hero section
        this.updateHomeStats();
        
        // Add click handlers to category cards
        this.setupCategoryCards();
        
        // Setup quick action buttons
        this.setupQuickActions();
    },
    
    /**
     * Update stats on home page
     */
    updateHomeStats() {
        const progress = Storage.getProgress();
        
        // Update total questions answered
        const questionsEl = document.querySelector('[data-stat="questions"]');
        if (questionsEl) {
            questionsEl.textContent = progress.totalQuestions || 0;
        }
        
        // Update accuracy percentage
        const accuracyEl = document.querySelector('[data-stat="accuracy"]');
        if (accuracyEl && progress.totalQuestions > 0) {
            const accuracy = Math.round((progress.correctAnswers / progress.totalQuestions) * 100);
            accuracyEl.textContent = `${accuracy}%`;
        }
        
        // Update study streak
        const streakEl = document.querySelector('[data-stat="streak"]');
        if (streakEl) {
            streakEl.textContent = progress.studyStreak || 0;
        }
    },
    
    /**
     * Setup category card click handlers
     */
    setupCategoryCards() {
        const cards = document.querySelectorAll('.category-card');
        
        cards.forEach(card => {
            const categoryId = card.dataset.category;
            
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking a button inside the card
                if (e.target.tagName === 'BUTTON') return;
                
                // Navigate to study page for this category
                window.location.href = `study.html?category=${categoryId}`;
            });
            
            // Update progress bar if exists
            this.updateCategoryProgress(card, categoryId);
        });
    },
    
    /**
     * Update progress bar on category card
     */
    updateCategoryProgress(card, categoryId) {
        const progressBar = card.querySelector('.progress-fill');
        if (!progressBar) return;
        
        const progress = Storage.getProgress();
        const categoryProgress = progress.categoryProgress[categoryId] || { answered: 0, correct: 0 };
        const category = this.getCategoryById(categoryId);
        
        if (category && category.targetPracticeQuestions) {
            const percentage = Math.min(100, (categoryProgress.answered / category.targetPracticeQuestions) * 100);
            progressBar.style.width = `${percentage}%`;
        }
    },
    
    /**
     * Setup quick action buttons
     */
    setupQuickActions() {
        // Quick Quiz button
        const quickQuizBtn = document.querySelector('[data-action="quick-quiz"]');
        if (quickQuizBtn) {
            quickQuizBtn.addEventListener('click', () => {
                window.location.href = 'quiz.html?mode=quick';
            });
        }
        
        // Continue Studying button
        const continueBtn = document.querySelector('[data-action="continue"]');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                const lastCategory = this.getLastStudiedCategory();
                if (lastCategory) {
                    window.location.href = `study.html?category=${lastCategory}`;
                } else {
                    window.location.href = 'study.html';
                }
            });
        }
        
        // Review Flashcards button
        const flashcardsBtn = document.querySelector('[data-action="flashcards"]');
        if (flashcardsBtn) {
            flashcardsBtn.addEventListener('click', () => {
                window.location.href = 'flashcards.html';
            });
        }
    },
    
    /**
     * Get last studied category
     */
    getLastStudiedCategory() {
        const progress = Storage.getProgress();
        if (progress.quizHistory && progress.quizHistory.length > 0) {
            const lastQuiz = progress.quizHistory[progress.quizHistory.length - 1];
            return lastQuiz.category || null;
        }
        return null;
    },
    
    /**
     * Initialize study page
     */
    initStudyPage() {
        console.log('📖 Initializing study page...');
        
        // Get category from URL
        const urlParams = new URLSearchParams(window.location.search);
        const categoryId = urlParams.get('category');
        
        if (categoryId) {
            this.loadStudyGuide(categoryId);
        } else {
            this.showCategorySelector();
        }
    },
    
    /**
     * Load study guide for category
     */
    async loadStudyGuide(categoryId) {
        const category = this.getCategoryById(categoryId);
        if (!category) {
            console.error('Category not found:', categoryId);
            return;
        }
        
        // Update page title
        const titleEl = document.querySelector('.study-title');
        if (titleEl) {
            titleEl.textContent = category.name;
        }
        
        // Try to load study guide content
        try {
            const response = await fetch(`data/study-guides/${categoryId}.json`);
            if (response.ok) {
                const guideData = await response.json();
                this.renderStudyGuide(guideData);
            } else {
                this.showPlaceholderContent(category);
            }
        } catch (error) {
            console.log('No study guide found, showing placeholder');
            this.showPlaceholderContent(category);
        }
    },
    
    /**
     * Render study guide content
     */
    renderStudyGuide(guideData) {
        const container = document.querySelector('.study-content');
        if (!container) return;
        
        let html = '';
        
        guideData.sections.forEach(section => {
            html += `
                <div class="study-section">
                    <h2>${section.title}</h2>
                    ${section.content}
                </div>
            `;
        });
        
        container.innerHTML = html;
    },
    
    /**
     * Show placeholder content for category
     */
    showPlaceholderContent(category) {
        const container = document.querySelector('.study-content');
        if (!container) return;
        
        let html = `
            <div class="study-section">
                <h2>About ${category.name}</h2>
                <p><strong>Exam Weight:</strong> ${category.examPercentage}% (${category.examQuestions} questions)</p>
                <p><strong>Practice Target:</strong> ${category.targetPracticeQuestions} questions</p>
                
                <h3>Key Topics</h3>
                <ul>
                    ${category.subcategories.map(sub => `<li>${sub}</li>`).join('')}
                </ul>
                
                <div class="alert alert-info">
                    <strong>📚 Study Guide Coming Soon!</strong>
                    <p>Detailed study materials for this category are being prepared. In the meantime, start practicing with quiz questions!</p>
                </div>
                
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="window.location.href='quiz.html?category=${category.id}'">
                        Practice Questions
                    </button>
                    <button class="btn btn-secondary" onclick="window.location.href='flashcards.html?category=${category.id}'">
                        Review Flashcards
                    </button>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    },
    
    /**
     * Show category selector
     */
    showCategorySelector() {
        const container = document.querySelector('.study-content');
        if (!container) return;
        
        let html = '<h2>Choose a Category to Study</h2><div class="category-grid">';
        
        this.categories.forEach(category => {
            html += `
                <div class="category-card" data-category="${category.id}">
                    <h3>${category.name}</h3>
                    <p>${category.examPercentage}% of exam</p>
                    <button class="btn btn-primary" onclick="window.location.href='study.html?category=${category.id}'">
                        Study Now
                    </button>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    },
    
    /**
     * Setup global event listeners
     */
    setupGlobalListeners() {
        // Mobile menu toggle (if exists)
        const menuToggle = document.querySelector('.menu-toggle');
        const nav = document.querySelector('.nav-links');
        
        if (menuToggle && nav) {
            menuToggle.addEventListener('click', () => {
                nav.classList.toggle('active');
            });
        }
        
        // Handle navigation highlighting
        this.highlightCurrentNav();
    },
    
    /**
     * Highlight current page in navigation
     */
    highlightCurrentNav() {
        const navLinks = document.querySelectorAll('.nav-links a');
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPath || (currentPath === '' && href === 'index.html')) {
                link.classList.add('active');
            }
        });
    },
    
    /**
     * Update study streak
     */
    updateStudyStreak() {
        const progress = Storage.getProgress();
        const today = new Date().toDateString();
        const lastStudy = progress.lastStudyDate ? new Date(progress.lastStudyDate).toDateString() : null;
        
        if (lastStudy !== today) {
            // Check if streak should continue or reset
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toDateString();
            
            if (lastStudy === yesterdayStr) {
                // Continue streak
                progress.studyStreak = (progress.studyStreak || 0) + 1;
            } else if (lastStudy !== today) {
                // Reset streak (missed a day)
                progress.studyStreak = 1;
            }
            
            progress.lastStudyDate = new Date().toISOString();
            Storage.saveProgress(progress);
        }
    },
    
    /**
     * Format time duration
     */
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    },
    
    /**
     * Show notification/toast message
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}

// Make App available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}
