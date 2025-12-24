/**
 * CEN Exam Prep - Storage Module
 * 
 * Handles all localStorage operations with error handling and data validation.
 * Uses CONFIG.storage.prefix to namespace all keys.
 */

const Storage = {
    /**
     * Get prefixed key name
     */
    _key(name) {
        return `${CONFIG.storage.prefix}${name}`;
    },

    /**
     * Save data to localStorage
     */
    save(key, data) {
        try {
            const prefixedKey = this._key(key);
            const jsonData = JSON.stringify(data);
            localStorage.setItem(prefixedKey, jsonData);
            return true;
        } catch (error) {
            console.error('Storage save error:', error);
            return false;
        }
    },

    /**
     * Load data from localStorage
     */
    load(key, defaultValue = null) {
        try {
            const prefixedKey = this._key(key);
            const jsonData = localStorage.getItem(prefixedKey);
            
            if (jsonData === null) {
                return defaultValue;
            }
            
            return JSON.parse(jsonData);
        } catch (error) {
            console.error('Storage load error:', error);
            return defaultValue;
        }
    },

    /**
     * Remove data from localStorage
     */
    remove(key) {
        try {
            const prefixedKey = this._key(key);
            localStorage.removeItem(prefixedKey);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    },

    /**
     * Clear all app data
     */
    clearAll() {
        try {
            const prefix = CONFIG.storage.prefix;
            const keysToRemove = [];
            
            // Find all keys with our prefix
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix)) {
                    keysToRemove.push(key);
                }
            }
            
            // Remove them
            keysToRemove.forEach(key => localStorage.removeItem(key));
            
            return true;
        } catch (error) {
            console.error('Storage clearAll error:', error);
            return false;
        }
    },

    /**
     * Get storage size in bytes
     */
    getSize() {
        let total = 0;
        const prefix = CONFIG.storage.prefix;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                const value = localStorage.getItem(key);
                total += key.length + (value ? value.length : 0);
            }
        }
        
        return total;
    },

    /**
     * Export all app data as JSON
     */
    exportData() {
        const data = {};
        const prefix = CONFIG.storage.prefix;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                const shortKey = key.replace(prefix, '');
                data[shortKey] = this.load(shortKey);
            }
        }
        
        return data;
    },

    /**
     * Import data from JSON
     */
    importData(data) {
        try {
            Object.keys(data).forEach(key => {
                this.save(key, data[key]);
            });
            return true;
        } catch (error) {
            console.error('Storage import error:', error);
            return false;
        }
    },

    // ============================================
    // SPECIFIC DATA GETTERS/SETTERS
    // ============================================

    /**
     * User Progress
     */
    getProgress() {
        return this.load('progress', {
            totalQuestions: 0,
            correctAnswers: 0,
            categoryProgress: {},
            studyStreak: 0,
            lastStudyDate: null,
            quizHistory: [],
            flashcardProgress: {}
        });
    },

    saveProgress(progress) {
        return this.save('progress', progress);
    },

    /**
     * Quiz Results
     */
    saveQuizResult(result) {
        const progress = this.getProgress();
        progress.quizHistory.push({
            ...result,
            timestamp: Date.now()
        });
        
        // Keep only last 50 quiz results
        if (progress.quizHistory.length > 50) {
            progress.quizHistory = progress.quizHistory.slice(-50);
        }
        
        return this.saveProgress(progress);
    },

    /**
     * Flashcard Progress
     */
    getFlashcardProgress(cardId) {
        const progress = this.getProgress();
        return progress.flashcardProgress[cardId] || {
            interval: 0,
            nextReview: Date.now(),
            reviews: 0,
            lastReview: null
        };
    },

    saveFlashcardProgress(cardId, cardProgress) {
        const progress = this.getProgress();
        progress.flashcardProgress[cardId] = cardProgress;
        return this.saveProgress(progress);
    },

    /**
     * User Settings
     */
    getSettings() {
        return this.load('settings', {
            theme: CONFIG.ui.theme,
            animationsEnabled: CONFIG.ui.animationsEnabled,
            soundEnabled: CONFIG.ui.soundEnabled,
            showJokes: CONFIG.ui.showJokes
        });
    },

    saveSettings(settings) {
        return this.save('settings', settings);
    },

    /**
     * Bookmarked Questions
     */
    getBookmarks() {
        return this.load('bookmarks', []);
    },

    saveBookmarks(bookmarks) {
        return this.save('bookmarks', bookmarks);
    },

    toggleBookmark(questionId) {
        const bookmarks = this.getBookmarks();
        const index = bookmarks.indexOf(questionId);
        
        if (index > -1) {
            bookmarks.splice(index, 1);
        } else {
            bookmarks.push(questionId);
        }
        
        return this.saveBookmarks(bookmarks);
    },

    isBookmarked(questionId) {
        const bookmarks = this.getBookmarks();
        return bookmarks.includes(questionId);
    }
};

// Make Storage available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Storage;
}
