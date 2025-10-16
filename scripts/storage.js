// Storage keys
var DATA_STORAGE_KEY = 'moneyTrackerData';
var USER_SETTINGS_KEY = 'userPreferences';

// Default data structure
var defaultData = {
    transactions: [],
    settings: {
        spendingLimit: 0,
        mainCurrency: 'USD',
        categories: ['Food', 'Books', 'Transport', 'Entertainment', 'Fees', 'Other']
    }
};

// Default user preferences
var defaultPreferences = {
    colorTheme: 'default',
    textSize: 'medium',
    dateStyle: 'yyyy-mm-dd',
    moneyStyle: 'symbol',
    autoSave: true,
    showGraphs: true,
    askBeforeDelete: true
};

// Load all data from storage
function loadAllData() {
    try {
        var storedData = localStorage.getItem(DATA_STORAGE_KEY);
        if (storedData) {
            var data = JSON.parse(storedData);
            return {
                transactions: data.transactions || [],
                settings: Object.assign({}, defaultData.settings, data.settings)
            };
        }
    } catch (error) {
        console.log('Error loading data:', error);
    }
    
    return Object.assign({}, defaultData);
}

// Save all data to storage
function saveAllData(data) {
    try {
        localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(data));
        console.log('Data saved successfully');
        return true;
    } catch (error) {
        console.log('Error saving data:', error);
        showMessage('Error saving data', 'error');
        return false;
    }
}

// Load user preferences
function loadUserPreferences() {
    try {
        var storedPrefs = localStorage.getItem(USER_SETTINGS_KEY);
        if (storedPrefs) {
            return Object.assign({}, defaultPreferences, JSON.parse(storedPrefs));
        }
    } catch (error) {
        console.log('Error loading preferences:', error);
    }
    
    return Object.assign({}, defaultPreferences);
}

// Save user preferences
function saveUserPreferences(preferences) {
    try {
        localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(preferences));
        console.log('Preferences saved successfully');
        return true;
    } catch (error) {
        console.log('Error saving preferences:', error);
        showMessage('Error saving preferences', 'error');
        return false;
    }
}

// Load sample data from seed.json file
function loadSampleDataFromFile() {
    return new Promise(function(resolve, reject) {
        // Check if we already have data
        var existingData = loadAllData();
        if (existingData.transactions.length > 0) {
            resolve(false);
            return;
        }

        // Try to load seed.json
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'seed.json', true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try {
                        var sampleData = JSON.parse(xhr.responseText);
                        if (sampleData && Array.isArray(sampleData)) {
                            // Save sample data to storage
                            var data = {
                                transactions: sampleData,
                                settings: defaultData.settings
                            };
                            saveAllData(data);
                            console.log('Loaded ' + sampleData.length + ' sample transactions');
                            resolve(true);
                        } else {
                            resolve(false);
                        }
                    } catch (error) {
                        console.log('Error parsing seed.json:', error);
                        resolve(false);
                    }
                } else {
                    console.log('Could not load seed.json');
                    resolve(false);
                }
            }
        };
        xhr.onerror = function() {
            console.log('Error loading seed.json');
            resolve(false);
        };
        xhr.send();
    });
}

