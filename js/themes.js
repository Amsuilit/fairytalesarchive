// js/themes.js
(function() {
    'use strict';

    // MASTER LIST OF THEMES
    window.THEME_CONFIG = {
        light:          { name: 'Light',         bg: '#ffffff', fg: '#000000' },
        dark:           { name: 'Dark',          bg: '#1a1a1a', fg: '#e0e0e0' },
        sepia:          { name: 'Sepia',         bg: '#f4ecd8', fg: '#5c4a3a' },
        forest:         { name: 'Forest',        bg: '#2c3e2c', fg: '#d0d9c0' },
        ocean:          { name: 'Ocean',         bg: '#003366', fg: '#cce6ff' },
        highcontrast:   { name: 'High Contrast', bg: '#000000', fg: '#ffff00' },
        vintage:        { name: 'Vintage',       bg: '#f2e6d8', fg: '#4f3a2b' },
        monochrome:     { name: 'Monochrome',    bg: '#eeeeee', fg: '#222222' },
        dracula:        { name: 'Dracula',       bg: '#282a36', fg: '#f8f8f2' },
        solarizedlight: { name: 'Solarized L.',  bg: '#fdf6e3', fg: '#657b83' },
        solarizeddark:  { name: 'Solarized D.',  bg: '#002b36', fg: '#839496' },
        cyberpunk:      { name: 'Cyberpunk',     bg: '#0f0f1b', fg: '#00ffcc' }
    };

    window.setTheme = function(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);

        // Auto-fix: Update all theme dropdowns on the page to show the correct selection
        document.querySelectorAll('.theme-select-dropdown').forEach(select => {
            select.value = theme;
        });

        // Tell the ePub reader to update its inner colors
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    };

    window.loadTheme = function() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
    };

    // Auto-fix: This function finds empty <select> menus and builds the options dynamically
    window.generateThemeDropdowns = function() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        
        document.querySelectorAll('.theme-select-dropdown').forEach(select => {
            select.innerHTML = ''; // Clear just in case
            
            Object.keys(window.THEME_CONFIG).forEach(themeId => {
                const config = window.THEME_CONFIG[themeId];
                const opt = document.createElement('option');
                opt.value = themeId;
                opt.textContent = config.name;
                select.appendChild(opt);
            });
            
            select.value = savedTheme;
            select.onchange = (e) => window.setTheme(e.target.value);
        });
    };

    // Initialization Function
    function initThemes() {
        window.loadTheme();
        window.generateThemeDropdowns();
    }

    // Bulletproof trigger: checks if the page is already loaded before waiting for the event
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initThemes);
    } else {
        initThemes();
    }

})();
