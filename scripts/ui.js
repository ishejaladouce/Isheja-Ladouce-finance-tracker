// Initialize UI system
function initializeUserInterface() {
    console.log('User interface system initialized');
    
    setupFormHandlers();
    setupTableHandlers();
    setupSettingsHandlers();
    setupDashboardUpdates();
    
    renderAllTransactions();
    updateDashboardDisplay();
    updateSettingsForm();
    
    document.addEventListener('transactionsChanged', function() {
        renderAllTransactions();
        updateDashboardDisplay();
    });
    
    document.addEventListener('settingsChanged', function() {
        updateSettingsForm();
        updateDashboardDisplay();
    });
    
    document.addEventListener('searchChanged', function() {
        renderAllTransactions();
    });
    
    document.addEventListener('sortChanged', function() {
        renderAllTransactions();
    });
}

// Form handling
function setupFormHandlers() {
    var form = document.getElementById('money-form');
    var cancelButton = document.getElementById('cancel-edit');
    
    if (form) {
        form.addEventListener('submit', handleFormSubmission);
        form.addEventListener('reset', handleFormReset);
        
        var inputs = form.querySelectorAll('input, select');
        for (var i = 0; i < inputs.length; i++) {
            inputs[i].addEventListener('blur', validateFieldInRealTime);
            inputs[i].addEventListener('input', validateFieldInRealTime);
        }
    }
    
    if (cancelButton) {
        cancelButton.addEventListener('click', cancelEditing);
    }
}

// Handle form submission
function handleFormSubmission(event) {
    event.preventDefault();
    
    var form = event.target;
    var formData = new FormData(form);
    
    var itemData = {
        description: formData.get('description'),
        amount: parseFloat(formData.get('amount')),
        category: formData.get('category'),
        date: formData.get('date')
    };
    
    var validation = window.validators.validateCompleteTransaction(itemData);
    
    if (validation.isValid) {
        var editId = formData.get('editing-id');
        
        if (editId) {
            window.state.updateTransaction(editId, validation.cleanData);
            cancelEditing();
        } else {
            window.state.addTransaction(validation.cleanData);
            form.reset();
        }
        
        showStatusMessage('Item saved successfully', 'success');
    } else {
        showFormValidationErrors(validation.errors);
        showStatusMessage('Please fix the errors above', 'error');
    }
}

// Handle form reset
function handleFormReset() {
    clearFormValidationErrors();
    cancelEditing();
}

// Cancel edit mode
function cancelEditing() {
    var form = document.getElementById('money-form');
    var submitButton = document.getElementById('submit-btn');
    var cancelButton = document.getElementById('cancel-edit');
    var editIdField = document.getElementById('editing-id');
    
    if (form) form.reset();
    if (submitButton) submitButton.textContent = 'Save This Item';
    if (cancelButton) cancelButton.style.display = 'none';
    if (editIdField) editIdField.value = '';
    
    window.state.clearEditingItem();
    clearFormValidationErrors();
}

// Real-time field validation
function validateFieldInRealTime(event) {
    var field = event.target;
    var fieldName = field.name;
    var value = field.value;
    
    var validation = window.validators.validateInputField(fieldName, value);
    var errorElement = field.parentNode.querySelector('.help-text');
    
    if (!errorElement) {
        errorElement = document.createElement('small');
        errorElement.className = 'help-text';
        errorElement.setAttribute('aria-live', 'polite');
        field.parentNode.appendChild(errorElement);
    }
    
    if (!validation.isValid || validation.message) {
        errorElement.textContent = validation.message;
        errorElement.className = 'help-text ' + (validation.isWarning ? 'warning' : 'error');
        field.classList.add('invalid');
    } else {
        errorElement.textContent = '';
        errorElement.className = 'help-text';
        field.classList.remove('invalid');
    }
}

// Show form validation errors
function showFormValidationErrors(errors) {
    clearFormValidationErrors();
    
    for (var fieldName in errors) {
        if (errors.hasOwnProperty(fieldName)) {
            var field = document.querySelector('[name="' + fieldName + '"]');
            if (field) {
                var errorElement = field.parentNode.querySelector('.help-text');
                if (!errorElement) {
                    errorElement = document.createElement('small');
                    errorElement.className = 'help-text';
                    errorElement.setAttribute('aria-live', 'polite');
                    field.parentNode.appendChild(errorElement);
                }
                errorElement.textContent = errors[fieldName];
                field.classList.add('invalid');
            }
        }
    }
}

