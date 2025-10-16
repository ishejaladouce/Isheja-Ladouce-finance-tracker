// scripts/storage.js - Data Persistence & Management

// Storage keys
const STORAGE_KEY = 'studentFinanceData';
const SETTINGS_KEY = 'financeSettings';

// Default data structure
const defaultData = {
    transactions: [],
    settings: {
        budgetCap: 0,
        baseCurrency: 'USD',
        categories: ['Food', 'Books', 'Transport', 'Entertainment', 'Fees', 'Other']
    }
};

// Load all data from localStorage
function loadData() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const data = JSON.parse(stored);
            // Validate and merge with defaults
            return {
                transactions: data.transactions || [],
                settings: { ...defaultData.settings, ...data.settings }
            };
        }
    } catch (error) {
        console.error('❌ Error loading data:', error);
    }
    
    // Return default data if nothing stored or error
    return { ...defaultData };
}

// Save all data to localStorage
function saveData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        console.log('💾 Data saved successfully');
        return true;
    } catch (error) {
        console.error('❌ Error saving data:', error);
        showStatus('Error saving data', 'error');
        return false;
    }
}

// Load settings specifically
function loadSettings() {
    try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (stored) {
            return { ...defaultData.settings, ...JSON.parse(stored) };
        }
    } catch (error) {
        console.error('❌ Error loading settings:', error);
    }
    
    return { ...defaultData.settings };
}

// Save settings specifically
function saveSettings(settings) {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        console.log('⚙️ Settings saved successfully');
        return true;
    } catch (error) {
        console.error('❌ Error saving settings:', error);
        showStatus('Error saving settings', 'error');
        return false;
    }
}

// Add a new transaction
function addTransaction(transaction) {
    const data = loadData();
    
    // Generate unique ID with timestamp
    const newTransaction = {
        ...transaction,
        id: 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    data.transactions.unshift(newTransaction); // Add to beginning
    const success = saveData(data);
    
    if (success) {
        showStatus('Transaction added successfully!', 'success');
    }
    
    return success ? newTransaction : null;
}

// Update an existing transaction
function updateTransaction(transactionId, updates) {
    const data = loadData();
    const transactionIndex = data.transactions.findIndex(t => t.id === transactionId);
    
    if (transactionIndex !== -1) {
        data.transactions[transactionIndex] = {
            ...data.transactions[transactionIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        const success = saveData(data);
        if (success) {
            showStatus('Transaction updated successfully!', 'success');
        }
        return success;
    }
    
    showStatus('Transaction not found', 'error');
    return false;
}

// Delete a transaction
function deleteTransaction(transactionId) {
    const data = loadData();
    const initialLength = data.transactions.length;
    
    data.transactions = data.transactions.filter(t => t.id !== transactionId);
    
    if (data.transactions.length < initialLength) {
        const success = saveData(data);
        if (success) {
            showStatus('Transaction deleted successfully!', 'success');
        }
        return success;
    }
    
    showStatus('Transaction not found', 'error');
    return false;
}

// Get all transactions (with optional filtering)
function getTransactions(filters = {}) {
    const data = loadData();
    let transactions = [...data.transactions];
    
    // Apply filters
    if (filters.category) {
        transactions = transactions.filter(t => t.category === filters.category);
    }
    
    if (filters.startDate) {
        transactions = transactions.filter(t => t.date >= filters.startDate);
    }
    
    if (filters.endDate) {
        transactions = transactions.filter(t => t.date <= filters.endDate);
    }
    
    return transactions;
}

// Export data as JSON string
function exportData() {
    const data = loadData();
    return JSON.stringify(data, null, 2);
}

// Import data from JSON string with validation
function importData(jsonString) {
    try {
        const importedData = JSON.parse(jsonString);
        
        // Basic validation
        if (!importedData || typeof importedData !== 'object') {
            throw new Error('Invalid data format');
        }
        
        // Ensure we have at least an empty transactions array
        const validatedData = {
            transactions: Array.isArray(importedData.transactions) ? importedData.transactions : [],
            settings: { ...defaultData.settings, ...importedData.settings }
        };
        
        // Validate each transaction
        validatedData.transactions = validatedData.transactions.filter(transaction => 
            transaction && 
            transaction.id && 
            transaction.description && 
            transaction.amount != null
        );
        
        const success = saveData(validatedData);
        if (success) {
            showStatus('Data imported successfully!', 'success');
            return true;
        }
        
    } catch (error) {
        console.error('❌ Error importing data:', error);
        showStatus('Invalid JSON data format', 'error');
    }
    
    return false;
}

// Reset all data to defaults
function resetData() {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(SETTINGS_KEY);
        showStatus('All data has been reset', 'success');
        return true;
    }
    return false;
}

// Get statistics
function getStats() {
    const transactions = getTransactions();
    const settings = loadSettings();
    
    const totalAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    
    // Get category totals
    const categoryTotals = {};
    transactions.forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + parseFloat(t.amount || 0);
    });
    
    // Find top category
    let topCategory = 'None';
    let maxAmount = 0;
    Object.entries(categoryTotals).forEach(([category, amount]) => {
        if (amount > maxAmount) {
            maxAmount = amount;
            topCategory = category;
        }
    });
    
    // Check budget cap
    const budgetStatus = settings.budgetCap > 0 ? {
        remaining: settings.budgetCap - totalAmount,
        isOver: totalAmount > settings.budgetCap
    } : null;
    
    return {
        totalTransactions: transactions.length,
        totalAmount: totalAmount,
        topCategory: topCategory,
        budgetStatus: budgetStatus,
        categoryTotals: categoryTotals
    };
}

// Show status message
function showStatus(message, type = 'info') {
    const statusElement = document.getElementById('status-message');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = `status-message ${type}`;
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            statusElement.textContent = '';
            statusElement.className = 'status-message';
        }, 3000);
    }
    
    // Also log to console
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
}

// Initialize storage module
function initializeStorage() {
    console.log('💾 Storage module initialized');
    
    // Load initial data to ensure structure exists
    loadData();
}

// Make functions available globally
window.storage = {
    loadData,
    saveData,
    loadSettings,
    saveSettings,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactions,
    exportData,
    importData,
    resetData,
    getStats,
    initializeStorage
};