/**
 * Journey Viewer Component
 * Shows train route timeline with all stops and progress
 */

import { getTrainMovements } from '../api.js';
import { el, $, formatTime, getTodayFormatted, getTrainTypeInfo, showToast } from '../utils/helpers.js';

/**
 * Initialize journey viewer
 */
export function initJourneyViewer() {
    const closeBtn = $('#journeyClose');
    const overlay = $('#overlay');

    closeBtn.addEventListener('click', closeJourney);
    overlay.addEventListener('click', closeJourney);

    // Close on click outside (works on desktop where overlay is hidden)
    document.addEventListener('click', (e) => {
        const viewer = $('#journeyViewer');
        if (viewer.hidden) return;
        // If click is outside the journey viewer and not on a board row (which opens it)
        if (!e.target.closest('#journeyViewer') && !e.target.closest('.board-table__row') && !e.target.closest('.train-card')) {
            closeJourney();
        }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const viewer = $('#journeyViewer');
            if (!viewer.hidden) closeJourney();
        }
    });
}

/**
 * Load and display train journey
 * @param {Object} train - Train object from departure board
 */
export async function loadJourney(train) {
    const viewer = $('#journeyViewer');
    const overlay = $('#overlay');
    const journeyTitle = $('#journeyTitle');
    const journeyInfo = $('#journeyInfo');
    const journeyTimeline = $('#journeyTimeline');
    const journeySkeleton = $('#journeySkeleton');

    // Show viewer
    viewer.hidden = false;
    // Only show overlay on mobile/tablet (<=1024px)
    const isMobile = window.innerWidth <= 1024;
    if (isMobile) {
        overlay.hidden = false;
        requestAnimationFrame(() => {
            overlay.classList.add('overlay--visible');
            viewer.classList.add('journey-viewer--open');
        });
    } else {
        overlay.hidden = true;
        viewer.classList.add('journey-viewer--open');
    }

    journeyTitle.textContent = `Train ${train.Traincode}`;
    journeyTimeline.innerHTML = '';
    journeyInfo.innerHTML = '';
    journeySkeleton.hidden = false;

    // Show train info
    const typeInfo = getTrainTypeInfo(train.Traintype);
    journeyInfo.innerHTML = '';
    journeyInfo.appendChild(createInfoItem('Route', `${train.Origin} → ${train.Destination}`));
    journeyInfo.appendChild(createInfoItem('Departs', train.Origintime || '--:--'));
    journeyInfo.appendChild(createInfoItem('Arrives', train.Destinationtime || '--:--'));
    journeyInfo.appendChild(createInfoItem('Type',
        el('span', { className: `type-badge ${typeInfo.className}` }, typeInfo.label).outerHTML
    ));
    journeyInfo.appendChild(createInfoItem('Status', train.Status || 'Unknown'));

    try {
        const trainDate = train.Traindate || getTodayFormatted();
        const movements = await getTrainMovements(train.Traincode, trainDate);
        journeySkeleton.hidden = true;

        if (movements.length === 0) {
            journeyTimeline.innerHTML = '<div class="no-results">No journey data available</div>';
            return;
        }

        // Sort by LocationOrder
        movements.sort((a, b) => parseInt(a.LocationOrder) - parseInt(b.LocationOrder));

        renderTimeline(movements, journeyTimeline);
    } catch (err) {
        journeySkeleton.hidden = true;
        journeyTimeline.innerHTML = '<div class="no-results">Failed to load journey data</div>';
        showToast('Failed to load journey details', 'error');
    }
}

/**
 * Render the timeline of stops
 */