// Clear form validation errors
function clearFormValidationErrors() {
    var errorMessages = document.querySelectorAll('.help-text');
    var invalidFields = document.querySelectorAll('.invalid');
    
    for (var i = 0; i < errorMessages.length; i++) {
        errorMessages[i].textContent = '';
    }
    
    for (var j = 0; j < invalidFields.length; j++) {
        invalidFields[j].classList.remove('invalid');
    }
}

// Render transactions table and cards
function renderAllTransactions() {
    var transactions = window.state.getDisplayTransactions();
    var tableBody = document.getElementById('records-body');
    var cardsContainer = document.getElementById('records-cards');
    var emptyMessage = document.getElementById('empty-message');
    
    if (tableBody) {
        tableBody.innerHTML = '';
    }
    if (cardsContainer) {
        cardsContainer.innerHTML = '';
    }
    
    if (transactions.length === 0) {
        if (emptyMessage) {
            emptyMessage.style.display = '';
        }
        return;
    }
    
    if (emptyMessage) {
        emptyMessage.style.display = 'none';
    }
    
    if (tableBody) {
        for (var i = 0; i < transactions.length; i++) {
            var item = transactions[i];
            var highlighted = window.search.getHighlightedItem(item);
            
            var row = document.createElement('tr');
            row.innerHTML = 
                '<td>' + highlighted.description + '</td>' +
                '<td>$' + highlighted.amount + '</td>' +
                '<td>' + highlighted.category + '</td>' +
                '<td>' + highlighted.date + '</td>' +
                '<td>' +
                '<button onclick="editExistingItem(\'' + item.id + '\')" class="edit-btn">Edit</button>' +
                '<button onclick="deleteExistingItem(\'' + item.id + '\')" class="delete-btn">Delete</button>' +
                '</td>';
            tableBody.appendChild(row);
        }
    }
    
    if (cardsContainer) {
        for (var j = 0; j < transactions.length; j++) {
            var cardItem = transactions[j];
            var cardHighlighted = window.search.getHighlightedItem(cardItem);
            
            var card = document.createElement('div');
            card.className = 'mobile-card';
            card.innerHTML = 
                '<div class="mobile-card-header">' +
                '<h4>' + cardHighlighted.description + '</h4>' +
                '<span class="amount">$' + cardHighlighted.amount + '</span>' +
                '</div>' +
                '<div class="mobile-card-details">' +
                '<div class="category">' + cardHighlighted.category + '</div>' +
                '<div class="date">' + cardHighlighted.date + '</div>' +
                '</div>' +
                '<div class="mobile-card-actions">' +
                '<button onclick="editExistingItem(\'' + cardItem.id + '\')" class="edit-btn">Edit</button>' +
                '<button onclick="deleteExistingItem(\'' + cardItem.id + '\')" class="delete-btn">Delete</button>' +
                '</div>';
            cardsContainer.appendChild(card);
        }
    }
}

// Edit existing item
function editExistingItem(itemId) {
    var transactions = window.state.getCurrentState().transactions;
    var item = null;
    
    for (var i = 0; i < transactions.length; i++) {
        if (transactions[i].id === itemId) {
            item = transactions[i];
            break;
        }
    }
    
    if (!item) return;
    
    document.getElementById('description').value = item.description;
    document.getElementById('amount').value = item.amount;
    document.getElementById('category').value = item.category;
    document.getElementById('date').value = item.date;
    document.getElementById('editing-id').value = item.id;
    
    document.getElementById('submit-btn').textContent = 'Update Item';
    document.getElementById('cancel-edit').style.display = 'inline-block';
    
    document.getElementById('form-section').scrollIntoView({ behavior: 'smooth' });
}

// Delete existing item
function deleteExistingItem(itemId) {
    var settings = window.state.getCurrentState().settings;
    if (settings.askBeforeDelete) {
        if (!confirm('Are you sure you want to delete this item?')) {
            return;
        }
    }
    window.state.removeTransaction(itemId);
}

