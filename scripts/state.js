// scripts/state.js - Central State Management

// Global application state
let appState = {
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
const stateEvents = {
    transactionsUpdated: new Event('transactionsUpdated'),
    settingsUpdated: new Event('settingsUpdated'),
    viewChanged: new Event('viewChanged'),
    searchUpdated: new Event('searchUpdated'),
    sortUpdated: new Event('sortUpdated')
};

// Initialize state from storage
function initializeState() {
    console.log('🔄 Initializing application state...');
    
    // Load data from storage
    const data = window.storage.loadData();
    const settings = window.storage.loadSettings();
    
    // Update state with loaded data
    updateState({
        transactions: data.transactions || [],
        settings: settings
    });
    
    console.log('✅ State initialized with', appState.transactions.length, 'transactions');
}

// Update state and trigger events
function updateState(newState) {
    const oldState = { ...appState };
    appState = { ...appState, ...newState };
    
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
        console.log('🔄 State updated:', Object.keys(newState).join(', '));
    }
}

// Get current state (read-only)
function getState() {
    return { ...appState };
}

// Transaction management
function addTransaction(transactionData) {
    const newTransaction = window.storage.addTransaction(transactionData);
    if (newTransaction) {
        const currentTransactions = [...appState.transactions];
        currentTransactions.unshift(newTransaction); // Add to beginning
        updateState({ transactions: currentTransactions });
        return newTransaction;
    }
    return null;
}

function updateTransaction(transactionId, updates) {
    const success = window.storage.updateTransaction(transactionId, updates);
    if (success) {
        const updatedTransactions = appState.transactions.map(t => 
            t.id === transactionId ? { ...t, ...updates } : t
        );
        updateState({ transactions: updatedTransactions });
    }
    return success;
}

function deleteTransaction(transactionId) {
    const success = window.storage.deleteTransaction(transactionId);
    if (success) {
        const filteredTransactions = appState.transactions.filter(t => t.id !== transactionId);
        updateState({ transactions: filteredTransactions });
    }
    return success;
}

// Set transaction for editing
function setEditingTransaction(transaction) {
    updateState({ editingTransaction: transaction });
}

function clearEditingTransaction() {
    updateState({ editingTransaction: null });
}

// View management
function setCurrentView(view) {
    updateState({ currentView: view });
}

// Search and filter management
function setSearchQuery(query) {
    updateState({ searchQuery: query });
}

function setSortBy(sortType) {
    updateState({ sortBy: sortType });
}

function setCategoryFilter(category) {
    updateState({ 
        filters: { 
            ...appState.filters, 
            category: category 
        } 
    });
}

// Get filtered and sorted transactions
function getDisplayTransactions() {
    let transactions = [...appState.transactions];
    
    // Apply search filter
    if (appState.searchQuery) {
        const searchTerm = appState.searchQuery.toLowerCase();
        transactions = transactions.filter(t => 
            t.description.toLowerCase().includes(searchTerm) ||
            t.category.toLowerCase().includes(searchTerm) ||
            t.amount.toString().includes(searchTerm)
        );
    }
    
    // Apply category filter
    if (appState.filters.category) {
        transactions = transactions.filter(t => 
            t.category === appState.filters.category
        );
    }
    
    // Apply sorting
    transactions.sort((a, b) => {
        switch (appState.sortBy) {
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
function updateSettings(newSettings) {
    const success = window.storage.saveSettings(newSettings);
    if (success) {
        updateState({ settings: newSettings });
    }
    return success;
}

// Get current statistics
function getCurrentStats() {
    return window.storage.getStats();
}

// Export/Import
function exportAppData() {
    return window.storage.exportData();
}

function importAppData(jsonData) {
    const success = window.storage.importData(jsonData);
    if (success) {
        // Reload state from storage after import
        const data = window.storage.loadData();
        const settings = window.storage.loadSettings();
        updateState({
            transactions: data.transactions,
            settings: settings
        });
    }
    return success;
}

// Reset all data
function resetAppData() {
    const success = window.storage.resetData();
    if (success) {
        updateState({
            transactions: [],
            settings: window.storage.loadSettings()
        });
    }
    return success;
}

// Utility functions for deep comparison
function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;
    
    for (let i = 0; i < a.length; i++) {
        if (!objectsEqual(a[i], b[i])) return false;
    }
    return true;
}

function objectsEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    
    if (aKeys.length !== bKeys.length) return false;
    
    for (const key of aKeys) {
        if (!b.hasOwnProperty(key)) return false;
        if (Array.isArray(a[key]) && Array.isArray(b[key])) {
            if (!arraysEqual(a[key], b[key])) return false;
        } else if (a[key] !== b[key]) {
            return false;
        }
    }
    return true;
}

// Initialize when script loads
function initializeStateModule() {
    console.log('🧠 State module initialized');
    // State will be fully initialized when app starts
}

// Make state management available globally
window.state = {
    initializeState,
    getState,
    updateState,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    setEditingTransaction,
    clearEditingTransaction,
    setCurrentView,
    setSearchQuery,
    setSortBy,
    setCategoryFilter,
    getDisplayTransactions,
    updateSettings,
    getCurrentStats,
    exportAppData,
    importAppData,
    resetAppData,
    stateEvents,
    initializeStateModule
};