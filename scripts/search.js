// scripts/search.js - PURE Vanilla JavaScript

var currentSearchState = {
    query: '',
    regex: null,
    isCaseSensitive: false,
    results: [],
    hasError: false
};

// Safe regex compiler for search
function compileSearchRegex(pattern, flags) {
    if (typeof flags === 'undefined') flags = 'i';
    try {
        return pattern ? new RegExp(pattern, flags) : null;
    } catch (error) {
        console.warn('Invalid search regex:', pattern, error);
        return null;
    }
}

// Highlight matches in text
function highlightMatches(text, regex) {
    if (!text || !regex) return text;
    
    try {
        return text.toString().replace(regex, function(match) {
            return '<mark class="search-highlight">' + match + '</mark>';
        });
    } catch (error) {
        console.warn('Error highlighting text:', error);
        return text;
    }
}

// Perform search across transactions
function performSearch(searchQuery, isCaseSensitive) {
    if (typeof isCaseSensitive === 'undefined') isCaseSensitive = false;
    
    var transactions = window.state.getDisplayTransactions();
    var flags = isCaseSensitive ? 'g' : 'gi';
    
    currentSearchState.query = searchQuery;
    currentSearchState.isCaseSensitive = isCaseSensitive;
    currentSearchState.hasError = false;
    
    if (!searchQuery.trim()) {
        currentSearchState.regex = null;
        currentSearchState.results = transactions;
        return currentSearchState.results;
    }
    
    // Compile search regex
    var regex = compileSearchRegex(searchQuery, flags);
    currentSearchState.regex = regex;
    
    if (!regex) {
        currentSearchState.hasError = true;
        currentSearchState.results = [];
        return [];
    }
    
    // Filter transactions that match the search
    var results = [];
    for (var i = 0; i < transactions.length; i++) {
        var transaction = transactions[i];
        var matchFound = false;
        
        // Search in description
        if (regex.test(transaction.description)) {
            regex.lastIndex = 0;
            matchFound = true;
        }
        
        // Search in category
        if (!matchFound && regex.test(transaction.category)) {
            regex.lastIndex = 0;
            matchFound = true;
        }
        
        // Search in amount
        if (!matchFound && regex.test(transaction.amount.toString())) {
            regex.lastIndex = 0;
            matchFound = true;
        }
        
        // Search in date
        if (!matchFound && regex.test(transaction.date)) {
            regex.lastIndex = 0;
            matchFound = true;
        }
        
        if (matchFound) {
            results.push(transaction);
        }
    }
    
    currentSearchState.results = results;
    return results;
}

// Get highlighted transaction for display
function getHighlightedTransaction(transaction) {
    if (!currentSearchState.regex || !currentSearchState.query) {
        return transaction;
    }
    
    var regex = new RegExp(currentSearchState.regex.source, currentSearchState.regex.flags);
    var highlighted = {};
    
    // Copy all properties
    for (var key in transaction) {
        if (transaction.hasOwnProperty(key)) {
            highlighted[key] = transaction[key];
        }
    }
    
    // Apply highlighting to display fields
    highlighted.description = highlightMatches(transaction.description, regex);
    highlighted.category = highlightMatches(transaction.category, regex);
    highlighted.amount = highlightMatches(transaction.amount.toString(), regex);
    highlighted.date = highlightMatches(transaction.date, regex);
    
    return highlighted;
}

// Clear search
function clearSearch() {
    currentSearchState = {
        query: '',
        regex: null,
        isCaseSensitive: false,
        results: [],
        hasError: false
    };
    
    var searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = '';
    }
    
    updateSearchUI();
    window.state.setSearchQuery('');
}

// Update search results in UI
function updateSearchUI() {
    var searchInput = document.getElementById('search-input');
    var searchStatus = document.getElementById('search-status');
    
    if (searchStatus) {
        if (currentSearchState.hasError) {
            searchStatus.textContent = 'Invalid search pattern';
            searchStatus.className = 'search-status error';
        } else if (currentSearchState.query) {
            var count = currentSearchState.results.length;
            searchStatus.textContent = 'Found ' + count + ' result' + (count !== 1 ? 's' : '');
            searchStatus.className = 'search-status success';
        } else {
            searchStatus.textContent = '';
            searchStatus.className = 'search-status';
        }
    }
    
    if (searchInput) {
        if (currentSearchState.hasError) {
            searchInput.className += ' search-error';
        } else {
            searchInput.className = searchInput.className.replace(' search-error', '');
        }
    }
    
    window.state.setSearchQuery(currentSearchState.query);
}

// Initialize search functionality
function initializeSearch() {
    console.log('Search module initialized');
    
    var searchInput = document.getElementById('search-input');
    var clearSearchBtn = document.getElementById('clear-search');
    
    if (searchInput) {
        var searchTimeout;
        searchInput.oninput = function(e) {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(function() {
                performSearch(e.target.value, currentSearchState.isCaseSensitive);
                updateSearchUI();
            }, 300);
        };
        
        searchInput.onkeypress = function(e) {
            if (e.key === 'Enter') {
                clearTimeout(searchTimeout);
                performSearch(e.target.value, currentSearchState.isCaseSensitive);
                updateSearchUI();
            }
        };
    }
    
    if (clearSearchBtn) {
        clearSearchBtn.onclick = clearSearch;
    }
}

// Make available globally
window.search = {
    performSearch: performSearch,
    getHighlightedTransaction: getHighlightedTransaction,
    clearSearch: clearSearch,
    getSearchState: function() { 
        var state = {};
        for (var key in currentSearchState) {
            if (currentSearchState.hasOwnProperty(key)) {
                state[key] = currentSearchState[key];
            }
        }
        return state;
    },
    compileSearchRegex: compileSearchRegex,
    highlightMatches: highlightMatches,
    initializeSearch: initializeSearch
};