// js/themes.js

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    // Update active button states if they exist in this page
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase() === theme);
    });
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    document.querySelectorAll('.theme-btn').forEach(btn => {
        const btnTheme = btn.textContent.toLowerCase();
        btn.classList.toggle('active', btnTheme === savedTheme);
    });
}

// Run when DOM is ready
document.addEventListener('DOMContentLoaded', loadTheme);
