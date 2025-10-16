// scripts/main.js - WORKING Hamburger Menu

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
    
    // ADD THIS LINE - Set up theme and preferences
    setupThemeAndPreferences();
    
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

// ===== THEME AND PREFERENCES FUNCTIONALITY =====
function setupThemeAndPreferences() {
    console.log('Setting up theme and preferences...');
    setupThemeSwitching();
    setupFontSizeSwitching();
    setupOtherPreferences();
    setupSaveSettingsButton();
    loadSavedPreferences();
}

// Theme switching functionality
function setupThemeSwitching() {
    const themeSelector = document.getElementById('color-theme');
    
    if (themeSelector) {
        // Apply theme when selector changes
        themeSelector.addEventListener('change', function() {
            applyTheme(this.value);
        });
    }
}

// Font size switching functionality
function setupFontSizeSwitching() {
    const fontSizeSelector = document.getElementById('text-size');
    
    if (fontSizeSelector) {
        // Apply when selector changes
        fontSizeSelector.addEventListener('change', function() {
            applyFontSize(this.value);
        });
    }
}

// Other preferences setup
function setupOtherPreferences() {
    // These will be handled by the save button
    const dateStyleSelector = document.getElementById('date-style');
    const moneyStyleSelector = document.getElementById('money-style');
    const currencySelector = document.getElementById('main-currency');
    
    // Add change listeners if needed
    if (dateStyleSelector) {
        dateStyleSelector.addEventListener('change', function() {
            // You can add real-time date format updates here if needed
        });
    }
}

// Save settings button functionality
function setupSaveSettingsButton() {
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', function() {
            saveAllPreferences();
            showStatus('All settings saved successfully!', 'success');
        });
    }
}

// Load all saved preferences
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

// Save all preferences to localStorage
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

// Apply theme to the document
function applyTheme(themeName) {
    console.log('Applying theme:', themeName);
    
    // Remove all theme classes
    document.body.classList.remove('theme-green', 'theme-purple', 'theme-dark');
    
    // Add the selected theme class (except for default)
    if (themeName !== 'default') {
        document.body.classList.add(`theme-${themeName}`);
    }
}

// Apply font size to the document
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
// ===== END THEME AND PREFERENCES FUNCTIONALITY =====

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
}

// Handle page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DOM LOADED ===');
    startApplication();
});