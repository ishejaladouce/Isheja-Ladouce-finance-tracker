// scripts/ui.js - Pure Vanilla JavaScript UI System

// Initialize UI system
function initializeUI() {
    console.log('UI module initialized');
    
    // Set up event listeners
    setupFormHandlers();
    setupTableHandlers();
    setupSettingsHandlers();
    setupDashboardUpdates();
    
    // Initial render
    renderTransactions();
    updateDashboard();
    updateSettingsDisplay();
    
    // Listen for state changes
    document.addEventListener('transactionsUpdated', function() {
        renderTransactions();
        updateDashboard();
    });
    
    document.addEventListener('settingsUpdated', function() {
        updateSettingsDisplay();
        updateDashboard();
    });
    
    document.addEventListener('searchUpdated', function() {
        renderTransactions();
    });
    
    document.addEventListener('sortUpdated', function() {
        renderTransactions();
    });
}

// Form handling
function setupFormHandlers() {
    var form = document.getElementById('transaction-form');
    var cancelButton = document.getElementById('cancel-edit');
    
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
        form.addEventListener('reset', handleFormReset);
        
        // Real-time validation
        var inputs = form.querySelectorAll('input, select');
        for (var i = 0; i < inputs.length; i++) {
            inputs[i].addEventListener('blur', validateFormField);
            inputs[i].addEventListener('input', validateFormField);
        }
    }
    
    if (cancelButton) {
        cancelButton.addEventListener('click', cancelEdit);
    }
}

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();
    
    var form = e.target;
    var formData = new FormData(form);
    
    var transactionData = {
        description: formData.get('description'),
        amount: parseFloat(formData.get('amount')),
        category: formData.get('category'),
        date: formData.get('date')
    };
    
    // Validate the transaction
    var validation = window.validators.validateTransaction(transactionData);
    
    if (validation.isValid) {
        var editId = formData.get('edit-id');
        
        if (editId) {
            // Update existing transaction
            window.state.updateTransaction(editId, validation.cleanedData);
            cancelEdit();
        } else {
            // Add new transaction
            window.state.addTransaction(validation.cleanedData);
            form.reset();
        }
        
        showStatus('Transaction saved successfully!', 'success');
    } else {
        // Show validation errors
        showFormErrors(validation.errors);
        showStatus('Please fix the errors above', 'error');
    }
}

// Handle form reset
function handleFormReset() {
    clearFormErrors();
    cancelEdit();
}

// Cancel edit mode
function cancelEdit() {
    var form = document.getElementById('transaction-form');
    var submitBtn = document.getElementById('submit-btn');
    var cancelBtn = document.getElementById('cancel-edit');
    var editId = document.getElementById('edit-id');
    
    if (form) form.reset();
    if (submitBtn) submitBtn.textContent = 'Add Transaction';
    if (cancelBtn) cancelBtn.style.display = 'none';
    if (editId) editId.value = '';
    
    window.state.clearEditingTransaction();
    clearFormErrors();
}

// Real-time form field validation
function validateFormField(e) {
    var field = e.target;
    var fieldName = field.name;
    var value = field.value;
    
    var validation = window.validators.validateField(fieldName, value);
    var errorElement = field.parentNode.querySelector('.error-message');
    
    if (!errorElement) {
        errorElement = document.createElement('small');
        errorElement.className = 'error-message';
        errorElement.setAttribute('aria-live', 'polite');
        field.parentNode.appendChild(errorElement);
    }
    
    if (!validation.isValid || validation.message) {
        errorElement.textContent = validation.message;
        errorElement.className = 'error-message ' + (validation.isWarning ? 'warning' : 'error');
        field.classList.add('invalid');
    } else {
        errorElement.textContent = '';
        errorElement.className = 'error-message';
        field.classList.remove('invalid');
    }
}

// Show form errors
function showFormErrors(errors) {
    clearFormErrors();
    
    for (var fieldName in errors) {
        if (errors.hasOwnProperty(fieldName)) {
            var field = document.querySelector('[name="' + fieldName + '"]');
            if (field) {
                var errorElement = field.parentNode.querySelector('.error-message');
                if (!errorElement) {
                    errorElement = document.createElement('small');
                    errorElement.className = 'error-message';
                    errorElement.setAttribute('aria-live', 'polite');
                    field.parentNode.appendChild(errorElement);
                }
                errorElement.textContent = errors[fieldName];
                field.classList.add('invalid');
            }
        }
    }
}

// Clear form errors
function clearFormErrors() {
    var errorMessages = document.querySelectorAll('.error-message');
    var invalidFields = document.querySelectorAll('.invalid');
    
    for (var i = 0; i < errorMessages.length; i++) {
        errorMessages[i].textContent = '';
    }
    
    for (var j = 0; j < invalidFields.length; j++) {
        invalidFields[j].classList.remove('invalid');
    }
}