// Update dashboard display
function updateDashboardDisplay() {
    var stats = window.state.getCurrentStatistics();
    
    var totalAmount = document.getElementById('total-amount');
    var topCategory = document.getElementById('top-category');
    var budgetStatus = document.getElementById('budget-status');
    
    if (totalAmount) {
        totalAmount.textContent = '$' + stats.totalSpent.toFixed(2);
    }
    
    if (topCategory) {
        topCategory.textContent = stats.topCategory;
    }
    
    if (budgetStatus) {
        if (stats.limitStatus) {
            if (stats.limitStatus.isOver) {
                budgetStatus.textContent = 'Over by $' + Math.abs(stats.limitStatus.remaining).toFixed(2);
                budgetStatus.style.color = '#dc2626';
                announceToScreenReader('Budget exceeded by $' + Math.abs(stats.limitStatus.remaining).toFixed(2), 'assertive');
            } else {
                budgetStatus.textContent = '$' + stats.limitStatus.remaining.toFixed(2) + ' remaining';
                budgetStatus.style.color = '#059669';
                announceToScreenReader('Budget status: $' + stats.limitStatus.remaining.toFixed(2) + ' remaining', 'polite');
            }
        } else {
            budgetStatus.textContent = 'No limit set';
            budgetStatus.style.color = '#64748b';
        }
    }
    
    updateSpendingChart(stats);
}

// Simple chart implementation
function updateSpendingChart(stats) {
    var chartArea = document.getElementById('chart-area');
    if (!chartArea) return;
    
    var lastWeekData = getLastWeekSpending();
    var maxAmount = 0;
    for (var i = 0; i < lastWeekData.length; i++) {
        if (lastWeekData[i].amount > maxAmount) {
            maxAmount = lastWeekData[i].amount;
        }
    }
    
    var chartHTML = '<div class="chart-bars">';
    for (var j = 0; j < lastWeekData.length; j++) {
        var day = lastWeekData[j];
        var height = maxAmount > 0 ? (day.amount / maxAmount) * 100 : 0;
        
        chartHTML += 
            '<div class="chart-bar-container">' +
            '<div class="chart-bar" style="height: ' + height + '%"></div>' +
            '<div class="chart-label">' + day.label + '</div>' +
            '<div class="chart-amount">$' + day.amount.toFixed(2) + '</div>' +
            '</div>';
    }
    chartHTML += '</div>';
    
    chartArea.innerHTML = chartHTML;
}

// Get last 7 days spending data
function getLastWeekSpending() {
    var transactions = window.state.getCurrentState().transactions;
    var days = [];
    var today = new Date();
    
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
    
    for (var j = 0; j < transactions.length; j++) {
        var item = transactions[j];
        for (var k = 0; k < days.length; k++) {
            if (item.date === days[k].date) {
                days[k].amount += parseFloat(item.amount);
            }
        }
    }
    
    return days;
}

// Settings handlers
function setupSettingsHandlers() {
    var saveSettingsButton = document.getElementById('save-settings-btn');
    var exportButton = document.getElementById('export-btn');
    var importButton = document.getElementById('import-btn');
    var resetButton = document.getElementById('reset-data-btn');
    
    if (saveSettingsButton) {
        saveSettingsButton.addEventListener('click', saveAllSettings);
    }
    
    if (exportButton) {
        exportButton.addEventListener('click', exportUserData);
    }
    
    if (importButton) {
        importButton.addEventListener('click', importUserData);
    }
    
    if (resetButton) {
        resetButton.addEventListener('click', resetAllUserData);
    }
}

// Save all settings
function saveAllSettings() {
    var spendingLimit = document.getElementById('spending-limit').value;
    var mainCurrency = document.getElementById('main-currency').value;
    
    var colorTheme = document.getElementById('color-theme').value;
    var textSize = document.getElementById('text-size').value;
    var dateStyle = document.getElementById('date-style').value;
    var moneyStyle = document.getElementById('money-style').value;
    var autoSave = document.getElementById('auto-save').checked;
    var showGraphs = document.getElementById('show-graphs').checked;
    var askBeforeDelete = document.getElementById('ask-before-delete').checked;
    
    var settings = {
        spendingLimit: spendingLimit ? parseFloat(spendingLimit) : 0,
        mainCurrency: mainCurrency
    };
    
    var preferences = {
        colorTheme: colorTheme,
        textSize: textSize,
        dateStyle: dateStyle,
        moneyStyle: moneyStyle,
        autoSave: autoSave,
        showGraphs: showGraphs,
        askBeforeDelete: askBeforeDelete
    };
    
    var success1 = window.state.updateUserSettings(preferences);
    var success2 = window.storage.saveUserPreferences(preferences);
    
    if (success1 || success2) {
        showStatusMessage('All settings saved successfully', 'success');
    }
}