// Add a new transaction
function addNewTransaction(transactionData) {
    var data = loadAllData();
    
    var newTransaction = {
        id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        description: transactionData.description,
        amount: parseFloat(transactionData.amount),
        category: transactionData.category,
        date: transactionData.date,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    data.transactions.unshift(newTransaction);
    var success = saveAllData(data);
    
    if (success) {
        showMessage('Item added successfully', 'success');
    }
    
    return success ? newTransaction : null;
}

// Update existing transaction
function updateExistingTransaction(transactionId, updates) {
    var data = loadAllData();
    var foundIndex = -1;
    
    for (var i = 0; i < data.transactions.length; i++) {
        if (data.transactions[i].id === transactionId) {
            foundIndex = i;
            break;
        }
    }
    
    if (foundIndex !== -1) {
        data.transactions[foundIndex] = Object.assign(
            {}, 
            data.transactions[foundIndex], 
            updates,
            { updatedAt: new Date().toISOString() }
        );
        
        var success = saveAllData(data);
        if (success) {
            showMessage('Item updated successfully', 'success');
        }
        return success;
    }
    
    showMessage('Item not found', 'error');
    return false;
}

// Delete a transaction
function deleteTransaction(transactionId) {
    var data = loadAllData();
    var originalCount = data.transactions.length;
    
    data.transactions = data.transactions.filter(function(item) {
        return item.id !== transactionId;
    });
    
    if (data.transactions.length < originalCount) {
        var success = saveAllData(data);
        if (success) {
            showMessage('Item deleted successfully', 'success');
        }
        return success;
    }
    
    showMessage('Item not found', 'error');
    return false;
}

// Get all transactions
function getTransactions(filters) {
    var data = loadAllData();
    var transactions = data.transactions.slice();
    
    if (filters) {
        if (filters.category) {
            transactions = transactions.filter(function(item) {
                return item.category === filters.category;
            });
        }
        
        if (filters.startDate) {
            transactions = transactions.filter(function(item) {
                return item.date >= filters.startDate;
            });
        }
        
        if (filters.endDate) {
            transactions = transactions.filter(function(item) {
                return item.date <= filters.endDate;
            });
        }
    }
    
    return transactions;
}

// Export data as JSON
function exportDataAsJSON() {
    var data = loadAllData();
    return JSON.stringify(data, null, 2);
}

// Import data from JSON
function importDataFromJSON(jsonString) {
    try {
        var importedData = JSON.parse(jsonString);
        
        if (!importedData || typeof importedData !== 'object') {
            throw new Error('Invalid data format');
        }
        
        var validatedData = {
            transactions: Array.isArray(importedData.transactions) ? importedData.transactions : [],
            settings: Object.assign({}, defaultData.settings, importedData.settings)
        };
        
        validatedData.transactions = validatedData.transactions.filter(function(transaction) {
            return transaction && transaction.id && transaction.description && transaction.amount != null;
        });
        
        var success = saveAllData(validatedData);
        if (success) {
            showMessage('Data imported successfully', 'success');
            return true;
        }
        
    } catch (error) {
        console.log('Error importing data:', error);
        showMessage('Invalid data format', 'error');
    }
    
    return false;
}

// Reset all data
function resetAllData() {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
        localStorage.removeItem(DATA_STORAGE_KEY);
        localStorage.removeItem(USER_SETTINGS_KEY);
        showMessage('All data has been reset', 'success');
        return true;
    }
    return false;
}

// Calculate statistics
function calculateStatistics() {
    var transactions = getTransactions();
    var settings = loadAllData().settings;
    
    var totalSpent = transactions.reduce(function(sum, item) {
        return sum + parseFloat(item.amount || 0);
    }, 0);
    
    var categoryTotals = {};
    transactions.forEach(function(item) {
        categoryTotals[item.category] = (categoryTotals[item.category] || 0) + parseFloat(item.amount || 0);
    });
    
    var topCategory = 'None';
    var highestAmount = 0;
    for (var category in categoryTotals) {
        if (categoryTotals[category] > highestAmount) {
            highestAmount = categoryTotals[category];
            topCategory = category;
        }
    }
    
    var limitStatus = null;
    if (settings.spendingLimit > 0) {
        limitStatus = {
            remaining: settings.spendingLimit - totalSpent,
            isOver: totalSpent > settings.spendingLimit
        };
    }
    
    return {
        totalItems: transactions.length,
        totalSpent: totalSpent,
        topCategory: topCategory,
        limitStatus: limitStatus,
        categoryTotals: categoryTotals
    };
}

// Show status message
function showMessage(message, type) {
    var messageElement = document.getElementById('status-message');
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.className = 'status-message ' + type;
        
        setTimeout(function() {
            messageElement.textContent = '';
            messageElement.className = 'status-message';
        }, 3000);
    }
    
    console.log(type.toUpperCase() + ': ' + message);
}

// Initialize storage system
function initializeStorageSystem() {
    console.log('Storage system initialized');
    loadAllData(); // Ensure structure exists
}

// Make functions available globally
window.storage = {
    loadAllData: loadAllData,
    saveAllData: saveAllData,
    loadUserPreferences: loadUserPreferences,
    saveUserPreferences: saveUserPreferences,
    loadSampleDataFromFile: loadSampleDataFromFile,
    addNewTransaction: addNewTransaction,
    updateExistingTransaction: updateExistingTransaction,
    deleteTransaction: deleteTransaction,
    getTransactions: getTransactions,
    exportDataAsJSON: exportDataAsJSON,
    importDataFromJSON: importDataFromJSON,
    resetAllData: resetAllData,
    calculateStatistics: calculateStatistics,
    initializeStorageSystem: initializeStorageSystem
};