// Safe pattern compiler
function compileSearchPattern(input, flags) {
    if (typeof flags === 'undefined') flags = 'i';
    try {
        return input ? new RegExp(input, flags) : null;
    } catch (error) {
        console.log('Invalid search pattern:', input, error);
        return null;
    }
}

// Validation rules

// 1. Description validation
function validateDescription(text) {
    var pattern = /^\S(?:.*\S)?$/;
    var isValid = pattern.test(text);
    
    return {
        isValid: isValid,
        message: isValid ? '' : 'Description cannot have spaces at start or end',
        cleaned: isValid ? text.trim().replace(/\s+/g, ' ') : text
    };
}

// 2. Amount validation
function validateAmount(amount) {
    var pattern = /^(0|[1-9]\d*)(\.\d{1,2})?$/;
    var isValid = pattern.test(amount.toString());
    
    return {
        isValid: isValid,
        message: isValid ? '' : 'Amount must be a positive number with up to 2 decimal places',
        cleaned: isValid ? parseFloat(amount).toFixed(2) : amount
    };
}

// 3. Date validation
function validateDate(dateString) {
    var pattern = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
    var isValid = pattern.test(dateString);
    
    if (isValid) {
        var date = new Date(dateString);
        var today = new Date();
        today.setHours(23, 59, 59, 999);
        
        if (date > today) {
            return {
                isValid: false,
                message: 'Date cannot be in the future',
                cleaned: dateString
            };
        }
    }
    
    return {
        isValid: isValid,
        message: isValid ? '' : 'Date must be in YYYY-MM-DD format',
        cleaned: dateString
    };
}

// 4. Category validation
function validateCategory(category) {
    var pattern = /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/;
    var isValid = pattern.test(category);
    
    return {
        isValid: isValid,
        message: isValid ? '' : 'Category can only contain letters, spaces, and hyphens',
        cleaned: isValid ? category.trim() : category
    };
}

// 5. Advanced: Duplicate words detection
function checkForDuplicateWords(text) {
    var pattern = /\b(\w+)\s+\1\b/i;
    var hasDuplicates = pattern.test(text);
    
    return {
        isValid: !hasDuplicates,
        message: hasDuplicates ? 'Description contains repeated words' : '',
        cleaned: text
    };
}

// 6. Advanced: Money pattern detection
function checkMoneyFormat(amount) {
    var pattern = /\.\d{2}\b/;
    var hasCents = pattern.test(amount.toString());
    
    return {
        isValid: true,
        message: hasCents ? '' : 'Consider adding cents for better tracking',
        cleaned: amount
    };
}

// Complete transaction validation
function validateCompleteTransaction(transactionData) {
    var errors = {};
    var cleanData = {};
    
    // Validate description
    var descCheck = validateDescription(transactionData.description);
    if (!descCheck.isValid) {
        errors.description = descCheck.message;
    }
    cleanData.description = descCheck.cleaned;
    
    // Validate amount
    var amountCheck = validateAmount(transactionData.amount);
    if (!amountCheck.isValid) {
        errors.amount = amountCheck.message;
    }
    cleanData.amount = amountCheck.cleaned;
    
    // Validate category
    var categoryCheck = validateCategory(transactionData.category);
    if (!categoryCheck.isValid) {
        errors.category = categoryCheck.message;
    }
    cleanData.category = categoryCheck.cleaned;
    
    // Validate date
    var dateCheck = validateDate(transactionData.date);
    if (!dateCheck.isValid) {
        errors.date = dateCheck.message;
    }
    cleanData.date = dateCheck.cleaned;
    
    // Advanced validations (warnings only)
    var duplicateCheck = checkForDuplicateWords(transactionData.description);
    if (!duplicateCheck.isValid) {
        errors.duplicateWords = duplicateCheck.message;
    }
    
    var moneyCheck = checkMoneyFormat(transactionData.amount);
    if (moneyCheck.message) {
        errors.moneyFormat = moneyCheck.message;
    }
    
    var hasCriticalErrors = false;
    for (var key in errors) {
        if (errors.hasOwnProperty(key) && key !== 'duplicateWords' && key !== 'moneyFormat') {
            hasCriticalErrors = true;
            break;
        }
    }
    
    return {
        isValid: !hasCriticalErrors,
        errors: errors,
        cleanData: cleanData
    };
}

// Real-time field validation
function validateInputField(fieldName, value) {
    switch (fieldName) {
        case 'description':
            var descResult = validateDescription(value);
            var duplicateResult = checkForDuplicateWords(value);
            return {
                isValid: descResult.isValid,
                message: descResult.message || duplicateResult.message,
                isWarning: !!duplicateResult.message && descResult.isValid
            };
            
        case 'amount':
            var amountResult = validateAmount(value);
            var moneyResult = checkMoneyFormat(value);
            return {
                isValid: amountResult.isValid,
                message: amountResult.message || moneyResult.message,
                isWarning: !!moneyResult.message && amountResult.isValid
            };
            
        case 'category':
            return validateCategory(value);
            
        case 'date':
            return validateDate(value);
            
        default:
            return { isValid: true, message: '' };
    }
}

// JSON import validation
function validateImportedJSON(jsonData) {
    try {
        var data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
        
        if (!data || typeof data !== 'object') {
            return { isValid: false, error: 'Invalid data format' };
        }
        
        if (data.transactions && !Array.isArray(data.transactions)) {
            return { isValid: false, error: 'Transactions must be an array' };
        }
        
        if (data.transactions) {
            for (var i = 0; i < data.transactions.length; i++) {
                var item = data.transactions[i];
                var validation = validateCompleteTransaction(item);
                if (!validation.isValid) {
                    var errorList = [];
                    for (var key in validation.errors) {
                        if (validation.errors.hasOwnProperty(key)) {
                            errorList.push(validation.errors[key]);
                        }
                    }
                    return { 
                        isValid: false, 
                        error: 'Item ' + (i + 1) + ' is invalid: ' + errorList.join(', ') 
                    };
                }
            }
        }
        
        return { isValid: true, data: data };
        
    } catch (error) {
        return { isValid: false, error: 'Invalid JSON data' };
    }
}

// Search pattern validation
function validateSearchPattern(pattern) {
    if (!pattern.trim()) {
        return { isValid: true, pattern: null };
    }
    
    var compiled = compileSearchPattern(pattern, 'i');
    return {
        isValid: compiled !== null,
        pattern: compiled,
        message: compiled ? '' : 'Invalid search pattern'
    };
}

// Initialize validators
function initializeInputValidators() {
    console.log('Input validation system initialized');
}

// Make validators available globally
window.validators = {
    compileSearchPattern: compileSearchPattern,
    validateDescription: validateDescription,
    validateAmount: validateAmount,
    validateDate: validateDate,
    validateCategory: validateCategory,
    checkForDuplicateWords: checkForDuplicateWords,
    checkMoneyFormat: checkMoneyFormat,
    validateCompleteTransaction: validateCompleteTransaction,
    validateInputField: validateInputField,
    validateImportedJSON: validateImportedJSON,
    validateSearchPattern: validateSearchPattern,
    initializeInputValidators: initializeInputValidators
};