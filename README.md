# Student Finance Tracker - README

## Overview
A responsive, accessible web application for students to track expenses, manage budgets, and analyze spending patterns. Built with vanilla HTML, CSS, and JavaScript following mobile-first design principles.

## Features

### Core Functionality
- **Expense Tracking**: Add, edit, and delete transactions
- **Dashboard**: Real-time spending overview with charts
- **Smart Search**: Regex-powered search with highlighting
- **Responsive Design**: Mobile-first with hamburger navigation
- **Data Persistence**: localStorage with JSON import/export
- **Accessibility**: Full keyboard navigation & screen reader support

### Advanced Features
- **Monthly Budget System**: Set spending limits with visual indicators
- **Regex Validation**: 4+ validation rules including duplicate word detection
- **Sorting & Filtering**: Multiple sort options and category filters
- **Theme System**: Dark mode and customizable appearance

---

## Technical Implementation

### File Structure
```
project/
├── index.html
├── styles/
│   └── style.css
├── scripts/
│   ├── main.js          # App initialization & hamburger menu
│   ├── storage.js       # localStorage management
│   ├── state.js         # Application state management
│   ├── validators.js    # Regex validation system
│   ├── search.js        # Search & filtering
│   └── ui.js            # User interface handlers
├── assets/
│   └── tests.html       # Regex validation tests
├── seed.json            # Sample data
└── README.md
```

### Data Model
```javascript
{
  id: "item_1704038400000_abc123",
  description: "Lunch at cafeteria",
  amount: 12.50,
  category: "Food",
  date: "2024-01-15",
  createdAt: "2024-01-15T10:30:00.000Z",
  updatedAt: "2024-01-15T10:30:00.000Z"
}
```


## Regex Validation System

### 4 Core Validation Rules
1. **Description**: `^\S(?:.*\S)?$` - No leading/trailing spaces
2. **Amount**: `^(0|[1-9]\d*)(\.\d{1,2})?$` - Positive numbers, 2 decimal places
3. **Date**: `^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$` - YYYY-MM-DD format
4. **Category**: `^[A-Za-z]+(?:[ -][A-Za-z]+)*$` - Letters, spaces, hyphens only

### Advanced Regex Features
- **Duplicate Word Detection**: `\b(\w+)\s+\1\b` - Finds repeated words in descriptions
- **Money Format Check**: `\.\d{2}\b` - Ensures cents are included
- **Safe Pattern Compiler**: Try/catch protection for user search inputs


## Accessibility Features

### Keyboard Navigation
- **Tab** through all interactive elements
- **Enter/Space** to activate buttons
- **Escape** to close hamburger menu
- **Arrow keys** for form navigation

### Screen Reader Support
- **ARIA landmarks**: header, nav, main, footer
- **Live regions** for status updates
- **Skip link** for main content
- **Proper labels** and descriptions

### Visual Accessibility
- High contrast color scheme
- Focus indicators for all interactive elements
- Responsive text sizes
- Dark mode support

---

## Responsive Design

### Breakpoints
- **Mobile**: < 768px (hamburger menu, card layout)
- **Tablet**: 768px - 1023px (hybrid layout)
- **Desktop**: 1024px+ (full sidebar, table layout)

### Mobile-First Features
- Hamburger navigation on small screens
- Touch-friendly buttons and forms
- Optimized table → card transformation
- Responsive charts and summaries

---

## Data Management

### Storage System
- **localStorage** for automatic persistence
- **JSON import/export** with validation
- **Sample data** auto-loading on first visit
- **Data reset** with confirmation

### Settings Persistence
- Theme preferences
- Spending limits
- Display options
- Behavior settings

## Quick Start

### Setup
1. Clone the repository
2. Open `index.html` in a web browser
3. Start adding transactions!

### First Use
1. The app loads sample data automatically
2. Set your monthly spending limit in Settings
3. Add your own transactions using the form
4. Use search to find specific expenses

### Testing Regex Patterns
Open `assets/tests.html` to test all validation patterns and see examples.

### Keyboard Shortcuts
- `Tab` - Navigate through elements
- `Enter` - Activate buttons/submit forms
- `Escape` - Close menus/dialogs
- `Ctrl/Cmd + S` - Quick save (in forms)


## Development

### Module Architecture
- **main.js**: App initialization, hamburger menu
- **storage.js**: Data persistence layer
- **state.js**: Centralized state management
- **validators.js**: Input validation system
- **search.js**: Search and filtering logic
- **ui.js**: DOM manipulation and event handlers

### Adding New Features
1. Update data model in `storage.js`
2. Add state management in `state.js`
3. Create UI components in `ui.js`
4. Add validation rules in `validators.js`

### Testing
Open `assets/tests.html` to test regex validation patterns and see sample test cases.


## Demo Video
[https://www.loom.com/share/aad314089d7840e89f940061e7548740?sid=382ed5a3-5a7b-4bdb-aa00-5bd6075476ff]