// Export user data
function exportUserData() {
    var data = window.state.exportApplicationData();
    var blob = new Blob([data], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    
    var link = document.createElement('a');
    link.href = url;
    link.download = 'my-money-data-' + new Date().toISOString().split('T')[0] + '.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showStatusMessage('Data exported successfully', 'success');
}

// Import user data
function importUserData() {
    var jsonInput = document.getElementById('import-data');
    var jsonData = jsonInput.value.trim();
    
    if (!jsonData) {
        showStatusMessage('Please enter data to import', 'error');
        return;
    }
    
    var success = window.state.importApplicationData(jsonData);
    if (success) {
        jsonInput.value = '';
    }
}

// Reset all user data
function resetAllUserData() {
    if (confirm('Are you sure you want to reset ALL data? This cannot be undone.')) {
        window.state.resetApplicationData();
        showStatusMessage('All data has been reset', 'success');
    }
}

// Update settings form display
function updateSettingsForm() {
    var settings = window.state.getCurrentState().settings;
    
    var spendingLimit = document.getElementById('spending-limit');
    var mainCurrency = document.getElementById('main-currency');
    var colorTheme = document.getElementById('color-theme');
    var textSize = document.getElementById('text-size');
    var dateStyle = document.getElementById('date-style');
    var moneyStyle = document.getElementById('money-style');
    var autoSave = document.getElementById('auto-save');
    var showGraphs = document.getElementById('show-graphs');
    var askBeforeDelete = document.getElementById('ask-before-delete');
    
    if (spendingLimit) spendingLimit.value = settings.spendingLimit || '';
    if (mainCurrency) mainCurrency.value = settings.mainCurrency || 'USD';
    if (colorTheme) colorTheme.value = settings.colorTheme || 'default';
    if (textSize) textSize.value = settings.textSize || 'medium';
    if (dateStyle) dateStyle.value = settings.dateStyle || 'yyyy-mm-dd';
    if (moneyStyle) moneyStyle.value = settings.moneyStyle || 'symbol';
    if (autoSave) autoSave.checked = settings.autoSave !== false;
    if (showGraphs) showGraphs.checked = settings.showGraphs !== false;
    if (askBeforeDelete) askBeforeDelete.checked = settings.askBeforeDelete !== false;
}

// Table handlers (sorting)
function setupTableHandlers() {
    var sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', function(event) {
            window.state.setSortMethod(event.target.value);
        });
    }
}

// Dashboard auto-updates
function setupDashboardUpdates() {
    setInterval(updateDashboardDisplay, 60000);
}

// Status message utility
function showStatusMessage(message, type) {
    var messageElement = document.getElementById('status-message');
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.className = 'status-message ' + type;
        
        setTimeout(function() {
            messageElement.textContent = '';
            messageElement.className = 'status-message';
        }, 5000);
    }
}

// Accessibility: Announce to screen readers
function announceToScreenReader(message, politeness) {
    var liveRegion = document.getElementById('status-message');
    if (liveRegion) {
        liveRegion.setAttribute('aria-live', politeness || 'polite');
        liveRegion.textContent = message;
        
        setTimeout(function() {
            liveRegion.textContent = '';
        }, 3000);
    }
}

// Make UI functions available globally
window.ui = {
    initializeUserInterface: initializeUserInterface,
    editExistingItem: editExistingItem,
    deleteExistingItem: deleteExistingItem,
    exportUserData: exportUserData,
    importUserData: importUserData
};

// Global functions for HTML onclick handlers
window.editExistingItem = editExistingItem;
window.deleteExistingItem = deleteExistingItem;