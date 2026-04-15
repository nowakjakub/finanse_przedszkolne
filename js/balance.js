import { qs, PLN } from './utils.js';

export function renderBalance(fromCollections, otherIncome, expenses) {
    qs('#balance-summary').textContent = PLN(fromCollections + otherIncome - expenses);

    const breakdown = qs('#balance-breakdown');
    breakdown.innerHTML = '';
    breakdown.insertAdjacentHTML('beforeend', `<li>Wpłaty ze zbiórek: <strong>${PLN(fromCollections)}</strong></li>`);
    if (otherIncome !== 0) {
        breakdown.insertAdjacentHTML('beforeend', `<li>Inne wpływy: <strong>${PLN(otherIncome)}</strong></li>`);
    }
    breakdown.insertAdjacentHTML('beforeend', `<li>Wydatki łącznie: <strong>− ${PLN(expenses)}</strong></li>`);
}
