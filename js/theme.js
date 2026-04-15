import { qs } from './utils.js';

export function initTheme() {
    const root = document.documentElement;
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme ? savedTheme === 'dark' : prefersDark;
    if (shouldBeDark) root.classList.add('dark');

    const toggleBtn = qs('#theme-toggle');
    const update = () => {
        const isDark = root.classList.contains('dark');
        toggleBtn.textContent = (isDark ? '☀️' : '🌙') + ' Przełącz motyw';
    };
    update();
    toggleBtn.addEventListener('click', () => {
        root.classList.toggle('dark');
        localStorage.setItem('theme', root.classList.contains('dark') ? 'dark' : 'light');
        update();
    });
}
