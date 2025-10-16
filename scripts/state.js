// Current application state
var currentAppState = {
    transactions: [],
    settings: {},
    currentPage: 'dashboard',
    editingItem: null,
    searchText: '',
    sortMethod: 'date-desc',
    activeFilters: {
        category: '',
        dateRange: {}
    }
};

// Events for state changes
var appEvents = {
    transactionsChanged: new Event('transactionsChanged'),
    settingsChanged: new Event('settingsChanged'),
    pageChanged: new Event('pageChanged'),
    searchChanged: new Event('searchChanged'),
    sortChanged: new Event('sortChanged')
};

// Initialize state from storage
function initializeAppState() {
    console.log('Initializing application state...');
    
    // Load data from storage
    var data = window.storage.loadAllData();
    var settings = window.storage.loadUserPreferences();
    
    // Update state with loaded data
    updateAppState({
        transactions: data.transactions || [],
        settings: settings
    });
    
    console.log('State initialized with ' + currentAppState.transactions.length + ' transactions');
}

// Update state and trigger events
function updateAppState(newState) {
    var previousState = {};
    for (var key in currentAppState) {
        if (currentAppState.hasOwnProperty(key)) {
            previousState[key] = currentAppState[key];
        }
    }
    
    for (var key in newState) {
        if (newState.hasOwnProperty(key)) {
            currentAppState[key] = newState[key];
        }
    }
    
    // Trigger events based on what changed
    if (newState.transactions !== undefined && !compareArrays(previousState.transactions, newState.transactions)) {
        document.dispatchEvent(appEvents.transactionsChanged);
    }
    
    if (newState.settings !== undefined && !compareObjects(previousState.settings, newState.settings)) {
        document.dispatchEvent(appEvents.settingsChanged);
    }
    
    if (newState.currentPage !== undefined && previousState.currentPage !== newState.currentPage) {
        document.dispatchEvent(appEvents.pageChanged);
    }
    
    if (newState.searchText !== undefined && previousState.searchText !== newState.searchText) {
        document.dispatchEvent(appEvents.searchChanged);
    }
    
    if (newState.sortMethod !== undefined && previousState.sortMethod !== newState.sortMethod) {
        document.dispatchEvent(appEvents.sortChanged);
    }
    
    console.log('State updated: ' + Object.keys(newState).join(', '));
}

// Get current state (read-only)
function getCurrentState() {
    var stateCopy = {};
    for (var key in currentAppState) {
        if (currentAppState.hasOwnProperty(key)) {
            stateCopy[key] = currentAppState[key];
        }
    }
    return stateCopy;
}

// Transaction management
function addTransaction(transactionData) {
    var newItem = window.storage.addNewTransaction(transactionData);
    if (newItem) {
        var currentItems = currentAppState.transactions.slice();
        currentItems.unshift(newItem);
        updateAppState({ transactions: currentItems });
        return newItem;
    }
    return null;
}

function updateTransaction(transactionId, changes) {
    var success = window.storage.updateExistingTransaction(transactionId, changes);
    if (success) {
        var updatedItems = currentAppState.transactions.map(function(item) {
            if (item.id === transactionId) {
                var updated = {};
                for (var key in item) {
                    if (item.hasOwnProperty(key)) {
                        updated[key] = item[key];
                    }
                }
                for (var key in changes) {
                    if (changes.hasOwnProperty(key)) {
                        updated[key] = changes[key];
                    }
                }
                updated.updatedAt = new Date().toISOString();
                return updated;
            }
            return item;
        });
        updateAppState({ transactions: updatedItems });
    }
    return success;
}

function removeTransaction(transactionId) {
    var success = window.storage.deleteTransaction(transactionId);
    if (success) {
        var filteredItems = currentAppState.transactions.filter(function(item) {
            return item.id !== transactionId;
        });
        updateAppState({ transactions: filteredItems });
    }
    return success;
}

// Set item for editing
function setEditingItem(item) {
    updateAppState({ editingItem: item });
}

function clearEditingItem() {
    updateAppState({ editingItem: null });
}

// Page management
function setCurrentPage(page) {
    updateAppState({ currentPage: page });
}

// Search and filter management
function setSearchText(text) {
    updateAppState({ searchText: text });
}