function renderTimeline(movements, container) {
    container.innerHTML = '';

    movements.forEach((stop, index) => {
        const isPassed = stop.Arrival !== '' && stop.Arrival !== null && stop.Arrival !== undefined && stop.Arrival.length > 0;
        const isDeparted = stop.Departure !== '' && stop.Departure !== null && stop.Departure !== undefined && stop.Departure.length > 0;
        const isFirst = index === 0;
        const isLast = index === movements.length - 1;

        // Determine stop state
        let state = 'future';
        if (isPassed || isDeparted) {
            state = 'passed';
        }

        // Find current stop (last one that has arrived but not departed, or first not arrived)
        const nextNotArrived = movements.findIndex(m => !m.Arrival || m.Arrival.length === 0);
        if (index === nextNotArrived || (nextNotArrived === -1 && isLast && isPassed)) {
            state = 'current';
        }
        // If all have arrived, last one is current
        if (nextNotArrived === -1 && isLast) {
            state = 'current';
        }

        const stopEl = el('div', { className: `timeline-stop timeline-stop--${state}` },
            el('div', { className: 'timeline-stop__dot' },
                el('div', { className: 'timeline-stop__dot-inner' }),
            ),
            el('div', { className: 'timeline-stop__content' },
                el('div', { className: 'timeline-stop__station' }, stop.LocationFullName),
                createTimesEl(stop, isFirst, isLast),
                stop.StopType ? el('div', { className: 'timeline-stop__type' },
                    stop.StopType === 'O' ? 'Origin' :
                    stop.StopType === 'D' ? 'Destination' :
                    stop.StopType === 'S' ? 'Stop' :
                    stop.StopType === 'T' ? 'Timing Point' : stop.StopType
                ) : null,
            ),
        );

        container.appendChild(stopEl);
    });
}

/**
 * Create times element for a stop
 */
function createTimesEl(stop, isFirst, isLast) {
    const times = el('div', { className: 'timeline-stop__times' });

    // Arrival (not for first stop)
    if (!isFirst) {
        const arr = el('span', { className: 'timeline-stop__time' },
            el('span', { className: 'timeline-stop__time-label' }, 'Arr: '),
        );

        if (stop.Arrival && stop.Arrival.length > 0) {
            // Actual arrival
            arr.appendChild(el('span', { className: 'timeline-stop__time-value timeline-stop__time-value--actual' }, formatTime(stop.Arrival)));
        } else if (stop.ExpectedArrival && stop.ExpectedArrival !== stop.ScheduledArrival) {
            // Expected differs from scheduled - show both
            arr.appendChild(el('span', { className: 'timeline-stop__time-value timeline-stop__time-value--late' }, formatTime(stop.ScheduledArrival)));
            arr.appendChild(el('span', { className: 'timeline-stop__time-value timeline-stop__time-value--actual' }, ` ${formatTime(stop.ExpectedArrival)}`));
        } else {
            arr.appendChild(el('span', { className: 'timeline-stop__time-value' }, formatTime(stop.ScheduledArrival)));
        }
        times.appendChild(arr);
    }

    // Departure (not for last stop)
    if (!isLast) {
        const dep = el('span', { className: 'timeline-stop__time' },
            el('span', { className: 'timeline-stop__time-label' }, 'Dep: '),
        );

        if (stop.Departure && stop.Departure.length > 0) {
            dep.appendChild(el('span', { className: 'timeline-stop__time-value timeline-stop__time-value--actual' }, formatTime(stop.Departure)));
        } else if (stop.ExpectedDeparture && stop.ExpectedDeparture !== stop.ScheduledDeparture) {
            dep.appendChild(el('span', { className: 'timeline-stop__time-value timeline-stop__time-value--late' }, formatTime(stop.ScheduledDeparture)));
            dep.appendChild(el('span', { className: 'timeline-stop__time-value timeline-stop__time-value--actual' }, ` ${formatTime(stop.ExpectedDeparture)}`));
        } else {
            dep.appendChild(el('span', { className: 'timeline-stop__time-value' }, formatTime(stop.ScheduledDeparture)));
        }
        times.appendChild(dep);
    }

    return times;
}

/**
 * Create an info item
 */
function createInfoItem(label, value) {
    const item = el('div', { className: 'journey-info__item' },
        el('span', { className: 'journey-info__label' }, label),
    );
    if (typeof value === 'string' && value.includes('<')) {
        const valEl = el('span', { className: 'journey-info__value' });
        valEl.innerHTML = value;
        item.appendChild(valEl);
    } else {
        item.appendChild(el('span', { className: 'journey-info__value' }, value));
    }
    return item;
}

/**
 * Close the journey viewer
 */
export function closeJourney() {
    const viewer = $('#journeyViewer');
    const overlay = $('#overlay');

    overlay.classList.remove('overlay--visible');
    viewer.classList.remove('journey-viewer--open');

    setTimeout(() => {
        viewer.hidden = true;
        overlay.hidden = true;
    }, 400);

    // Remove selected row highlight
    document.querySelectorAll('.board-table__row--selected').forEach(r =>
        r.classList.remove('board-table__row--selected')
    );
}
