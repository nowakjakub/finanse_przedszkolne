import { qs, PLN, escapeHtml, escapeAttr } from './utils.js';

export function renderExpenses(expensesWrap) {
    const tbody = qs('#expenses-body');
    const list = (expensesWrap?.expenses || [])
        .slice()
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    tbody.innerHTML = list.map((e) => {
        const link = e.receipt
            ? `<a href="${escapeAttr(e.receipt)}" target="_blank" rel="noopener">paragon</a>`
            : (e.receipt_note ? `<em>${escapeHtml(e.receipt_note)}</em>` : '—');
        return `<tr>
            <td>${escapeHtml(e.date || '')}</td>
            <td>${escapeHtml(e.what || '')}</td>
            <td>${PLN(Number(e.amount || 0))}</td>
            <td>${link}</td>
        </tr>`;
    }).join('');
}
