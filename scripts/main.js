// Initialize the entire application
function initializeApp() {
    console.log('Initializing Student Finance Tracker...');
    
    // Initialize all modules (will create these next)
    initializeStorage();
    initializeState();
    initializeUI();
    initializeValidators();
    initializeSearch();
    
    // Set up navigation
    setupNavigation();
    
    // Load initial data and show dashboard
    loadInitialData();
    
    console.log('App initialized successfully!');
}

// Handle section navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const hamburger = document.querySelector('.hamburger');
    const sidebar = document.querySelector('.sidebar');
    
    // Handle nav link clicks
    navLinks.forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            var sectionName = link.getAttribute('data-section');
            showSection(sectionName);
            
            // Update active nav state
            updateActiveNav(link);
            
            // Close mobile sidebar after click
            if (window.innerWidth < 1024) {
                sidebar.classList.remove('active');
            }
        });
    });
    
    // Handle hamburger menu
    hamburger.addEventListener('click', function() {
        sidebar.classList.toggle('active');
        var isExpanded = sidebar.classList.contains('active');
        hamburger.setAttribute('aria-expanded', isExpanded);
    });
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
        if (window.innerWidth < 1024 && 
            sidebar.classList.contains('active') &&
            !sidebar.contains(e.target) && 
            !hamburger.contains(e.target)) {
            sidebar.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
        }
    });
}

// Show specific section and hide others
function showSection(sectionName) {
    // Hide all sections
    var allSections = document.querySelectorAll('.content-section');
    allSections.forEach(function(section) {
        section.classList.remove('active');
    });
    
    // Show the target section
    var targetSection = document.getElementById(sectionName + '-section');
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update URL hash for deep linking
    window.location.hash = sectionName;
}

// Update active navigation state
function updateActiveNav(activeLink) {
    var allNavLinks = document.querySelectorAll('.nav-link');
    allNavLinks.forEach(function(link) {
        link.classList.remove('active');
    });
    activeLink.classList.add('active');
}

// Load initial data and show dashboard
function loadInitialData() {
    // Show dashboard by default
    showSection('dashboard');
    
    // Set first nav link as active
    var firstNavLink = document.querySelector('.nav-link');
    if (firstNavLink) {
        updateActiveNav(firstNavLink);
    }
}

// Handle page load
document.addEventListener('DOMContentLoaded', initializeApp);

// Handle hash changes for deep linking
window.addEventListener('hashchange', function() {
    var hash = window.location.hash.substring(1);
    var sectionName = hash || 'dashboard';
    showSection(sectionName);
});

// Stub functions for modules we'll create next
function initializeStorage() {
    console.log('Storage module initialized');
    // Will implement in storage.js
}

function initializeState() {
    console.log('State module initialized');
    // Will implement in state.js
}

function initializeUI() {
    console.log('UI module initialized');
    // Will implement in ui.js
}

function initializeValidators() {
    console.log('Validators module initialized');
    // Will implement in validators.js
}

function initializeSearch() {
    console.log('Search module initialized');
    // Will implement in search.js
}