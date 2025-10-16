// scripts/search.js - Search and Filter System

var currentSearch = {
    query: '',
    pattern: null,
    caseSensitive: false,
    results: [],
    hasError: false
};

// Safe pattern compiler for search
function compileSearchPattern(input, flags) {
    if (typeof flags === 'undefined') flags = 'i';
    try {
        return input ? new RegExp(input, flags) : null;
    } catch (error) {
        console.log('Invalid search pattern:', input, error);
        return null;
    }
}

// Highlight matches in text
function highlightTextMatches(text, pattern) {
    if (!text || !pattern) return text;
    
    try {
        return text.toString().replace(pattern, function(match) {
            return '<mark class="search-highlight">' + match + '</mark>';
        });
    } catch (error) {
        console.log('Error highlighting text:', error);
        return text;
    }
}

// Perform search across transactions
function performSearch(searchQuery, caseSensitive) {
    if (typeof caseSensitive === 'undefined') caseSensitive = false;
    
    var transactions = window.state.getDisplayTransactions();
    var flags = caseSensitive ? 'g' : 'gi';
    
    currentSearch.query = searchQuery;
    currentSearch.caseSensitive = caseSensitive;
    currentSearch.hasError = false;
    
    if (!searchQuery.trim()) {
        currentSearch.pattern = null;
        currentSearch.results = transactions;
        return currentSearch.results;
    }
    
    var pattern = compileSearchPattern(searchQuery, flags);
    currentSearch.pattern = pattern;
    
    if (!pattern) {
        currentSearch.hasError = true;
        currentSearch.results = [];
        return [];
    }
    
    var foundItems = [];
    for (var i = 0; i < transactions.length; i++) {
        var item = transactions[i];
        var matchFound = false;
        
        if (pattern.test(item.description)) {
            pattern.lastIndex = 0;
            matchFound = true;
        }
        
        if (!matchFound && pattern.test(item.category)) {
            pattern.lastIndex = 0;
            matchFound = true;
        }
        
        if (!matchFound && pattern.test(item.amount.toString())) {
            pattern.lastIndex = 0;
            matchFound = true;
        }
        
        if (!matchFound && pattern.test(item.date)) {
            pattern.lastIndex = 0;
            matchFound = true;
        }
        
        if (matchFound) {
            foundItems.push(item);
        }
    }
    
    currentSearch.results = foundItems;
    return foundItems;
}

// Get highlighted transaction for display
function getHighlightedItem(item) {
    if (!currentSearch.pattern || !currentSearch.query) {
        return item;
    }
    
    var pattern = new RegExp(currentSearch.pattern.source, currentSearch.pattern.flags);
    var highlighted = {};
    
    for (var key in item) {
        if (item.hasOwnProperty(key)) {
            highlighted[key] = item[key];
        }
    }
    
    highlighted.description = highlightTextMatches(item.description, pattern);
    highlighted.category = highlightTextMatches(item.category, pattern);
    highlighted.amount = highlightTextMatches(item.amount.toString(), pattern);
    highlighted.date = highlightTextMatches(item.date, pattern);
    
    return highlighted;
}

// Predefined search patterns
var commonSearches = {
    findCents: /\d+\.\d{2}\b/g,
    findFood: /(lunch|dinner|breakfast|food|meal)/i,
    findBooks: /(book|textbook|novel|reading)/i,
    findTransport: /(bus|train|taxi|uber|transport)/i,
    findDuplicates: /\b(\w+)\s+\1\b/i,
    findLargeAmounts: /([5-9]\d+\.\d{2}|\d{3,}\.\d{2})/
};

// Apply predefined search
function usePredefinedSearch(patternName) {
    var pattern = commonSearches[patternName];
    if (pattern) {
        var searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = pattern.source;
            performSearch(pattern.source, false);
            updateSearchDisplay();
        }
    }
}

// Update search results display
function updateSearchDisplay() {
    var searchInput = document.getElementById('search-input');
    var searchStatus = document.getElementById('search-status');
    
    if (searchStatus) {
        if (currentSearch.hasError) {
            searchStatus.textContent = 'Invalid search pattern';
            searchStatus.className = 'search-status error';
        } else if (currentSearch.query) {
            var count = currentSearch.results.length;
            searchStatus.textContent = 'Found ' + count + ' result' + (count !== 1 ? 's' : '');
            searchStatus.className = 'search-status success';
        } else {
            searchStatus.textContent = '';
            searchStatus.className = 'search-status';
        }
    }
    
    if (searchInput) {
        if (currentSearch.hasError) {
            searchInput.className += ' search-error';
        } else {
            searchInput.className = searchInput.className.replace(' search-error', '');
        }
    }
    
    window.state.setSearchText(currentSearch.query);
}

// Clear search
function clearSearch() {
    currentSearch = {
        query: '',
        pattern: null,
        caseSensitive: false,
        results: [],
        hasError: false
    };
    
    var searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = '';
    }
    
    updateSearchDisplay();
    window.state.setSearchText('');
}

// Initialize search system
function initializeSearchSystem() {
    console.log('Search system initialized');
    
    var searchInput = document.getElementById('search-input');
    var clearButton = document.getElementById('clear-search');
    
    if (searchInput) {
        var searchDelay;
        searchInput.addEventListener('input', function(event) {
            clearTimeout(searchDelay);
            searchDelay = setTimeout(function() {
                performSearch(event.target.value, currentSearch.caseSensitive);
                updateSearchDisplay();
            }, 300);
        });
        
        searchInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                clearTimeout(searchDelay);
                performSearch(event.target.value, currentSearch.caseSensitive);
                updateSearchDisplay();
            }
        });
    }
    
    if (clearButton) {
        clearButton.addEventListener('click', clearSearch);
    }
}

// Make search functions available globally
window.search = {
    performSearch: performSearch,
    getHighlightedItem: getHighlightedItem,
    clearSearch: clearSearch,
    getSearchState: function() { 
        var state = {};
        for (var key in currentSearch) {
            if (currentSearch.hasOwnProperty(key)) {
                state[key] = currentSearch[key];
            }
        }
        return state;
    },
    compileSearchPattern: compileSearchPattern,
    highlightTextMatches: highlightTextMatches,
    usePredefinedSearch: usePredefinedSearch,
    initializeSearchSystem: initializeSearchSystem,
    commonSearches: commonSearches
};