import { qs, escapeHtml } from './utils.js';

const CLOSE_EVENT_THRESHOLD_DAYS = 5;

function renderEvent(e, todayIso, isClose) {
    const isAfter = e.date > todayIso;
    const diffDays = Math.ceil((new Date(e.date) - new Date(todayIso)) / (1000 * 60 * 60 * 24));
    return `
        <div class="event${isAfter ? '' : ' past'}${isClose ? ' close-event' : ''}">
            <h4>${escapeHtml(e.title || '')}</h4>
            <div class="event-date">${escapeHtml(e.date || '')}</div>
            ${e.description ? `<p>${escapeHtml(e.description)}</p>` : ''}
            ${isAfter ? `<div class="countdown">${diffDays} ${diffDays === 1 ? 'dzień' : 'dni'} do wydarzenia</div>` : ''}
        </div>`;
}

export function renderEvents(eventsWrap, today) {
    const eventsList = qs('#events-list');
    const todayIso = today.toISOString().split('T')[0];
    const events = (eventsWrap?.events || [])
        .slice()
        .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    const upcomingEvents = events.filter((e) => e.date > todayIso);
    const pastEvents = events.filter((e) => e.date <= todayIso);

    const closeEvents = upcomingEvents.filter((e) => {
        const diffDays = Math.ceil((new Date(e.date) - new Date(todayIso)) / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= CLOSE_EVENT_THRESHOLD_DAYS;
    });
    const closeEventDates = new Set(closeEvents.map((e) => e.date));

    if (closeEvents.length > 0) {
        const banner = qs('#event-banner');
        const eventList = closeEvents.map((e) => `${escapeHtml(e.title)} (${escapeHtml(e.date)})`).join('<br>');
        banner.innerHTML = `<strong>🦆 Nadchodzące wydarzenia 🦆<br>${eventList}</strong>`;
        banner.style.display = 'block';
    }

    let html = upcomingEvents.length
        ? upcomingEvents.map((e) => renderEvent(e, todayIso, closeEventDates.has(e.date))).join('')
        : '<p>Brak zaplanowanych wydarzeń.</p>';

    if (pastEvents.length) {
        html += `
            <details class="past-events">
                <summary>Co już nas spotkało?</summary>
                ${pastEvents.map((e) => renderEvent(e, todayIso, false)).join('')}
            </details>`;
    }

    eventsList.innerHTML = html;
}
