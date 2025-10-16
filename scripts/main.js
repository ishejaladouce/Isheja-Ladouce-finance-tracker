// Initialize the entire application
function startApplication() {
    console.log('Starting Money Tracker Application...');
    
    // Set up hamburger menu FIRST
    setupHamburgerMenu();
    
    // Then initialize other modules
    if (window.storage && window.storage.initializeStorageSystem) {
        window.storage.initializeStorageSystem();
        loadSampleDataAndContinue();
    } else {
        continueAppStartup();
    }
}

// Load sample data then continue startup
function loadSampleDataAndContinue() {
    if (window.storage && window.storage.loadSampleDataFromFile) {
        window.storage.loadSampleDataFromFile().then(function(samplesLoaded) {
            continueAppStartup();
        }).catch(function(error) {
            continueAppStartup();
        });
    } else {
        continueAppStartup();
    }
}

// Continue with the rest of app startup
function continueAppStartup() {
    if (window.state && window.state.initializeAppState) {
        window.state.initializeAppState();
    }
    
    if (window.validators && window.validators.initializeInputValidators) {
        window.validators.initializeInputValidators();
    }
    
    if (window.search && window.search.initializeSearchSystem) {
        window.search.initializeSearchSystem();
    }
    
    if (window.ui && window.ui.initializeUserInterface) {
        window.ui.initializeUserInterface();
    }
    
    // Set up navigation
    setupPageNavigation();
    
    // Set up theme and preferences
    setupThemeAndPreferences();
    
    // Initialize spending limit
    initializeSpendingLimit();
    
    loadStartingData();
    
    console.log('Application started successfully');
}

// HAMBURGER MENU - FIXED CLICK EVENT
function setupHamburgerMenu() {
    console.log('Setting up hamburger menu...');
    
    const menuToggle = document.querySelector('.menu-toggle');
    const sideMenu = document.querySelector('.side-menu');
    
    console.log('Found elements:', {
        menuToggle: menuToggle,
        sideMenu: sideMenu
    });

    if (menuToggle && sideMenu) {
        // CLICK EVENT - FIXED
        menuToggle.addEventListener('click', function(event) {
            console.log('=== HAMBURGER CLICKED ===');
            event.preventDefault();
            event.stopPropagation();
            
            // Toggle the menu
            sideMenu.classList.toggle('active');
            const isOpen = sideMenu.classList.contains('active');
            menuToggle.setAttribute('aria-expanded', isOpen);
            
            console.log('Menu state:', isOpen ? 'OPEN' : 'CLOSED');
            console.log('Sidebar classList:', sideMenu.classList);
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (sideMenu.classList.contains('active') && 
                !sideMenu.contains(event.target) && 
                event.target !== menuToggle) {
                console.log('Closing menu - clicked outside');
                sideMenu.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
            }
        });

        // Close on escape key
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && sideMenu.classList.contains('active')) {
                sideMenu.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
            }
        });
        
        console.log('Hamburger event listeners added successfully');
    } else {
        console.error('Hamburger menu elements not found!');
    }
}

// SPENDING LIMIT FUNCTIONALITY 
function initializeSpendingLimit() {
    console.log('Initializing spending limit...');
    loadSpendingLimit();
    setupSpendingLimitListeners();
}

function loadSpendingLimit() {
    const spendingLimitInput = document.getElementById('spending-limit');
    
    if (spendingLimitInput) {
        let savedLimit = 0;
        
        // Try to get from storage system first
        if (window.storage && window.storage.loadAllData) {
            const data = window.storage.loadAllData();
            savedLimit = parseFloat(data.settings.spendingLimit) || 0;
            console.log('Loaded spending limit from storage system:', savedLimit);
        } else {
            // Fallback to localStorage
            savedLimit = parseFloat(localStorage.getItem('moneyTracker-spendingLimit')) || 0;
            console.log('Loaded spending limit from localStorage:', savedLimit);
        }
        
        if (savedLimit > 0) {
            spendingLimitInput.value = savedLimit.toFixed(2);
        }
    }
}

function setupSpendingLimitListeners() {
    const spendingLimitInput = document.getElementById('spending-limit');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    
    if (spendingLimitInput) {
        spendingLimitInput.addEventListener('change', function() {
            saveSpendingLimit();
        });
        
        spendingLimitInput.addEventListener('blur', function() {
            if (this.value) {
                saveSpendingLimit();
            }
        });
    }
    
    if (saveSettingsBtn) {
        // Save spending limit when settings are saved
        const originalOnClick = saveSettingsBtn.onclick;
        saveSettingsBtn.onclick = function() {
            saveSpendingLimit();
            if (originalOnClick) {
                originalOnClick();
            }
        };
    }
}

