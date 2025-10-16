// scripts/main.js - Complete Vanilla JavaScript

// Initialize the entire application
function initializeApp() {
    console.log('🚀 Initializing Student Finance Tracker...');
    
    // Set up navigation
    setupNavigation();
    
    // Load initial data and show dashboard
    loadInitialData();
    
    console.log('✅ App initialized successfully!');
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
            const targetId = link.getAttribute('href');
            
            if (targetId) {
                const sectionName = targetId.substring(1); // Remove #
                showSection(sectionName);
                
                // Update active nav state
                updateActiveNav(link);
                
                // Close mobile sidebar after click
                if (window.innerWidth < 1024) {
                    sidebar.classList.remove('active');
                }
            }
        });
    });
    
    // Handle hamburger menu
    hamburger.addEventListener('click', function() {
        sidebar.classList.toggle('active');
        const isExpanded = sidebar.classList.contains('active');
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
function showSection(sectionId) {
    // Hide all sections
    const allSections = document.querySelectorAll('.content-section');
    allSections.forEach(function(section) {
        section.classList.remove('active');
    });
    
    // Show the target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

// Update active navigation state
function updateActiveNav(activeLink) {
    const allNavLinks = document.querySelectorAll('.nav-link');
    allNavLinks.forEach(function(link) {
        link.classList.remove('active');
    });
    activeLink.classList.add('active');
}

// Load initial data and show dashboard
function loadInitialData() {
    // Show dashboard by default
    showSection('dashboard');
    
    // Set dashboard nav link as active
    const dashboardLink = document.querySelector('a[href="#dashboard"]');
    if (dashboardLink) {
        updateActiveNav(dashboardLink);
    }
}

// Handle page load
document.addEventListener('DOMContentLoaded', initializeApp);

// Handle hash changes for deep linking
window.addEventListener('hashchange', function() {
    const hash = window.location.hash.substring(1);
    const sectionName = hash || 'dashboard';
    showSection(sectionName);
});