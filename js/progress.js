/**
 * CEN Exam Prep - Progress Module
 * 
 * Handles progress tracking, statistics, and data visualization.
 */

const Progress = {
    // Progress data
    progressData: null,
    
    /**
     * Initialize progress page
     */
    init() {
        console.log('📊 Initializing progress page...');
        
        // Load progress data
        this.loadProgressData();
        
        // Render all sections
        this.renderOverview();
        this.renderCategoryProgress();
        this.renderQuizHistory();
        this.renderStudyStreak();
        this.renderFlashcardStats();
        
        // Setup export/import
        this.setupDataManagement();
    },
    
    /**
     * Load progress data from storage
     */
    loadProgressData() {
        this.progressData = Storage.getProgress();
        console.log('Progress data loaded:', this.progressData);
    },
    
    /**
     * Render overview statistics
     */
    renderOverview() {
        const container = document.querySelector('.overview-stats');
        if (!container) return;
        
        const data = this.progressData;
        
        // Calculate statistics
        const totalQuestions = data.totalQuestions || 0;
        const correctAnswers = data.correctAnswers || 0;
        const accuracy = totalQuestions > 0 
            ? Math.round((correctAnswers / totalQuestions) * 100) 
            : 0;
        
        const totalQuizzes = data.quizHistory ? data.quizHistory.length : 0;
        const studyStreak = data.studyStreak || 0;
        
        const flashcardCount = Object.keys(data.flashcardProgress || {}).length;
        const reviewedCards = Object.values(data.flashcardProgress || {})
            .filter(p => p.reviews > 0).length;
        
        // Render stats cards
        container.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon">📝</div>
                <div class="stat-content">
                    <div class="stat-value">${totalQuestions}</div>
                    <div class="stat-label">Questions Answered</div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">🎯</div>
                <div class="stat-content">
                    <div class="stat-value">${accuracy}%</div>
                    <div class="stat-label">Accuracy</div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">📊</div>
                <div class="stat-content">
                    <div class="stat-value">${totalQuizzes}</div>
                    <div class="stat-label">Quizzes Taken</div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">🔥</div>
                <div class="stat-content">
                    <div class="stat-value">${studyStreak}</div>
                    <div class="stat-label">Day Streak</div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">🎴</div>
                <div class="stat-content">
                    <div class="stat-value">${reviewedCards}/${flashcardCount}</div>
                    <div class="stat-label">Cards Reviewed</div>
                </div>
            </div>
        `;
    },
    
    /**
     * Render category progress
     */
    renderCategoryProgress() {
        const container = document.querySelector('.category-progress');
        if (!container) return;
        
        const categoryProgress = this.progressData.categoryProgress || {};
        const categories = App.categories;
        
        if (categories.length === 0) {
            container.innerHTML = '<p>Loading categories...</p>';
            return;
        }
        
        let html = '<h2>Progress by Category</h2><div class="category-list">';
        
        categories.forEach(category => {
            const progress = categoryProgress[category.id] || { answered: 0, correct: 0 };
            const percentage = progress.answered > 0 
                ? Math.round((progress.correct / progress.answered) * 100) 
                : 0;
            
            const completionPercentage = category.targetPracticeQuestions > 0
                ? Math.min(100, Math.round((progress.answered / category.targetPracticeQuestions) * 100))
                : 0;
            
            html += `
                <div class="category-progress-item">
                    <div class="category-header">
                        <h3>${category.name}</h3>
                        <span class="category-weight">${category.examPercentage}% of exam</span>
                    </div>
                    
                    <div class="category-stats">
                        <div class="stat">
                            <span class="stat-label">Questions</span>
                            <span class="stat-value">${progress.answered}/${category.targetPracticeQuestions}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Accuracy</span>
                            <span class="stat-value">${percentage}%</span>
                        </div>
                    </div>
                    
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${completionPercentage}%"></div>
                    </div>
                    <div class="progress-label">${completionPercentage}% Complete</div>
                    
                    <div class="category-actions">
                        <button class="btn btn-sm btn-primary" onclick="window.location.href='quiz.html?category=${category.id}'">
                            Practice
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="window.location.href='study.html?category=${category.id}'">
                            Study
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    },
    
    /**
     * Render quiz history
     */
    renderQuizHistory() {
        const container = document.querySelector('.quiz-history');
        if (!container) return;
        
        const quizHistory = this.progressData.quizHistory || [];
        
        if (quizHistory.length === 0) {
            container.innerHTML = `
                <h2>Quiz History</h2>
                <div class="empty-state">
                    <p>No quizzes taken yet. Start practicing to see your history!</p>
                    <button class="btn btn-primary" onclick="window.location.href='quiz.html'">
                        Take a Quiz
                    </button>
                </div>
            `;
            return;
        }
        
        // Sort by most recent first
        const sortedHistory = [...quizHistory].reverse();
        
        let html = '<h2>Recent Quiz Results</h2><div class="quiz-history-list">';
        
        // Show last 10 quizzes
        sortedHistory.slice(0, 10).forEach(quiz => {
            const date = new Date(quiz.timestamp);
            const passedClass = quiz.passed ? 'passed' : 'failed';
            const passedIcon = quiz.passed ? '✅' : '❌';
            
            const categoryName = quiz.category 
                ? (App.getCategoryById(quiz.category)?.name || quiz.category)
                : 'Mixed';
            
            html += `
                <div class="quiz-history-item ${passedClass}">
                    <div class="quiz-icon">${passedIcon}</div>
                    <div class="quiz-info">
                        <div class="quiz-title">
                            <strong>${this.getModeLabel(quiz.mode)}</strong>
                            <span class="quiz-category">${categoryName}</span>
                        </div>
                        <div class="quiz-date">${this.formatDate(date)}</div>
                    </div>
                    <div class="quiz-score">
                        <div class="score-percentage">${quiz.percentage}%</div>
                        <div class="score-detail">${quiz.correct}/${quiz.totalQuestions}</div>
                    </div>
                    <div class="quiz-time">
                        <div class="time-icon">⏱️</div>
                        <div class="time-value">${this.formatTime(quiz.timeSeconds)}</div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        
        // Add chart if enough data
        if (quizHistory.length >= 3) {
            html += this.renderQuizChart(quizHistory);
        }
        
        container.innerHTML = html;
    },
    
    /**
     * Render quiz performance chart
     */
    renderQuizChart(quizHistory) {
        const recentQuizzes = quizHistory.slice(-10);
        const maxScore = 100;
        const chartHeight = 200;
        
        let html = `
            <div class="quiz-chart">
                <h3>Performance Trend</h3>
                <div class="chart-container">
                    <svg class="chart" viewBox="0 0 600 ${chartHeight}" preserveAspectRatio="none">
        `;
        
        // Draw grid lines
        for (let i = 0; i <= 4; i++) {
            const y = (chartHeight / 4) * i;
            const score = maxScore - (maxScore / 4) * i;
            html += `
                <line x1="0" y1="${y}" x2="600" y2="${y}" stroke="#e0e0e0" stroke-width="1"/>
                <text x="5" y="${y - 5}" font-size="12" fill="#666">${score}%</text>
            `;
        }
        
        // Draw line chart
        const points = recentQuizzes.map((quiz, index) => {
            const x = (600 / (recentQuizzes.length - 1)) * index;
            const y = chartHeight - (quiz.percentage / maxScore) * chartHeight;
            return `${x},${y}`;
        }).join(' ');
        
        html += `
                <polyline points="${points}" fill="none" stroke="#4CAF50" stroke-width="3"/>
        `;
        
        // Draw points
        recentQuizzes.forEach((quiz, index) => {
            const x = (600 / (recentQuizzes.length - 1)) * index;
            const y = chartHeight - (quiz.percentage / maxScore) * chartHeight;
            const color = quiz.passed ? '#4CAF50' : '#f44336';
            
            html += `
                <circle cx="${x}" cy="${y}" r="5" fill="${color}" stroke="white" stroke-width="2"/>
            `;
        });
        
        html += `
                    </svg>
                </div>
            </div>
        `;
        
        return html;
    },
    
    /**
     * Render study streak
     */
    renderStudyStreak() {
        const container = document.querySelector('.study-streak');
        if (!container) return;
        
        const streak = this.progressData.studyStreak || 0;
        const lastStudy = this.progressData.lastStudyDate 
            ? new Date(this.progressData.lastStudyDate)
            : null;
        
        const today = new Date().toDateString();
        const studiedToday = lastStudy && lastStudy.toDateString() === today;
        
        let html = `
            <h2>🔥 Study Streak</h2>
            <div class="streak-display">
                <div class="streak-number">${streak}</div>
                <div class="streak-label">Day${streak !== 1 ? 's' : ''}</div>
            </div>
        `;
        
        if (studiedToday) {
            html += `<p class="streak-status success">✅ You've studied today! Keep it up!</p>`;
        } else if (streak > 0) {
            html += `<p class="streak-status warning">⚠️ Study today to maintain your streak!</p>`;
        } else {
            html += `<p class="streak-status info">Start studying today to begin your streak!</p>`;
        }
        
        // Show calendar for last 7 days
        html += this.renderStreakCalendar();
        
        container.innerHTML = html;
    },
    
    /**
     * Render streak calendar
     */
    renderStreakCalendar() {
        const quizHistory = this.progressData.quizHistory || [];
        const today = new Date();
        
        let html = '<div class="streak-calendar">';
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toDateString();
            
            // Check if studied on this day
            const studiedThisDay = quizHistory.some(quiz => {
                const quizDate = new Date(quiz.timestamp);
                return quizDate.toDateString() === dateStr;
            });
            
            const dayName = i === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
            const activeClass = studiedThisDay ? 'active' : '';
            
            html += `
                <div class="calendar-day ${activeClass}">
                    <div class="day-name">${dayName}</div>
                    <div class="day-indicator">${studiedThisDay ? '✓' : ''}</div>
                </div>
            `;
        }
        
        html += '</div>';
        return html;
    },
    
    /**
     * Render flashcard statistics
     */
    renderFlashcardStats() {
        const container = document.querySelector('.flashcard-stats');
        if (!container) return;
        
        const flashcardProgress = this.progressData.flashcardProgress || {};
        const cards = Object.values(flashcardProgress);
        
        if (cards.length === 0) {
            container.innerHTML = `
                <h2>Flashcard Progress</h2>
                <div class="empty-state">
                    <p>No flashcards reviewed yet. Start reviewing to track your progress!</p>
                    <button class="btn btn-primary" onclick="window.location.href='flashcards.html'">
                        Review Flashcards
                    </button>
                </div>
            `;
            return;
        }
        
        // Calculate stats
        const totalCards = cards.length;
        const reviewedCards = cards.filter(c => c.reviews > 0).length;
        const dueCards = cards.filter(c => c.nextReview <= Date.now()).length;
        const totalReviews = cards.reduce((sum, c) => sum + c.reviews, 0);
        
        let html = `
            <h2>Flashcard Progress</h2>
            <div class="flashcard-overview">
                <div class="flashcard-stat">
                    <div class="stat-value">${reviewedCards}/${totalCards}</div>
                    <div class="stat-label">Cards Reviewed</div>
                </div>
                <div class="flashcard-stat">
                    <div class="stat-value">${dueCards}</div>
                    <div class="stat-label">Due for Review</div>
                </div>
                <div class="flashcard-stat">
                    <div class="stat-value">${totalReviews}</div>
                    <div class="stat-label">Total Reviews</div>
                </div>
            </div>
        `;
        
        if (dueCards > 0) {
            html += `
                <div class="flashcard-action">
                    <button class="btn btn-primary" onclick="window.location.href='flashcards.html?mode=due'">
                        Review ${dueCards} Due Card${dueCards !== 1 ? 's' : ''}
                    </button>
                </div>
            `;
        }
        
        container.innerHTML = html;
    },
    
    /**
     * Setup data management (export/import)
     */
    setupDataManagement() {
        // Export button
        const exportBtn = document.querySelector('[data-action="export"]');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }
        
        // Import button
        const importBtn = document.querySelector('[data-action="import"]');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.importData());
        }
        
        // Clear data button
        const clearBtn = document.querySelector('[data-action="clear"]');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearData());
        }
    },
    
    /**
     * Export progress data
     */
    exportData() {
        const data = Storage.exportData();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `cen-exam-prep-backup-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        App.showNotification('✅ Data exported successfully!', 'success');
    },
    
    /**
     * Import progress data
     */
    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    const confirm = window.confirm(
                        'This will replace your current progress. Continue?'
                    );
                    
                    if (confirm) {
                        Storage.importData(data);
                        App.showNotification('✅ Data imported successfully!', 'success');
                        setTimeout(() => window.location.reload(), 1000);
                    }
                } catch (error) {
                    console.error('Import error:', error);
                    App.showNotification('❌ Invalid file format', 'error');
                }
            };
            
            reader.readAsText(file);
        });
        
        input.click();
    },
    
    /**
     * Clear all progress data
     */
    clearData() {
        const confirm = window.confirm(
            '⚠️ This will delete ALL your progress data. This cannot be undone. Are you sure?'
        );
        
        if (confirm) {
            const doubleConfirm = window.confirm(
                'Really delete everything? Last chance!'
            );
            
            if (doubleConfirm) {
                Storage.clearAll();
                App.showNotification('🗑️ All data cleared', 'info');
                setTimeout(() => window.location.reload(), 1000);
            }
        }
    },
    
    /**
     * Get mode label
     */
    getModeLabel(mode) {
        const labels = {
            quick: 'Quick Quiz',
            focused: 'Focused Practice',
            full: 'Full Exam'
        };
        return labels[mode] || mode;
    },
    
    /**
     * Format date
     */
    formatDate(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        
        return date.toLocaleDateString();
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
    }
};

// Auto-initialize if on progress page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.location.pathname.includes('progress.html')) {
            Progress.init();
        }
    });
} else {
    if (window.location.pathname.includes('progress.html')) {
        Progress.init();
    }
}

// Make Progress available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Progress;
}