function saveSpendingLimit() {
    const spendingLimitInput = document.getElementById('spending-limit');
    if (spendingLimitInput && spendingLimitInput.value) {
        const limit = parseFloat(spendingLimitInput.value);
        if (!isNaN(limit) && limit > 0) {
            // Save to localStorage for quick access
            localStorage.setItem('moneyTracker-spendingLimit', limit);
            
            // Also save to storage system
            if (window.storage && window.storage.loadAllData && window.storage.saveAllData) {
                const data = window.storage.loadAllData();
                data.settings.spendingLimit = limit;
                window.storage.saveAllData(data);
                console.log('Spending limit saved to storage system:', limit);
            }
            
            updateBudgetDisplay();
            showStatus('Spending limit saved successfully!', 'success');
            return true;
        }
    }
    return false;
}

function calculateCurrentMonthSpending() {
    try {
        // Use storage system to get transactions
        let transactions = [];
        
        if (window.storage && window.storage.getTransactions) {
            transactions = window.storage.getTransactions();
            console.log('Got transactions from storage system:', transactions.length);
        } else {
            // Fallback: try to get from localStorage directly
            const storedData = localStorage.getItem('moneyTrackerData');
            if (storedData) {
                const data = JSON.parse(storedData);
                transactions = data.transactions || [];
                console.log('Got transactions from localStorage:', transactions.length);
            }
        }
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        let total = 0;
        
        transactions.forEach(transaction => {
            try {
                if (transaction.date && transaction.amount) {
                    const transactionDate = new Date(transaction.date);
                    
                    // Check if date is valid and from current month/year
                    if (!isNaN(transactionDate.getTime()) &&
                        transactionDate.getMonth() === currentMonth && 
                        transactionDate.getFullYear() === currentYear) {
                        
                        const amount = parseFloat(transaction.amount);
                        if (!isNaN(amount) && amount > 0) {
                            total += amount;
                        }
                    }
                }
            } catch (error) {
                console.log('Error processing transaction:', transaction, error);
            }
        });
        
        console.log('Total monthly spending calculated:', total);
        return total;
        
    } catch (error) {
        console.error('Error calculating monthly spending:', error);
        return 0;
    }
}

function updateBudgetDisplay() {
    const budgetStatusElement = document.getElementById('budget-status');
    if (!budgetStatusElement) return;
    
    let spendingLimit = 0;
    
    // Try to get spending limit from multiple sources
    if (window.storage && window.storage.loadAllData) {
        const data = window.storage.loadAllData();
        spendingLimit = parseFloat(data.settings.spendingLimit) || 0;
    } else {
        // Fallback to localStorage
        spendingLimit = parseFloat(localStorage.getItem('moneyTracker-spendingLimit')) || 0;
    }
    
    console.log('=== BUDGET CALCULATION ===');
    console.log('Spending limit:', spendingLimit);
    
    if (spendingLimit > 0) {
        const currentMonthTotal = calculateCurrentMonthSpending();
        const remaining = spendingLimit - currentMonthTotal;
        const percentage = (currentMonthTotal / spendingLimit) * 100;
        
        console.log('Current month total:', currentMonthTotal);
        console.log('Remaining:', remaining);
        console.log('Percentage:', percentage);
        
        let statusText = '';
        
        if (remaining >= 0) {
            statusText = `$${remaining.toFixed(2)} left (${percentage.toFixed(1)}% used)`;
            budgetStatusElement.style.color = percentage > 80 ? '#d97706' : '#059669';
        } else {
            statusText = `Over budget by $${Math.abs(remaining).toFixed(2)}`;
            budgetStatusElement.style.color = '#dc2626';
            budgetStatusElement.style.fontWeight = 'bold';
        }
        
        budgetStatusElement.textContent = statusText;
    } else {
        budgetStatusElement.textContent = 'No limit set';
        budgetStatusElement.style.color = '';
        budgetStatusElement.style.fontWeight = '';
    }
}

// Call this whenever transactions change
function refreshBudgetStatus() {
    updateBudgetDisplay();
}

//THEME AND PREFERENCES FUNCTIONALITy
function setupThemeAndPreferences() {
    console.log('Setting up theme and preferences...');
    setupThemeSwitching();
    setupFontSizeSwitching();
    setupOtherPreferences();
    setupSaveSettingsButton();
    loadSavedPreferences();
}

function setupThemeSwitching() {
    const themeSelector = document.getElementById('color-theme');
    
    if (themeSelector) {
        themeSelector.addEventListener('change', function() {
            applyTheme(this.value);
        });
    }
}

function setupFontSizeSwitching() {
    const fontSizeSelector = document.getElementById('text-size');
    
    if (fontSizeSelector) {
        fontSizeSelector.addEventListener('change', function() {
            applyFontSize(this.value);
        });
    }
}

function setupOtherPreferences() {
    const dateStyleSelector = document.getElementById('date-style');
    const moneyStyleSelector = document.getElementById('money-style');
    const currencySelector = document.getElementById('main-currency');
    
    if (dateStyleSelector) {
        dateStyleSelector.addEventListener('change', function() {
            
        });
    }
}

