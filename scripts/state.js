// Global application state
var appState = {
    transactions: [],
    settings: {},
    currentView: 'dashboard',
    editingTransaction: null,
    searchQuery: '',
    sortBy: 'date-desc',
    filters: {
        category: '',
        dateRange: {}
    },
    isLoading: false
};

// Event system for state changes
var stateEvents = {
    transactionsUpdated: new Event('transactionsUpdated'),
    settingsUpdated: new Event('settingsUpdated'),
    viewChanged: new Event('viewChanged'),
    searchUpdated: new Event('searchUpdated'),
    sortUpdated: new Event('sortUpdated')
};

// Initialize state from storage
function initializeState() {
    console.log('Initializing application state...');
    
    // Load data from storage
    var data = window.storage.loadData();
    var settings = window.storage.loadSettings();
    
    // Update state with loaded data
    updateState({
        transactions: data.transactions || [],
        settings: settings
    });
    
    console.log('State initialized with', appState.transactions.length, 'transactions');
}

// Update state and trigger events
function updateState(newState) {
    var oldState = {};
    for (var key in appState) {
        if (appState.hasOwnProperty(key)) {
            oldState[key] = appState[key];
        }
    }
    
    for (var key in newState) {
        if (newState.hasOwnProperty(key)) {
            appState[key] = newState[key];
        }
    }
    
    // Trigger appropriate events based on what changed
    if (newState.transactions !== undefined && !arraysEqual(oldState.transactions, newState.transactions)) {
        document.dispatchEvent(stateEvents.transactionsUpdated);
    }
    
    if (newState.settings !== undefined && !objectsEqual(oldState.settings, newState.settings)) {
        document.dispatchEvent(stateEvents.settingsUpdated);
    }
    
    if (newState.currentView !== undefined && oldState.currentView !== newState.currentView) {
        document.dispatchEvent(stateEvents.viewChanged);
    }
    
    if (newState.searchQuery !== undefined && oldState.searchQuery !== newState.searchQuery) {
        document.dispatchEvent(stateEvents.searchUpdated);
    }
    
    if (newState.sortBy !== undefined && oldState.sortBy !== newState.sortBy) {
        document.dispatchEvent(stateEvents.sortUpdated);
    }
    
    // Log state changes in development
    if (console && console.log) {
        console.log('State updated:', Object.keys(newState).join(', '));
    }
}

// Get current state 
function getState() {
    var stateCopy = {};
    for (var key in appState) {
        if (appState.hasOwnProperty(key)) {
            stateCopy[key] = appState[key];
        }
    }
    return stateCopy;
}

// Transaction management
function addTransaction(transactionData) {
    var newTransaction = window.storage.addTransaction(transactionData);
    if (newTransaction) {
        var currentTransactions = appState.transactions.slice();
        currentTransactions.unshift(newTransaction);
        updateState({ transactions: currentTransactions });
        return newTransaction;
    }
    return null;
}

function updateTransaction(transactionId, updates) {
    var success = window.storage.updateTransaction(transactionId, updates);
    if (success) {
        var updatedTransactions = [];
        for (var i = 0; i < appState.transactions.length; i++) {
            var transaction = appState.transactions[i];
            if (transaction.id === transactionId) {
                var updated = {};
                for (var key in transaction) {
                    if (transaction.hasOwnProperty(key)) {
                        updated[key] = transaction[key];
                    }
                }
                for (var key in updates) {
                    if (updates.hasOwnProperty(key)) {
                        updated[key] = updates[key];
                    }
                }
                updated.updatedAt = new Date().toISOString();
                updatedTransactions.push(updated);
            } else {
                updatedTransactions.push(transaction);
            }
        }
        updateState({ transactions: updatedTransactions });
    }
    return success;
}

// Make state management available globally
window.state = {
    initializeState: initializeState,
    getState: getState,
    updateState: updateState,
    addTransaction: addTransaction,
    updateTransaction: updateTransaction,
};