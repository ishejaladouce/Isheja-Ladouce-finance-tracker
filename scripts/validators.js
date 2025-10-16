// Safe regex compiler 
function compileRegex(input, flags = 'i') {
    try {
        return input ? new RegExp(input, flags) : null;
    } catch (error) {
        console.warn('Invalid regex pattern:', input, error);
        return null;
    }
}

// Description: No leading/trailing spaces, collapse doubles
function validateDescription(description) {
    const regex = /^\S(?:.*\S)?$/; // No leading/trailing spaces
    const isValid = regex.test(description);
    
    return {
        isValid: isValid,
        message: isValid ? '' : 'Description cannot have leading or trailing spaces',
        cleaned: isValid ? description.trim().replace(/\s+/g, ' ') : description
    };
}

// Amount: Valid number format (0-2 decimal places)
function validateAmount(amount) {
    const regex = /^(0|[1-9]\d*)(\.\d{1,2})?$/; // Numbers with 0-2 decimals
    const isValid = regex.test(amount.toString());
    
    return {
        isValid: isValid,
        message: isValid ? '' : 'Amount must be a positive number with up to 2 decimal places',
        cleaned: isValid ? parseFloat(amount).toFixed(2) : amount
    };
}

// Date: YYYY-MM-DD format
function validateDate(dateString) {
    const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/; // YYYY-MM-DD
    const isValid = regex.test(dateString);
    
    if (isValid) {
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today
        
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

// Category: Letters, spaces, hyphens only
function validateCategory(category) {
    const regex = /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/; // Letters, spaces, hyphens
    const isValid = regex.test(category);
    
    return {
        isValid: isValid,
        message: isValid ? '' : 'Category can only contain letters, spaces, and hyphens',
        cleaned: isValid ? category.trim() : category
    };
}

// ADVANCED REGEX: Detect duplicate words in description
function validateNoDuplicateWords(description) {
    const regex = /\b(\w+)\s+\1\b/i; 
    const hasDuplicates = regex.test(description);
    
    return {
        isValid: !hasDuplicates,
        message: hasDuplicates ? 'Description contains duplicate words' : '',
        cleaned: description
    };
}

// Detect common money patterns (cents present)
function validateMoneyPattern(amount) {
    const regex = /\.\d{2}\b/; // Pattern to detect amounts with cents (like 12.50, 5.00, etc.)
    const hasCents = regex.test(amount.toString());
    
    return {
        isValid: true, 
        message: hasCents ? '' : 'Consider adding cents for precise tracking (e.g., 12.50 instead of 12)',
        cleaned: amount
    };
}

// Complete transaction validation
function validateTransaction(transactionData) {
    const errors = {};
    const cleanedData = {};
    
    // Validate description
    const descValidation = validateDescription(transactionData.description);
    if (!descValidation.isValid) {
        errors.description = descValidation.message;
    }
    cleanedData.description = descValidation.cleaned;
    
    // Validate amount
    const amountValidation = validateAmount(transactionData.amount);
    if (!amountValidation.isValid) {
        errors.amount = amountValidation.message;
    }
    cleanedData.amount = amountValidation.cleaned;
    
    // Validate category
    const categoryValidation = validateCategory(transactionData.category);
    if (!categoryValidation.isValid) {
        errors.category = categoryValidation.message;
    }
    cleanedData.category = categoryValidation.cleaned;
    
    // Validate date
    const dateValidation = validateDate(transactionData.date);
    if (!dateValidation.isValid) {
        errors.date = dateValidation.message;
    }
    cleanedData.date = dateValidation.cleaned;
    
    // Duplicate words (warning only)
    const duplicateValidation = validateNoDuplicateWords(transactionData.description);
    if (!duplicateValidation.isValid) {
        errors.duplicateWords = duplicateValidation.message; // Warning, not error
    }
    
    // Money pattern
    const moneyValidation = validateMoneyPattern(transactionData.amount);
    if (moneyValidation.message) {
        errors.moneyPattern = moneyValidation.message; // Info only
    }
    
    return {
        isValid: Object.keys(errors).filter(k => !k.includes('duplicateWords') && !k.includes('moneyPattern')).length === 0,
        errors: errors,
        cleanedData: cleanedData
    };
}

// Real-time form field validation
function validateField(fieldName, value) {
    switch (fieldName) {
        case 'description':
            const descResult = validateDescription(value);
            const duplicateResult = validateNoDuplicateWords(value);
            return {
                isValid: descResult.isValid,
                message: descResult.message || duplicateResult.message,
                isWarning: !!duplicateResult.message && descResult.isValid
            };
            
        case 'amount':
            const amountResult = validateAmount(value);
            const moneyResult = validateMoneyPattern(value);
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
        const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
        
        if (!data || typeof data !== 'object') {
            return { isValid: false, error: 'Invalid data format' };
        }
        
        // Validate transactions array
        if (data.transactions && !Array.isArray(data.transactions)) {
            return { isValid: false, error: 'Transactions must be an array' };
        }
        
        // Validate each transaction
        if (data.transactions) {
            for (let i = 0; i < data.transactions.length; i++) {
                const transaction = data.transactions[i];
                const validation = validateTransaction(transaction);
                if (!validation.isValid) {
                    return { 
                        isValid: false, 
                        error: `Transaction ${i + 1} is invalid: ${Object.values(validation.errors).join(', ')}` 
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
    
    const regex = compileRegex(pattern, 'i');
    return {
        isValid: regex !== null,
        regex: regex,
        message: regex ? '' : 'Invalid search pattern'
    };
}

// Initialize validators
function initializeValidators() {
    console.log('Validators module initialized');
    
    // Test the validators 
    if (console && console.log) {
        console.log('Testing validators...');
        
        // Test cases
        const testCases = [
            { desc: '  hello  ', expected: false },
            { desc: 'hello world', expected: true },
            { desc: 'coffee coffee', expected: true }, // Warning for duplicates
            { amount: '12.5', expected: true },
            { amount: '12.555', expected: false },
            { category: 'Food & Drink', expected: true },
            { category: 'Food123', expected: false },
            { date: '2024-01-15', expected: true },
            { date: '2024-13-45', expected: false }
        ];
        
        testCases.forEach((test, index) => {
            if (test.desc) {
                const result = validateDescription(test.desc);
                console.log(`Test ${index + 1}: "${test.desc}" -> ${result.isValid} (expected: ${test.expected})`);
            }
        });
    }
}

// Make validators available globally
window.validators = {
    compileRegex,
    validateDescription,
    validateAmount,
    validateDate,
    validateCategory,
    validateNoDuplicateWords,
    validateMoneyPattern,
    validateTransaction,
    validateField,
    validateImportedData,
    validateSearchPattern,
    initializeValidators
};