function setupSaveSettingsButton() {
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', function() {
            saveAllPreferences();
            showStatus('All settings saved successfully!', 'success');
        });
    }
}

function loadSavedPreferences() {
    // Load and apply theme
    const savedTheme = localStorage.getItem('moneyTracker-theme') || 'default';
    const themeSelector = document.getElementById('color-theme');
    if (themeSelector) {
        themeSelector.value = savedTheme;
    }
    applyTheme(savedTheme);
    
    // Load and apply font size
    const savedFontSize = localStorage.getItem('moneyTracker-fontSize') || 'medium';
    const fontSizeSelector = document.getElementById('text-size');
    if (fontSizeSelector) {
        fontSizeSelector.value = savedFontSize;
    }
    applyFontSize(savedFontSize);
    
    // Load other preferences
    const savedDateStyle = localStorage.getItem('moneyTracker-dateStyle') || 'yyyy-mm-dd';
    const savedMoneyStyle = localStorage.getItem('moneyTracker-moneyStyle') || 'symbol';
    const savedCurrency = localStorage.getItem('moneyTracker-currency') || 'USD';
    
    const dateStyleSelector = document.getElementById('date-style');
    const moneyStyleSelector = document.getElementById('money-style');
    const currencySelector = document.getElementById('main-currency');
    
    if (dateStyleSelector) dateStyleSelector.value = savedDateStyle;
    if (moneyStyleSelector) moneyStyleSelector.value = savedMoneyStyle;
    if (currencySelector) currencySelector.value = savedCurrency;
    
    console.log('Preferences loaded:', {
        theme: savedTheme,
        fontSize: savedFontSize,
        dateStyle: savedDateStyle,
        moneyStyle: savedMoneyStyle,
        currency: savedCurrency
    });
}

function saveAllPreferences() {
    const themeSelector = document.getElementById('color-theme');
    const fontSizeSelector = document.getElementById('text-size');
    const dateStyleSelector = document.getElementById('date-style');
    const moneyStyleSelector = document.getElementById('money-style');
    const currencySelector = document.getElementById('main-currency');
    
    if (themeSelector) {
        localStorage.setItem('moneyTracker-theme', themeSelector.value);
        applyTheme(themeSelector.value);
    }
    
    if (fontSizeSelector) {
        localStorage.setItem('moneyTracker-fontSize', fontSizeSelector.value);
        applyFontSize(fontSizeSelector.value);
    }
    
    if (dateStyleSelector) {
        localStorage.setItem('moneyTracker-dateStyle', dateStyleSelector.value);
    }
    
    if (moneyStyleSelector) {
        localStorage.setItem('moneyTracker-moneyStyle', moneyStyleSelector.value);
    }
    
    if (currencySelector) {
        localStorage.setItem('moneyTracker-currency', currencySelector.value);
    }
    
    console.log('All preferences saved to localStorage');
}

function applyTheme(themeName) {
    console.log('Applying theme:', themeName);
    
    // Remove all theme classes
    document.body.classList.remove('theme-green', 'theme-purple', 'theme-dark');
    
    // Add the selected theme class (except for default)
    if (themeName !== 'default') {
        document.body.classList.add(`theme-${themeName}`);
    }
}

function applyFontSize(size) {
    document.body.classList.remove('font-small', 'font-medium', 'font-large');
    document.body.classList.add(`font-${size}`);
}

// Status message function
function showStatus(message, type = 'success') {
    const statusElement = document.getElementById('status-message');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = `status-message ${type}`;
        
        setTimeout(() => {
            statusElement.textContent = '';
            statusElement.className = 'status-message';
        }, 3000);
    }
}

// Handle navigation between pages
function setupPageNavigation() {
    const menuLinks = document.querySelectorAll('.menu-link');
    const sideMenu = document.querySelector('.side-menu');
    const menuToggle = document.querySelector('.menu-toggle');

    menuLinks.forEach(function(link) {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const targetPage = link.getAttribute('href');
            
            if (targetPage) {
                const pageName = targetPage.substring(1);
                showPage(pageName);
                
                // Update budget display when showing dashboard
                if (pageName === 'dashboard') {
                    updateBudgetDisplay();
                }
                
                // Close mobile menu after click
                if (window.innerWidth < 1024 && sideMenu && menuToggle) {
                    sideMenu.classList.remove('active');
                    menuToggle.setAttribute('aria-expanded', 'false');
                }
            }
        });
    });
}

// Show specific page and hide others
function showPage(pageId) {
    // Hide all pages
    const allPages = document.querySelectorAll('.content-panel');
    allPages.forEach(function(page) {
        page.classList.remove('active');
    });
    
    // Show the target page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }
}

// Load initial data and show dashboard
function loadStartingData() {
    showPage('dashboard');
    updateBudgetDisplay(); // Initialize budget display
}

// Handle page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DOM LOADED ===');
    startApplication();
});

// Export the refresh function so other scripts can use it
window.refreshBudgetStatus = refreshBudgetStatus;