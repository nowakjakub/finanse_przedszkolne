import { qs, PLN, escapeHtml } from './utils.js';

export function setupLookupForm(openCols, totalChildren) {
    const form = qs('#lookup-form');
    const result = qs('#lookup-result');
    const select = qs('#child-number');

    select.innerHTML = Array.from({ length: totalChildren }, (_, i) => {
        const value = i + 1;
        return `<option value="${value}">${value}</option>`;
    }).join('');

    form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const n = Number(new FormData(form).get('child-number'));

        if (!Number.isInteger(n) || n < 1 || n > totalChildren) {
            result.innerHTML = `<p class="badge due">Wybierz numer od 1 do ${totalChildren}.</p>`;
            return;
        }

        const rows = openCols.map((c) => {
            const paid = c.paid.includes(n);
            return `<li>${escapeHtml(c.name)} — ${paid
                ? '<span class="badge ok">✅ Hurra! Opłacono</span>'
                : `<span class="badge due">⏰ Czas zapłacić: ${PLN(c.amount)}</span>`
            }</li>`;
        });

        const totalDue = openCols.reduce((sum, c) => sum + (c.paid.includes(n) ? 0 : c.amount), 0);
        result.innerHTML = `
            <p><strong>🎯 Status płatności dla numerka ${n}:</strong></p>
            <ul class="list">${rows.join('')}</ul>
            <p class="sum">${totalDue
                ? `💰 Do zapłaty zostało: ${PLN(totalDue)}`
                : '<span class="badge ok">🎉 Wszystko opłacone! Świetna robota!</span>'
            }</p>
        `;
    });
}
