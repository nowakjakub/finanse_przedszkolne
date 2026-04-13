(() => {
    const qs = (sel, el = document) => el.querySelector(sel);
    const qsa = (sel, el = document) => [...el.querySelectorAll(sel)];

    // Utility selectors - szybszy dostęp do pojedynczych i wielu elementów DOM
    // Theme
    const root = document.documentElement;
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') root.classList.add('dark');
    const toggleBtn = qs('#theme-toggle');
    toggleBtn.textContent = root.classList.contains('dark') ? '☀️' : '🌙';
    toggleBtn.addEventListener('click', () => {
        root.classList.toggle('dark');
        const dark = root.classList.contains('dark');
        localStorage.setItem('theme', dark ? 'dark' : 'light');
        toggleBtn.textContent = dark ? '☀️' : '🌙';
    });

    // Stałe konfigurujące źródło danych i formatowanie
    const DATA_BASE = './data';
    const DATE_FORMATTER = new Intl.DateTimeFormat('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const PLN = (n) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(n);
    const TOTAL_CHILDREN_FALLBACK = 25;

    // Uniwersalna funkcja pobierająca dane JSON z katalogu data
    const fetchJSON = async (path) => {
        const res = await fetch(`${DATA_BASE}/${path}`);
        if (!res.ok) throw new Error(`Błąd pobierania ${path}: ${res.status}`);
        return res.json();
    };

    // Normalizacja listy wpłat: usuwanie duplikatów, sortowanie, filtrowanie nieprawidłowych numerów
    function normalizePaidList(rawPaid, totalChildren) {
        if (!rawPaid) return [];
        const items = Array.isArray(rawPaid)
            ? rawPaid
            : String(rawPaid).split(/[,;\s]+/).filter(Boolean);

        return Array.from(new Set(items.map((value) => Number(value))))
            .filter((n) => Number.isInteger(n) && n >= 1 && n <= totalChildren)
            .sort((a, b) => a - b);
    }

    // Przygotowanie obiektu zbiórki z wyliczeniami: ile opłacono, ile zebrano, ile osób jeszcze nie zapłaciło
    function normalizeCollection(col, totalChildren) {
        const paid = normalizePaidList(col.paid, totalChildren);
        const amount = Number(col.amountPerChild || 0);
        const paidCount = paid.length;
        const collected = paidCount * amount;
        const unpaidNumbers = Array.from({ length: totalChildren }, (_, i) => i + 1).filter((n) => !paid.includes(n));

        return {
            ...col,
            paid,
            amount,
            paidCount,
            unpaidCount: totalChildren - paidCount,
            collected,
            unpaidNumbers,
        };
    }

    // Render pojedynczej karty zbiórki z podstawowymi danymi dla rodziców
    function renderCollectionCard(c, totalChildren) {
        const pct = totalChildren ? Math.round((c.paidCount / totalChildren) * 100) : 0;
        const statusLabel = c.status === 'open'
            ? '<span class="badge ok">otwarta</span>'
            : '<span class="badge">zamknięta</span>';

        return `
            <div class="collection">
                <h3>${escapeHtml(c.name)} ${statusLabel}</h3>
                <div class="meta">Składka: <strong>${PLN(c.amount)}</strong> • Opłacone: <strong>${c.paidCount}/${totalChildren}</strong> (${pct}%) • Zebrano: <strong>${PLN(c.collected)}</strong></div>
            </div>`;
    }

    // Pokazujemy błąd w kilku sekcjach, kiedy coś się nie załaduje poprawnie
    function renderError(err) {
        qs('#balance-summary').textContent = 'Błąd ładowania danych.';
        qsa('.card').forEach((card) => card.insertAdjacentHTML('beforeend', `<p class="hint">${escapeHtml(String(err.message || err))}</p>`));
    }

    // Obsługa formularza wyszukiwania numeru dziecka oraz pokazanie zaległości
    function setupLookupForm(openCols, totalChildren) {
        const form = qs('#lookup-form');
        const result = qs('#lookup-result');

        form.addEventListener('submit', (ev) => {
            ev.preventDefault();
            const raw = new FormData(form).get('child-number');
            const n = Number(raw);

            if (!Number.isInteger(n) || n < 1 || n > totalChildren) {
                result.innerHTML = `<p class="badge due">Podaj numer od 1 do ${totalChildren}.</p>`;
                return;
            }

            const rows = openCols.map((c) => {
                const paid = c.paid.includes(n);
                return `<li>${escapeHtml(c.name)} — ${paid
                    ? '<span class="badge ok">✅ opłacono</span>'
                    : `<span class="badge due">❌ brak wpłaty (${PLN(c.amount)})</span>`
                    }</li>`;
            });

            const totalDue = openCols.reduce((sum, c) => sum + (c.paid.includes(n) ? 0 : c.amount), 0);
            result.innerHTML = `
                <p><strong>Numer ${n}</strong> — status w otwartych zbiórkach:</p>
                <ul class="list">${rows.join('')}</ul>
                <p class="sum">Razem zaległości: ${totalDue ? PLN(totalDue) : '<span class="badge ok">brak</span>'}</p>
            `;
        });
    }

    // Wyświetlanie podsumowania stanu konta i przejrzystego breakdownu
    function renderBalance(fromCollections, otherIncome, expenses) {
        qs('#balance-summary').textContent = PLN(fromCollections + otherIncome - expenses);
        const breakdown = qs('#balance-breakdown');
        breakdown.innerHTML = '';
        breakdown.insertAdjacentHTML('beforeend', `<li>Wpłaty ze zbiórek: <strong>${PLN(fromCollections)}</strong></li>`);
        breakdown.insertAdjacentHTML('beforeend', (otherIncome === 0 ? '' : `<li>Inne wpływy: <strong>${PLN(otherIncome)}</strong></li>`));
        breakdown.insertAdjacentHTML('beforeend', `<li>Wydatki łącznie: <strong>− ${PLN(expenses)}</strong></li>`);
    }

    function renderExpenses(expensesWrap) {
        const tbody = qs('#expenses-body');
        const expensesList = (expensesWrap?.expenses || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        tbody.innerHTML = expensesList.map((e) => {
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

    // Render listy wydarzeń: nadchodzące na górze, archiwum w rozwijanym panelu
    function renderEvents(eventsWrap, today) {
        const eventsList = qs('#events-list');
        const events = (eventsWrap?.events || []).slice().sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        const todayIso = today.toISOString().split('T')[0];

        const renderEvent = (e) => {
            const eventDate = new Date(e.date);
            const isAfter = e.date > todayIso;
            const diffTime = eventDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return `
                <div class="event${isAfter ? '' : ' past'}">
                    <h4>${escapeHtml(e.title || '')}</h4>
                    <div class="event-date">${escapeHtml(e.date || '')}</div>
                    ${e.description ? `<p>${escapeHtml(e.description)}</p>` : ''}
                    ${isAfter ? `<div class="countdown">${diffDays} ${diffDays === 1 ? 'dzień' : 'dni'} do wydarzenia</div>` : ''}
                </div>`;
        };

        const upcomingEvents = events.filter((e) => e.date > todayIso);
        const pastEvents = events.filter((e) => e.date <= todayIso);
        let html = '';

        if (upcomingEvents.length) {
            html += upcomingEvents.map(renderEvent).join('');
        } else {
            html += '<p>Brak zaplanowanych wydarzeń.</p>';
        }

        if (pastEvents.length) {
            html += `
                <details class="past-events">
                    <summary>Przeszłe wydarzenia</summary>
                    ${pastEvents.map(renderEvent).join('')}
                </details>`;
        }

        eventsList.innerHTML = html;
    }

    // Render listy ważnych informacji dla rodziców
    function renderInformation(informationWrap) {
        const content = qs('#information-content');
        const info = (informationWrap?.information || []).map((item) => `
            <div class="information-item">
                <h4>${escapeHtml(item.title || '')}</h4>
                <p>${escapeHtml(item.content || '')}</p>
            </div>`).join('');
        content.innerHTML = info || '<p>Brak informacji.</p>';
    }

    function renderBanking(banking) {
        const bankingBox = qs('#banking-data');
        const titleTemplate = banking?.transfer_title_template || 'Składka – nr {nr}';
        bankingBox.innerHTML = `
            <p><strong>Numer konta:</strong> <span class="copy" data-copy="${escapeAttr(banking?.account_number || '')}">${escapeHtml(banking?.account_number || '')}</span></p>
            <p><strong>BLIK:</strong> <span class="copy" data-copy="${escapeAttr(banking?.blik || '')}">${escapeHtml(banking?.blik || '')}</span></p>
            <p><strong>Revolut:</strong> <span class="copy" data-copy="${escapeAttr(banking?.revolut || '')}">${escapeHtml(banking?.revolut || '')}</span></p>
            <p><strong>Tytuł przelewu (przykład dla nr 8):</strong> <span class="copy" data-copy="${escapeAttr(titleTemplate.replace('{nr}', '8'))}">${escapeHtml(titleTemplate.replace('{nr}', '8'))}</span></p>
        `;

        bankingBox.addEventListener('click', (e) => {
            const el = e.target.closest('.copy');
            if (!el) return;
            const text = el.getAttribute('data-copy') || el.textContent || '';
            navigator.clipboard?.writeText(text).then(() => {
                el.style.opacity = .7;
                setTimeout(() => { el.style.opacity = 1; }, 400);
            });
        });
    }

    // Główna funkcja uruchamiana po załadowaniu strony
    // Ładuje dane, przygotowuje obiekty i wyświetla wszystkie sekcje w odpowiedniej kolejności
    async function init() {
        try {
            const [site, collectionsWrap, incomesWrap, expensesWrap, banking, eventsWrap, informationWrap] = await Promise.all([
                fetchJSON('site.json'),
                fetchJSON('collections.json'),
                fetchJSON('incomes.json'),
                fetchJSON('expenses.json'),
                fetchJSON('banking.json'),
                fetchJSON('events.json'),
                fetchJSON('information.json'),
            ]);

            const totalChildren = Number(site?.totalChildren ?? TOTAL_CHILDREN_FALLBACK);
            qs('#site-title').textContent = site?.title || 'Składki grupy';
            qs('#current-date').textContent = DATE_FORMATTER.format(new Date());

            const collections = (collectionsWrap?.collections || []).map((col) => normalizeCollection(col, totalChildren));
            const openCols = collections.filter((c) => (c.status || 'open') === 'open');
            const closedCols = collections.filter((c) => (c.status || 'open') !== 'open');
            const fromCollections = collections.reduce((sum, c) => sum + c.collected, 0);
            const otherIncome = (incomesWrap?.incomes || []).reduce((sum, i) => sum + Number(i.amount || 0), 0);
            const expenses = (expensesWrap?.expenses || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);

            renderBalance(fromCollections, otherIncome, expenses);
            qs('#current-list').innerHTML = openCols.length ? openCols.map((c) => renderCollectionCard(c, totalChildren)).join('') : '<p>Brak otwartych zbiórek.</p>';
            qs('#past-list').innerHTML = closedCols.length ? closedCols.map((c) => renderCollectionCard(c, totalChildren)).join('') : '<p>Brak zamkniętych zbiórek.</p>';
            renderExpenses(expensesWrap);
            renderEvents(eventsWrap, new Date());
            renderInformation(informationWrap);
            renderBanking(banking);
            setupLookupForm(openCols, totalChildren);
        } catch (err) {
            console.error(err);
            renderError(err);
        }
    }

    // Proste zabezpieczenie przed wstrzyknięciem HTML w danych
    function escapeHtml(str = '') {
        return String(str).replace(/[&<>"']/g, (s) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[s]));
    }

    function escapeAttr(str = '') { return escapeHtml(str); }

    document.addEventListener('DOMContentLoaded', init);
})();
