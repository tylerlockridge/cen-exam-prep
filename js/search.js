/**
 * CEN Exam Prep - Search Module
 * 
 * Handles search functionality across questions, study guides, and flashcards.
 */

const Search = {
    // Search state
    searchIndex: null,
    searchResults: [],
    currentQuery: '',
    
    /**
     * Initialize search
     */
    async init() {
        console.log('🔍 Initializing search...');
        
        // Build search index
        await this.buildSearchIndex();
        
        // Setup search UI
        this.setupSearchUI();
    },
    
    /**
     * Build search index from all content
     */
    async buildSearchIndex() {
        this.searchIndex = {
            questions: [],
            flashcards: [],
            studyGuides: [],
            categories: []
        };
        
        // Index categories
        if (App.categories && App.categories.length > 0) {
            this.searchIndex.categories = App.categories.map(cat => ({
                type: 'category',
                id: cat.id,
                title: cat.name,
                content: cat.subcategories.join(' '),
                url: `study.html?category=${cat.id}`,
                category: cat.name
            }));
        }
        
        // For now, we'll use sample data
        // Later you can load actual questions and flashcards
        this.indexSampleContent();
        
        console.log(`📚 Search index built: ${this.getTotalIndexedItems()} items`);
    },
    
    /**
     * Index sample content (temporary)
     */
    indexSampleContent() {
        // Sample questions
        const sampleQuestions = [
            {
                id: 'q1',
                question: 'What is the normal heart rate range for adults?',
                answer: '60-100 beats per minute',
                category: 'Cardiovascular'
            },
            {
                id: 'q2',
                question: 'What does STEMI stand for?',
                answer: 'ST-Elevation Myocardial Infarction',
                category: 'Cardiovascular'
            },
            {
                id: 'q3',
                question: 'What is the Glasgow Coma Scale range?',
                answer: '3-15, with 3 being the lowest and 15 being fully alert',
                category: 'Neurological'
            }
        ];
        
        this.searchIndex.questions = sampleQuestions.map(q => ({
            type: 'question',
            id: q.id,
            title: q.question,
            content: q.answer,
            url: `quiz.html?question=${q.id}`,
            category: q.category
        }));
        
        // Sample flashcards
        const sampleFlashcards = [
            {
                id: 'fc1',
                front: 'What is normal blood pressure?',
                back: 'Systolic < 120 mmHg and Diastolic < 80 mmHg',
                category: 'Cardiovascular'
            },
            {
                id: 'fc2',
                front: 'What does SAMPLE stand for?',
                back: 'Signs/Symptoms, Allergies, Medications, Past medical history, Last oral intake, Events',
                category: 'Assessment'
            }
        ];
        
        this.searchIndex.flashcards = sampleFlashcards.map(fc => ({
            type: 'flashcard',
            id: fc.id,
            title: fc.front,
            content: fc.back,
            url: `flashcards.html?card=${fc.id}`,
            category: fc.category
        }));
    },
    
    /**
     * Get total indexed items
     */
    getTotalIndexedItems() {
        return this.searchIndex.questions.length +
               this.searchIndex.flashcards.length +
               this.searchIndex.studyGuides.length +
               this.searchIndex.categories.length;
    },
    
    /**
     * Setup search UI
     */
    setupSearchUI() {
        // Search input
        const searchInput = document.querySelector('#searchInput, .search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
            
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.clearSearch();
                }
            });
        }
        
        // Search button
        const searchBtn = document.querySelector('.search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                const input = document.querySelector('#searchInput, .search-input');
                if (input) {
                    this.handleSearch(input.value);
                }
            });
        }
        
        // Global keyboard shortcut (Ctrl/Cmd + K)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.focusSearch();
            }
        });
        
        // Click outside to close results
        document.addEventListener('click', (e) => {
            const searchContainer = document.querySelector('.search-container');
            if (searchContainer && !searchContainer.contains(e.target)) {
                this.hideResults();
            }
        });
    },
    
    /**
     * Handle search input
     */
    handleSearch(query) {
        this.currentQuery = query.trim().toLowerCase();
        
        if (this.currentQuery.length < 2) {
            this.hideResults();
            return;
        }
        
        // Perform search
        this.searchResults = this.performSearch(this.currentQuery);
        
        // Display results
        this.displayResults();
    },
    
    /**
     * Perform search across all indexed content
     */
    performSearch(query) {
        const results = [];
        const queryWords = query.split(' ').filter(w => w.length > 0);
        
        // Search all content types
        const allItems = [
            ...this.searchIndex.categories,
            ...this.searchIndex.questions,
            ...this.searchIndex.flashcards,
            ...this.searchIndex.studyGuides
        ];
        
        allItems.forEach(item => {
            const score = this.calculateRelevanceScore(item, queryWords);
            if (score > 0) {
                results.push({ ...item, score });
            }
        });
        
        // Sort by relevance score
        results.sort((a, b) => b.score - a.score);
        
        // Limit to top 10 results
        return results.slice(0, 10);
    },
    
    /**
     * Calculate relevance score for search item
     */
    calculateRelevanceScore(item, queryWords) {
        let score = 0;
        const title = item.title.toLowerCase();
        const content = item.content.toLowerCase();
        
        queryWords.forEach(word => {
            // Exact match in title (highest score)
            if (title === word) {
                score += 100;
            }
            // Title contains word
            else if (title.includes(word)) {
                score += 50;
            }
            // Content contains word
            else if (content.includes(word)) {
                score += 10;
            }
            
            // Bonus for word at start of title
            if (title.startsWith(word)) {
                score += 25;
            }
        });
        
        return score;
    },
    
    /**
     * Display search results
     */
    displayResults() {
        const resultsContainer = document.querySelector('.search-results');
        if (!resultsContainer) {
            this.createResultsContainer();
            return this.displayResults();
        }
        
        if (this.searchResults.length === 0) {
            resultsContainer.innerHTML = `
                <div class="search-no-results">
                    <div class="no-results-icon">🔍</div>
                    <p>No results found for "${this.currentQuery}"</p>
                    <small>Try different keywords or check your spelling</small>
                </div>
            `;
            resultsContainer.style.display = 'block';
            return;
        }
        
        let html = '<div class="search-results-list">';
        
        this.searchResults.forEach(result => {
            const icon = this.getResultIcon(result.type);
            const highlightedTitle = this.highlightQuery(result.title, this.currentQuery);
            const highlightedContent = this.highlightQuery(
                this.truncateText(result.content, 100),
                this.currentQuery
            );
            
            html += `
                <a href="${result.url}" class="search-result-item" data-type="${result.type}">
                    <div class="result-icon">${icon}</div>
                    <div class="result-content">
                        <div class="result-title">${highlightedTitle}</div>
                        <div class="result-description">${highlightedContent}</div>
                        <div class="result-meta">
                            <span class="result-type">${this.getTypeLabel(result.type)}</span>
                            ${result.category ? `<span class="result-category">${result.category}</span>` : ''}
                        </div>
                    </div>
                </a>
            `;
        });
        
        html += '</div>';
        
        // Add result count
        html = `
            <div class="search-results-header">
                <span class="results-count">${this.searchResults.length} result${this.searchResults.length !== 1 ? 's' : ''}</span>
                <button class="close-search" onclick="Search.clearSearch()">✕</button>
            </div>
            ${html}
        `;
        
        resultsContainer.innerHTML = html;
        resultsContainer.style.display = 'block';
    },
    
    /**
     * Create results container if it doesn't exist
     */
    createResultsContainer() {
        const searchContainer = document.querySelector('.search-container');
        if (!searchContainer) return;
        
        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'search-results';
        searchContainer.appendChild(resultsContainer);
    },
    
    /**
     * Get icon for result type
     */
    getResultIcon(type) {
        const icons = {
            category: '📚',
            question: '❓',
            flashcard: '🎴',
            studyGuide: '📖'
        };
        return icons[type] || '📄';
    },
    
    /**
     * Get label for result type
     */
    getTypeLabel(type) {
        const labels = {
            category: 'Category',
            question: 'Question',
            flashcard: 'Flashcard',
            studyGuide: 'Study Guide'
        };
        return labels[type] || type;
    },
    
    /**
     * Highlight query terms in text
     */
    highlightQuery(text, query) {
        if (!query) return text;
        
        const queryWords = query.split(' ').filter(w => w.length > 0);
        let highlighted = text;
        
        queryWords.forEach(word => {
            const regex = new RegExp(`(${this.escapeRegex(word)})`, 'gi');
            highlighted = highlighted.replace(regex, '<mark>$1</mark>');
        });
        
        return highlighted;
    },
    
    /**
     * Escape special regex characters
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },
    
    /**
     * Truncate text to specified length
     */
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    },
    
    /**
     * Hide search results
     */
    hideResults() {
        const resultsContainer = document.querySelector('.search-results');
        if (resultsContainer) {
            resultsContainer.style.display = 'none';
        }
    },
    
    /**
     * Clear search
     */
    clearSearch() {
        const searchInput = document.querySelector('#searchInput, .search-input');
        if (searchInput) {
            searchInput.value = '';
        }
        
        this.currentQuery = '';
        this.searchResults = [];
        this.hideResults();
    },
    
    /**
     * Focus search input
     */
    focusSearch() {
        const searchInput = document.querySelector('#searchInput, .search-input');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    },
    
    /**
     * Filter results by type
     */
    filterByType(type) {
        if (type === 'all') {
            this.displayResults();
            return;
        }
        
        const filtered = this.searchResults.filter(r => r.type === type);
        const temp = this.searchResults;
        this.searchResults = filtered;
        this.displayResults();
        this.searchResults = temp;
    },
    
    /**
     * Get search suggestions
     */
    getSuggestions(query) {
        const suggestions = [];
        const queryLower = query.toLowerCase();
        
        // Get category suggestions
        this.searchIndex.categories.forEach(cat => {
            if (cat.title.toLowerCase().includes(queryLower)) {
                suggestions.push({
                    text: cat.title,
                    type: 'category'
                });
            }
        });
        
        // Common search terms
        const commonTerms = [
            'cardiovascular',
            'respiratory',
            'neurological',
            'trauma',
            'pediatric',
            'pharmacology',
            'assessment',
            'procedures'
        ];
        
        commonTerms.forEach(term => {
            if (term.includes(queryLower)) {
                suggestions.push({
                    text: term,
                    type: 'suggestion'
                });
            }
        });
        
        return suggestions.slice(0, 5);
    }
};

// Initialize search when app is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Wait for App to initialize first
        setTimeout(() => Search.init(), 100);
    });
} else {
    setTimeout(() => Search.init(), 100);
}

// Make Search available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Search;
}
