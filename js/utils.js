export const qs = (sel, el = document) => el.querySelector(sel);
export const qsa = (sel, el = document) => [...el.querySelectorAll(sel)];

export const DATA_BASE = './data';

export const DATE_FORMATTER = new Intl.DateTimeFormat('pl-PL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
});

export const PLN = (n) =>
    new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(n);

export const escapeHtml = (str = '') =>
    String(str).replace(/[&<>"']/g, (s) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[s]));

export const escapeAttr = escapeHtml;

export const fetchJSON = async (path) => {
    const res = await fetch(`${DATA_BASE}/${path}`);
    if (!res.ok) throw new Error(`Błąd pobierania ${path}: ${res.status}`);
    return res.json();
};
