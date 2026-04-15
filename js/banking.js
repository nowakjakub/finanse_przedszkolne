import { qs, escapeHtml, escapeAttr } from './utils.js';

const TITLE_TEMPLATE = 'KACZUSZKI - Nazwa zbiórki - {nr}. imię i nazwisko DZIECKA';

export function renderBanking(banking) {
    const bankingBox = qs('#banking-data');
    bankingBox.innerHTML = `
        <p><strong>Numer konta:</strong> <span class="copy" data-copy="${escapeAttr(banking?.account_number || '')}">${escapeHtml(banking?.account_number || '')}</span></p>
        <p><strong>BLIK:</strong> <span class="copy" data-copy="${escapeAttr(banking?.blik || '')}">${escapeHtml(banking?.blik || '')}</span></p>
        <p><strong>Revolut:</strong> <span class="copy" data-copy="${escapeAttr(banking?.revolut || '')}">${escapeHtml(banking?.revolut || '')}</span></p>
        <p><strong>Tytuł przelewu (przykład dla nr 8):</strong> <span class="copy" data-copy="${escapeAttr(TITLE_TEMPLATE.replace('{nr}', '8'))}">${escapeHtml(TITLE_TEMPLATE.replace('{nr}', '8'))}</span></p>
    `;

    bankingBox.addEventListener('click', (e) => {
        const el = e.target.closest('.copy');
        if (!el) return;
        const text = el.getAttribute('data-copy') || el.textContent || '';
        navigator.clipboard?.writeText(text).then(() => {
            el.style.opacity = 0.7;
            setTimeout(() => { el.style.opacity = 1; }, 400);
        });
    });
}