// Render transactions table/cards
function renderTransactions() {
    var transactions = window.state.getDisplayTransactions();
    var tableBody = document.getElementById('records-body');
    var cardsContainer = document.getElementById('records-cards');
    var emptyState = document.getElementById('empty-state');
    
    // Clear existing content
    if (tableBody) {
        tableBody.innerHTML = '';
    }
    if (cardsContainer) {
        cardsContainer.innerHTML = '';
    }
    
    // Show empty state if no transactions
    if (transactions.length === 0) {
        if (emptyState) {
            emptyState.style.display = '';
        }
        return;
    }
    
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    // Render table rows
    if (tableBody) {
        for (var i = 0; i < transactions.length; i++) {
            var transaction = transactions[i];
            var highlighted = window.search.getHighlightedTransaction(transaction);
            
            var row = document.createElement('tr');
            row.innerHTML = `
                <td>${highlighted.description}</td>
                <td>$${highlighted.amount}</td>
                <td>${highlighted.category}</td>
                <td>${highlighted.date}</td>
                <td>
                    <button onclick="editTransaction('${transaction.id}')" class="btn-edit">Edit</button>
                    <button onclick="deleteTransaction('${transaction.id}')" class="btn-delete">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        }
    }
    
    // Render mobile cards
    if (cardsContainer) {
        for (var j = 0; j < transactions.length; j++) {
            var cardTransaction = transactions[j];
            var cardHighlighted = window.search.getHighlightedTransaction(cardTransaction);
            
            var card = document.createElement('div');
            card.className = 'record-card';
            card.innerHTML = `
                <div class="card-header">
                    <h4>${cardHighlighted.description}</h4>
                    <span class="amount">$${cardHighlighted.amount}</span>
                </div>
                <div class="card-details">
                    <div class="category">${cardHighlighted.category}</div>
                    <div class="date">${cardHighlighted.date}</div>
                </div>
                <div class="card-actions">
                    <button onclick="editTransaction('${cardTransaction.id}')" class="btn-edit">Edit</button>
                    <button onclick="deleteTransaction('${cardTransaction.id}')" class="btn-delete">Delete</button>
                </div>
            `;
            cardsContainer.appendChild(card);
        }
    }
}

// Edit transaction
function editTransaction(transactionId) {
    var transactions = window.state.getState().transactions;
    var transaction = null;
    
    for (var i = 0; i < transactions.length; i++) {
        if (transactions[i].id === transactionId) {
            transaction = transactions[i];
            break;
        }
    }
    
    if (!transaction) return;
    
    // Populate form
    document.getElementById('description').value = transaction.description;
    document.getElementById('amount').value = transaction.amount;
    document.getElementById('category').value = transaction.category;
    document.getElementById('date').value = transaction.date;
    document.getElementById('edit-id').value = transaction.id;
    
    // Update UI
    document.getElementById('submit-btn').textContent = 'Update Transaction';
    document.getElementById('cancel-edit').style.display = 'inline-block';
    
    // Scroll to form
    document.getElementById('form-section').scrollIntoView({ behavior: 'smooth' });
}

// Delete transaction
function deleteTransaction(transactionId) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        window.state.deleteTransaction(transactionId);
    }
}

// Update dashboard
function updateDashboard() {
    var stats = window.state.getCurrentStats();
    
    // Update cards
    var totalAmount = document.getElementById('total-amount');
    var topCategory = document.getElementById('top-category');
    var capStatus = document.getElementById('cap-status');
    
    if (totalAmount) {
        totalAmount.textContent = '$' + stats.totalAmount.toFixed(2);
    }
    
    if (topCategory) {
        topCategory.textContent = stats.topCategory;
    }
    
    if (capStatus) {
        if (stats.budgetStatus) {
            if (stats.budgetStatus.isOver) {
                capStatus.textContent = 'Over by $' + Math.abs(stats.budgetStatus.remaining).toFixed(2);
                capStatus.style.color = '#dc2626';
                announceToScreenReader('Budget exceeded! Over by $' + Math.abs(stats.budgetStatus.remaining).toFixed(2), 'assertive');
            } else {
                capStatus.textContent = '$' + stats.budgetStatus.remaining.toFixed(2) + ' left';
                capStatus.style.color = '#059669';
                announceToScreenReader('Budget status: $' + stats.budgetStatus.remaining.toFixed(2) + ' remaining', 'polite');
            }
        } else {
            capStatus.textContent = 'Not set';
            capStatus.style.color = '#64748b';
        }
    }
    
    // Update chart
    updateChart(stats);
}

// Simple chart implementation
function updateChart(stats) {
    var chartContainer = document.getElementById('chart-container');
    if (!chartContainer) return;
    
    // Simple bar chart using CSS
    var last7Days = getLast7DaysData();
    var maxAmount = Math.max.apply(Math, last7Days.map(function(day) { return day.amount; }));
    
    var chartHTML = '<div class="chart-bars">';
    for (var i = 0; i < last7Days.length; i++) {
        var day = last7Days[i];
        var height = maxAmount > 0 ? (day.amount / maxAmount) * 100 : 0;
        
        chartHTML += `
            <div class="chart-bar-container">
                <div class="chart-bar" style="height: ${height}%"></div>
                <div class="chart-label">${day.label}</div>
                <div class="chart-amount">$${day.amount.toFixed(2)}</div>
            </div>
        `;
    }
    chartHTML += '</div>';
    
    chartContainer.innerHTML = chartHTML;
}

// Get last 7 days data for chart
function getLast7DaysData() {
    var transactions = window.state.getState().transactions;
    var days = [];
    var today = new Date();
    
    // Initialize last 7 days
    for (var i = 6; i >= 0; i--) {
        var date = new Date(today);
        date.setDate(date.getDate() - i);
        var dateString = date.toISOString().split('T')[0];
        
        days.push({
            date: dateString,
            label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            amount: 0
        });
    }
    
    // Sum amounts for each day
    for (var j = 0; j < transactions.length; j++) {
        var transaction = transactions[j];
        for (var k = 0; k < days.length; k++) {
            if (transaction.date === days[k].date) {
                days[k].amount += parseFloat(transaction.amount);
            }
        }
    }
    
    return days;
}

// Settings handlers
function setupSettingsHandlers() {
    var saveSettingsBtn = document.getElementById('save-settings-btn');
    var exportBtn = document.getElementById('export-btn');
    var importBtn = document.getElementById('import-btn');
    var resetDataBtn = document.getElementById('reset-data-btn');
    
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveSettings);
    }
    
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
    
    if (importBtn) {
        importBtn.addEventListener('click', importData);
    }
    
    if (resetDataBtn) {
        resetDataBtn.addEventListener('click', resetData);
    }
}

// Save settings
function saveSettings() {
    var budgetCap = document.getElementById('budget-cap').value;
    var baseCurrency = document.getElementById('base-currency').value;
    
    var settings = {
        budgetCap: budgetCap ? parseFloat(budgetCap) : 0,
        baseCurrency: baseCurrency
    };
    
    window.state.updateSettings(settings);
    showStatus('Settings saved successfully!', 'success');
}

// Export data
function exportData() {
    var data = window.state.exportAppData();
    var blob = new Blob([data], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    
    var a = document.createElement('a');
    a.href = url;
    a.download = 'finance-data-' + new Date().toISOString().split('T')[0] + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showStatus('Data exported successfully!', 'success');
}

// Import data
function importData() {
    var jsonInput = document.getElementById('json-import');
    var jsonData = jsonInput.value.trim();
    
    if (!jsonData) {
        showStatus('Please enter JSON data to import', 'error');
        return;
    }
    
    var success = window.state.importAppData(jsonData);
    if (success) {
        jsonInput.value = '';
    }
}

// Reset data
function resetData() {
    if (confirm('Are you sure you want to reset ALL data? This cannot be undone.')) {
        window.state.resetAppData();
        showStatus('All data has been reset', 'success');
    }
}

// Update settings display
function updateSettingsDisplay() {
    var settings = window.state.getState().settings;
    
    var budgetCap = document.getElementById('budget-cap');
    var baseCurrency = document.getElementById('base-currency');
    
    if (budgetCap) budgetCap.value = settings.budgetCap || '';
    if (baseCurrency) baseCurrency.value = settings.baseCurrency || 'USD';
}

// Table handlers (sorting)
function setupTableHandlers() {
    var sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', function(e) {
            window.state.setSortBy(e.target.value);
        });
    }
}

// Dashboard auto-updates
function setupDashboardUpdates() {
    // Update dashboard every minute for real-time feel
    setInterval(updateDashboard, 60000);
}

// Status message utility
function showStatus(message, type) {
    var statusElement = document.getElementById('status-message');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = 'status-message ' + type;
        
        setTimeout(function() {
            statusElement.textContent = '';
            statusElement.className = 'status-message';
        }, 5000);
    }
}

// Announce to screen readers
function announceToScreenReader(message, politeness) {
    var liveRegion = document.getElementById('status-message');
    if (liveRegion) {
        liveRegion.setAttribute('aria-live', politeness || 'polite');
        liveRegion.textContent = message;
        
        // Clear after a delay
        setTimeout(function() {
            liveRegion.textContent = '';
        }, 3000);
    }
}

// Make UI functions available globally
window.ui = {
    initializeUI: initializeUI,
    editTransaction: editTransaction,
    deleteTransaction: deleteTransaction,
    exportData: exportData,
    importData: importData
};