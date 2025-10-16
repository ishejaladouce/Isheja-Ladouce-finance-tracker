// Safe regex compiler
function compileRegex(input, flags) {
    if (typeof flags === 'undefined') flags = 'i';
    try {
        return input ? new RegExp(input, flags) : null;
    } catch (error) {
        console.warn('Invalid regex pattern:', input, error);
        return null;
    }
}

//Description: No leading/trailing spaces, collapse doubles
function validateDescription(description) {
    var regex = /^\S(?:.*\S)?$/;
    var isValid = regex.test(description);
    
    return {
        isValid: isValid,
        message: isValid ? '' : 'Description cannot have leading or trailing spaces',
        cleaned: isValid ? description.trim().replace(/\s+/g, ' ') : description
    };
}

//Amount: Valid number format (0-2 decimal places)
function validateAmount(amount) {
    var regex = /^(0|[1-9]\d*)(\.\d{1,2})?$/;
    var isValid = regex.test(amount.toString());
    
    return {
        isValid: isValid,
        message: isValid ? '' : 'Amount must be a positive number with up to 2 decimal places',
        cleaned: isValid ? parseFloat(amount).toFixed(2) : amount
    };
}

//Date: YYYY-MM-DD format
function validateDate(dateString) {
    var regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
    var isValid = regex.test(dateString);
    
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
        message: isValid ? '' : 'Date must be in YYYY-MM-DD format and valid',
        cleaned: dateString
    };
}

//Category: Letters, spaces, hyphens only
function validateCategory(category) {
    var regex = /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/;
    var isValid = regex.test(category);
    
    return {
        isValid: isValid,
        message: isValid ? '' : 'Category can only contain letters, spaces, and hyphens',
        cleaned: isValid ? category.trim() : category
    };
}

//Detect duplicate words in description
function validateNoDuplicateWords(description) {
    var regex = /\b(\w+)\s+\1\b/i;
    var hasDuplicates = regex.test(description);
    
    return {
        isValid: !hasDuplicates,
        message: hasDuplicates ? 'Description contains duplicate words' : '',
        cleaned: description
    };
}

// 6. ADVANCED REGEX: Detect common money patterns
function validateMoneyPattern(amount) {
    var regex = /\.\d{2}\b/;
    var hasCents = regex.test(amount.toString());
    
    return {
        isValid: true,
        message: hasCents ? '' : 'Consider adding cents for precise tracking',
        cleaned: amount
    };
}

// Complete transaction validation
function validateTransaction(transactionData) {
    var errors = {};
    var cleanedData = {};
    
    // Validate description
    var descValidation = validateDescription(transactionData.description);
    if (!descValidation.isValid) {
        errors.description = descValidation.message;
    }
    cleanedData.description = descValidation.cleaned;
    
    // Validate amount
    var amountValidation = validateAmount(transactionData.amount);
    if (!amountValidation.isValid) {
        errors.amount = amountValidation.message;
    }
    cleanedData.amount = amountValidation.cleaned;
    
    // Validate category
    var categoryValidation = validateCategory(transactionData.category);
    if (!categoryValidation.isValid) {
        errors.category = categoryValidation.message;
    }
    cleanedData.category = categoryValidation.cleaned;
    
    // Validate date
    var dateValidation = validateDate(transactionData.date);
    if (!dateValidation.isValid) {
        errors.date = dateValidation.message;
    }
    cleanedData.date = dateValidation.cleaned;
    
    // Advanced validation: Duplicate words
    var duplicateValidation = validateNoDuplicateWords(transactionData.description);
    if (!duplicateValidation.isValid) {
        errors.duplicateWords = duplicateValidation.message;
    }
    
    // Advanced validation: Money pattern
    var moneyValidation = validateMoneyPattern(transactionData.amount);
    if (moneyValidation.message) {
        errors.moneyPattern = moneyValidation.message;
    }
    
    var hasCriticalErrors = false;
    for (var key in errors) {
        if (errors.hasOwnProperty(key) && key !== 'duplicateWords' && key !== 'moneyPattern') {
            hasCriticalErrors = true;
            break;
        }
    }
    
    return {
        isValid: !hasCriticalErrors,
        errors: errors,
        cleanedData: cleanedData
    };
}

// Real-time form field validation
function validateField(fieldName, value) {
    switch (fieldName) {
        case 'description':
            var descResult = validateDescription(value);
            var duplicateResult = validateNoDuplicateWords(value);
            return {
                isValid: descResult.isValid,
                message: descResult.message || duplicateResult.message,
                isWarning: !!duplicateResult.message && descResult.isValid
            };
            
        case 'amount':
            var amountResult = validateAmount(value);
            var moneyResult = validateMoneyPattern(value);
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
function validateImportedData(jsonData) {
    try {
        var data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
        
        if (!data || typeof data !== 'object') {
            return { isValid: false, error: 'Invalid data format' };
        }
        
        // Validate transactions array
        if (data.transactions && !Array.isArray(data.transactions)) {
            return { isValid: false, error: 'Transactions must be an array' };
        }
        
        // Validate each transaction
        if (data.transactions) {
            for (var i = 0; i < data.transactions.length; i++) {
                var transaction = data.transactions[i];
                var validation = validateTransaction(transaction);
                if (!validation.isValid) {
                    var errorMessages = [];
                    for (var key in validation.errors) {
                        if (validation.errors.hasOwnProperty(key)) {
                            errorMessages.push(validation.errors[key]);
                        }
                    }
                    return { 
                        isValid: false, 
                        error: 'Transaction ' + (i + 1) + ' is invalid: ' + errorMessages.join(', ') 
                    };
                }
            }
        }
        
        return { isValid: true, data: data };
        
    } catch (error) {
        return { isValid: false, error: 'Invalid JSON format' };
    }
}

// Search pattern validation
function validateSearchPattern(pattern) {
    if (!pattern.trim()) {
        return { isValid: true, regex: null };
    }
    
    var regex = compileRegex(pattern, 'i');
    return {
        isValid: regex !== null,
        regex: regex,
        message: regex ? '' : 'Invalid search pattern'
    };
}

// Initialize validators
function initializeValidators() {
    console.log('Validators module initialized');
}

// Make validators available globally
window.validators = {
    compileRegex: compileRegex,
    validateDescription: validateDescription,
    validateAmount: validateAmount,
    validateDate: validateDate,
    validateCategory: validateCategory,
    validateNoDuplicateWords: validateNoDuplicateWords,
    validateMoneyPattern: validateMoneyPattern,
    validateTransaction: validateTransaction,
    validateField: validateField,
    validateImportedData: validateImportedData,
    validateSearchPattern: validateSearchPattern,
    initializeValidators: initializeValidators
};