/**
 * CEN Exam Prep - Configuration File
 * 
 * Change these values to customize the application behavior.
 * No need to modify other files for basic settings.
 */

const CONFIG = {
    // ============================================
    // EXAM SETTINGS
    // ============================================
    exam: {
        name: "CEN (Certified Emergency Nurse)",
        totalQuestions: 150,          // Scored questions on real exam
        totalWithPilot: 175,          // Including unscored pilot questions
        timeMinutes: 180,             // 3 hours
        passingScorePercent: 70,      // Approximate passing threshold
        categories: 13                 // Number of content categories
    },

    // ============================================
    // PRACTICE QUIZ SETTINGS
    // ============================================
    quiz: {
        quickQuizQuestions: 10,       // Questions in a quick quiz
        focusedQuizQuestions: 25,     // Questions in category-focused quiz
        fullExamQuestions: 150,       // Questions in full practice exam
        fullExamTimeMinutes: 180,     // Time limit for full exam
        showRationaleImmediately: true, // Show answer explanation right away
        shuffleQuestions: true,       // Randomize question order
        shuffleAnswers: true          // Randomize answer option order
    },

    // ============================================
    // FLASHCARD SETTINGS (Spaced Repetition)
    // ============================================
    flashcards: {
        newCardsPerDay: 20,           // How many new cards to introduce daily
        reviewsPerDay: 100,           // Maximum reviews per day
        // Intervals in days for spaced repetition
        intervals: {
            again: 0.0007,            // ~1 minute (for "didn't know it")
            hard: 0.0104,             // ~15 minutes
            good: 1,                  // 1 day
            easy: 4                   // 4 days
        },
        // Multipliers for interval growth
        multipliers: {
            hard: 1.2,
            good: 2.5,
            easy: 3.5
        }
    },

    // ============================================
    // PASS PREDICTION ALGORITHM WEIGHTS
    // ============================================
    prediction: {
        weights: {
            overallAccuracy: 0.30,     // 30% weight on total correct %
            recentAccuracy: 0.25,      // 25% weight on last 7 days
            categoryBalance: 0.15,     // 15% weight on covering all categories
            hardQuestionAccuracy: 0.20, // 20% weight on difficult questions
            consistencyBonus: 0.10     // 10% weight on study streak
        },
        // Thresholds for prediction messages
        thresholds: {
            veryLikely: 85,           // "Very likely to pass"
            likely: 70,               // "Likely to pass"
            possible: 55,             // "Possible, keep studying"
            needsWork: 0              // "Needs more preparation"
        }
    },

    // ============================================
    // UI SETTINGS
    // ============================================
    ui: {
        theme: "emergency",           // Color theme name
        animationsEnabled: true,      // Enable/disable animations
        soundEnabled: false,          // Sound effects (future feature)
        showJokes: true,              // Display nursing humor
        encouragementFrequency: 5     // Show encouragement every N questions
    },

    // ============================================
    // STORAGE SETTINGS
    // ============================================
    storage: {
        prefix: "cen_prep_",          // Prefix for all localStorage keys
        version: "1.0",               // Data schema version
        autoSaveInterval: 30000       // Auto-save every 30 seconds (ms)
    },

    // ============================================
    // STUDY SCHEDULE (5-week plan)
    // ============================================
    schedule: {
        totalWeeks: 5,
        weeklyGoals: {
            questionsPerWeek: 200,     // Practice questions target
            studyHoursPerWeek: 10,     // Recommended study hours
            flashcardsPerDay: 50       // Flashcard reviews target
        }
    }
};

// Make CONFIG available globally
// (Don't modify below this line)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
