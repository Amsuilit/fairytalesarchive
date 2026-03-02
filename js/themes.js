// js/themes.js – shared theme switching logic
(function() {
    'use strict';

    window.setTheme = function(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);

        // Update active class on all theme buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            const btnTheme = btn.getAttribute('data-theme') || btn.textContent.toLowerCase();
            btn.classList.toggle('active', btnTheme === theme);
        });

        // Dispatch event so other scripts (like reader) can react
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    };

    window.loadTheme = function() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);

        document.querySelectorAll('.theme-btn').forEach(btn => {
            const btnTheme = btn.getAttribute('data-theme') || btn.textContent.toLowerCase();
            btn.classList.toggle('active', btnTheme === savedTheme);
        });
    };

    document.addEventListener('DOMContentLoaded', loadTheme);
})();