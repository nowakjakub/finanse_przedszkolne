(() => {
    const qs = (sel, el = document) => el.querySelector(sel);
    const qsa = (sel, el = document) => [...el.querySelectorAll(sel)];

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

    // Config
    const DATA_BASE = './data';

    const fetchJSON = async (path) => {
        const res = await fetch(`${DATA_BASE}/${path}`);
        if (!res.ok) throw new Error(`Błąd pobierania ${path}: ${res.status}`);
        return res.json();
    };

    const PLN = (n) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(n);

    const TOTAL_CHILDREN_FALLBACK = 25; // dla bezpieczeństwa, ale zwykle przyjdzie z site.json

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

            // Render current date
            const today = new Date();
            const dateFormatter = new Intl.DateTimeFormat('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            qs('#current-date').textContent = dateFormatter.format(today);

            // Prepare collections derived data
            const collections = (collectionsWrap?.collections || []).map(col => {
                const paid = Array.from(new Set((col.paid || []).map(n => Number(n)))).filter(n => Number.isInteger(n) && n >= 1 && n <= totalChildren).sort((a, b) => a - b);
                const amount = Number(col.amountPerChild || 0);
                const paidCount = paid.length;
                const unpaidCount = totalChildren - paidCount;
                const collected = paidCount * amount;
                const unpaidNumbers = Array.from({ length: totalChildren }, (_, i) => i + 1).filter(n => !paid.includes(n));
                return { ...col, paid, amount, paidCount, unpaidCount, collected, unpaidNumbers };
            });

            // Split open/past
            const openCols = collections.filter(c => (c.status || 'open') === 'open');
            const closedCols = collections.filter(c => (c.status || 'open') !== 'open');

            // Totals
            const fromCollections = collections.reduce((sum, c) => sum + c.collected, 0);
            const otherIncome = (incomesWrap?.incomes || []).reduce((s, i) => s + Number(i.amount || 0), 0);
            const expenses = (expensesWrap?.expenses || []).reduce((s, e) => s + Number(e.amount || 0), 0);
            const balance = fromCollections + otherIncome - expenses;

            // Render balance
            qs('#balance-summary').textContent = PLN(balance);
            const breakdown = qs('#balance-breakdown');
            breakdown.innerHTML = '';
            breakdown.insertAdjacentHTML('beforeend', `<li>Wpłaty ze zbiórek: <strong>${PLN(fromCollections)}</strong></li>`);
            (incomesWrap?.incomes || []).forEach(i => breakdown.insertAdjacentHTML('beforeend', `<li>Inne wpływy – ${escapeHtml(i.source || 'Inne')}: <strong>${PLN(Number(i.amount || 0))}</strong></li>`));
            breakdown.insertAdjacentHTML('beforeend', `<li>Wydatki łącznie: <strong>− ${PLN(expenses)}</strong></li>`);

            // Render collections
            const renderCollection = (c) => {
                const pct = totalChildren ? Math.round((c.paidCount / totalChildren) * 100) : 0;
                return `
          <div class="collection">
            <h3>${escapeHtml(c.name)} ${c.status === 'open' ? '<span class="badge ok">otwarta</span>' : '<span class="badge">zamknięta</span>'}</h3>
            <div class="meta">Składka: <strong>${PLN(c.amount)}</strong> • Opłacone: <strong>${c.paidCount}/${totalChildren}</strong> (${pct}%) • Zebrano: <strong>${PLN(c.collected)}</strong></div>
          </div>`;
            };

            const currentList = qs('#current-list');
            currentList.innerHTML = openCols.length ? openCols.map(renderCollection).join('') : '<p>Brak otwartych zbiórek.</p>';

            const pastList = qs('#past-list');
            pastList.innerHTML = closedCols.length ? closedCols.map(renderCollection).join('') : '<p>Brak zamkniętych zbiórek.</p>';

            // Render expenses newest first
            const tbody = qs('#expenses-body');
            const expensesList = (expensesWrap?.expenses || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
            tbody.innerHTML = expensesList.map(e => {
                const link = e.receipt ? `<a href="${escapeAttr(e.receipt)}" target="_blank" rel="noopener">paragon</a>` : (e.receipt_note ? `<em>${escapeHtml(e.receipt_note)}</em>` : '—');
                return `<tr>
          <td>${escapeHtml(e.date || '')}</td>
          <td>${escapeHtml(e.what || '')}</td>
          <td>${PLN(Number(e.amount || 0))}</td>
          <td>${link}</td>
        </tr>`;
            }).join('');

            // Render events
            const eventsList = qs('#events-list');
            const events = (eventsWrap?.events || []).slice().sort((a, b) => (a.date || '').localeCompare(b.date || ''));
            const today_iso = today.toISOString().split('T')[0];
            const renderEvent = (e) => {
                const eventDate = new Date(e.date);
                const isAfter = e.date > today_iso;
                const diffTime = eventDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const countdownText = isAfter ? `${diffDays} ${diffDays === 1 ? 'dzień' : 'dni'} do wydarzenia` : '';
                const className = isAfter ? 'event' : 'event past';
                return `
                  <div class="${className}">
                    <h4>${escapeHtml(e.title || '')}</h4>
                    <div class="event-date">${escapeHtml(e.date || '')}</div>
                    ${e.description ? `<p>${escapeHtml(e.description || '')}</p>` : ''}
                    ${isAfter ? `<div class="countdown">${countdownText}</div>` : ''}
                  </div>`;
            };
            eventsList.innerHTML = events.length ? events.map(renderEvent).join('') : '<p>Brak zaplanowanych wydarzeń.</p>';

            // Render information
            const informationContent = qs('#information-content');
            const informationItems = (informationWrap?.information || []);
            const renderInformationItem = (item) => {
                return `
              <div class="information-item">
                <h4>${escapeHtml(item.title || '')}</h4>
                <p>${escapeHtml(item.content || '')}</p>
              </div>`;
            };
            informationContent.innerHTML = informationItems.length ? informationItems.map(renderInformationItem).join('') : '<p>Brak informacji.</p>';

            // Banking data
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
                    el.style.opacity = .7; setTimeout(() => { el.style.opacity = 1; }, 400);
                });
            });

            // Lookup by child number (ignore closed)
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
                const rows = [];
                let totalDue = 0;
                openCols.forEach(c => {
                    const paid = c.paid.includes(n);
                    const due = paid ? 0 : c.amount;
                    totalDue += due;
                    rows.push(
                        `<li>${escapeHtml(c.name)} — ${paid
                            ? '<span class="badge ok">✅ opłacono</span>'
                            : `<span class="badge due">❌ brak wpłaty (${PLN(c.amount)})</span>`
                        }</li>`
                    );
                });
                result.innerHTML = `
          <p><strong>Numer ${n}</strong> — status w otwartych zbiórkach:</p>
          <ul class="list">${rows.join('')}</ul>
          <p class="sum">Razem zaległości: ${totalDue ? PLN(totalDue) : '<span class="badge ok">brak</span>'}</p>
        `;
            });

        } catch (err) {
            console.error(err);
            qs('#balance-summary').textContent = 'Błąd ładowania danych.';
            qsa('.card').forEach(c => c.insertAdjacentHTML('beforeend', `<p class="hint">${escapeHtml(String(err.message || err))}</p>`));
        }
    }

    // Helpers
    function escapeHtml(str = '') {
        return String(str).replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[s]));
    }
    function escapeAttr(str = '') { return escapeHtml(str); }

    document.addEventListener('DOMContentLoaded', init);
})();