function setSortMethod(sortType) {
    updateAppState({ sortMethod: sortType });
}

function setCategoryFilter(category) {
    updateAppState({ 
        activeFilters: Object.assign({}, currentAppState.activeFilters, { category: category })
    });
}

// Get filtered and sorted transactions for display
function getDisplayTransactions() {
    var transactions = currentAppState.transactions.slice();
    
    // Apply search filter
    if (currentAppState.searchText) {
        var searchTerm = currentAppState.searchText.toLowerCase();
        transactions = transactions.filter(function(item) {
            return item.description.toLowerCase().includes(searchTerm) ||
                   item.category.toLowerCase().includes(searchTerm) ||
                   item.amount.toString().includes(searchTerm);
        });
    }
    
    // Apply category filter
    if (currentAppState.activeFilters.category) {
        transactions = transactions.filter(function(item) {
            return item.category === currentAppState.activeFilters.category;
        });
    }
    
    // Apply sorting
    transactions.sort(function(a, b) {
        switch (currentAppState.sortMethod) {
            case 'date-desc':
                return new Date(b.date) - new Date(a.date);
            case 'date-asc':
                return new Date(a.date) - new Date(b.date);
            case 'amount-desc':
                return parseFloat(b.amount) - parseFloat(a.amount);
            case 'amount-asc':
                return parseFloat(a.amount) - parseFloat(b.amount);
            case 'description-asc':
                return a.description.localeCompare(b.description);
            case 'description-desc':
                return b.description.localeCompare(a.description);
            default:
                return new Date(b.date) - new Date(a.date);
        }
    });
    
    return transactions;
}

// Settings management
function updateUserSettings(newSettings) {
    var success = window.storage.saveUserPreferences(newSettings);
    if (success) {
        updateAppState({ settings: newSettings });
    }
    return success;
}

// Get current statistics
function getCurrentStatistics() {
    return window.storage.calculateStatistics();
}

// Export/Import
function exportApplicationData() {
    return window.storage.exportDataAsJSON();
}

function importApplicationData(jsonData) {
    var success = window.storage.importDataFromJSON(jsonData);
    if (success) {
        // Reload state from storage after import
        var data = window.storage.loadAllData();
        var settings = window.storage.loadUserPreferences();
        updateAppState({
            transactions: data.transactions,
            settings: settings
        });
    }
    return success;
}

// Reset all data
function resetApplicationData() {
    var success = window.storage.resetAllData();
    if (success) {
        updateAppState({
            transactions: [],
            settings: window.storage.loadUserPreferences()
        });
    }
    return success;
}

// Utility functions for comparison
function compareArrays(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;
    
    for (var i = 0; i < a.length; i++) {
        if (!compareObjects(a[i], b[i])) return false;
    }
    return true;
}

function compareObjects(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    
    var aKeys = Object.keys(a);
    var bKeys = Object.keys(b);
    
    if (aKeys.length !== bKeys.length) return false;
    
    for (var i = 0; i < aKeys.length; i++) {
        var key = aKeys[i];
        if (!b.hasOwnProperty(key)) return false;
        if (Array.isArray(a[key]) && Array.isArray(b[key])) {
            if (!compareArrays(a[key], b[key])) return false;
        } else if (a[key] !== b[key]) {
            return false;
        }
    }
    return true;
}

// Make state management available globally
window.state = {
    initializeAppState: initializeAppState,
    getCurrentState: getCurrentState,
    updateAppState: updateAppState,
    addTransaction: addTransaction,
    updateTransaction: updateTransaction,
    removeTransaction: removeTransaction,
    setEditingItem: setEditingItem,
    clearEditingItem: clearEditingItem,
    setCurrentPage: setCurrentPage,
    setSearchText: setSearchText,
    setSortMethod: setSortMethod,
    setCategoryFilter: setCategoryFilter,
    getDisplayTransactions: getDisplayTransactions,
    updateUserSettings: updateUserSettings,
    getCurrentStatistics: getCurrentStatistics,
    exportApplicationData: exportApplicationData,
    importApplicationData: importApplicationData,
    resetApplicationData: resetApplicationData,
    appEvents: appEvents
};