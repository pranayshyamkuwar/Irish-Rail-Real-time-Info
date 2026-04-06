/**
 * Train Tracker Component
 * Shows currently running trains as a card grid
 */

import { getCurrentTrains } from '../api.js';
import { el, $, getTrainTypeInfo, showToast } from '../utils/helpers.js';

let currentTrains = [];
let currentFilter = 'All';
let onTrainClickCallback = null;

/**
 * Initialize train tracker
 * @param {Function} onTrainClick - Callback when a train card is clicked
 */
export function initTrainTracker(onTrainClick) {
    onTrainClickCallback = onTrainClick;

    const toggleBtn = $('#toggleTrains');
    const trainsGridWrap = $('#trainsGridWrap');
    const chevron = toggleBtn.querySelector('.icon--chevron');
    const toggleText = $('#toggleTrainsText');

    toggleBtn.addEventListener('click', async () => {
        const isHidden = trainsGridWrap.hidden;
        trainsGridWrap.hidden = !isHidden;
        chevron.classList.toggle('rotated', isHidden);
        toggleText.textContent = isHidden ? 'Hide' : 'Show';

        if (isHidden && currentTrains.length === 0) {
            await loadTrains();
        }
    });
}

/**
 * Load current running trains
 */
export async function loadTrains() {
    const trainsGrid = $('#trainsGrid');
    const trainCount = $('#trainCount');

    trainsGrid.innerHTML = '<div class="skeleton-board"><div class="skeleton-row"></div><div class="skeleton-row"></div><div class="skeleton-row"></div></div>';

    try {
        const typeCode = currentFilter === 'All' ? 'A' :
                         currentFilter === 'DART' ? 'D' :
                         currentFilter === 'Mainline' ? 'M' :
                         currentFilter === 'Suburban' ? 'S' : 'A';

        currentTrains = await getCurrentTrains(typeCode);
        trainCount.textContent = currentTrains.length;
        renderTrains();
    } catch (err) {
        trainsGrid.innerHTML = '<div class="no-results">Failed to load running trains</div>';
        showToast('Failed to load running trains', 'error');
    }
}

/**
 * Set filter and reload
 */
export function setFilter(filter) {
    currentFilter = filter;
    const trainsGridWrap = $('#trainsGridWrap');
    if (!trainsGridWrap.hidden) {
        loadTrains();
    }
}

/**
 * Render train cards
 */
function renderTrains() {
    const trainsGrid = $('#trainsGrid');
    trainsGrid.innerHTML = '';

    if (currentTrains.length === 0) {
        trainsGrid.innerHTML = '<div class="no-results">No trains currently running</div>';
        return;
    }

    currentTrains.forEach(train => {
        const typeInfo = getTrainTypeInfo(train.TrainType);

        // Parse PublicMessage for route info
        const message = train.PublicMessage || '';
        const lines = message.split('\\n').join('\n').split('\n');
        const routeInfo = lines[0] || '';
        const statusInfo = lines[1] || '';

        // Extract origin/destination from route
        let origin = '';
        let destination = '';
        const routeMatch = routeInfo.match(/from\s+(.+?)\s+to\s+(.+?)(?:\.|$)/i);
        if (routeMatch) {
            origin = routeMatch[1].trim();
            destination = routeMatch[2].trim();
        }

        // Determine if late
        const isLate = message.toLowerCase().includes('late') || message.toLowerCase().includes('delayed');

        const card = el('div', {
            className: 'train-card',
            onClick: () => {
                if (onTrainClickCallback) {
                    // Create a train-like object compatible with journey viewer
                    onTrainClickCallback({
                        Traincode: train.TrainCode,
                        Traindate: train.TrainDate,
                        Origin: origin,
                        Destination: destination,
                        Traintype: train.TrainType,
                        Status: isLate ? 'Late' : 'On Time',
                    });
                }
            },
        },
            el('div', { className: 'train-card__header' },
                el('span', { className: 'train-card__code' }, train.TrainCode),
                el('span', { className: `type-badge ${typeInfo.className}` }, typeInfo.label),
            ),
            (origin && destination) ?
                el('div', { className: 'train-card__route' },
                    el('span', { className: 'train-card__origin' }, origin),
                    createArrowIcon(),
                    el('span', { className: 'train-card__destination' }, destination),
                ) : null,
            el('div', { className: 'train-card__footer' },
                el('span', {
                    className: `status-indicator ${isLate ? 'status--late' : 'status--ontime'}`,
                },
                    el('span', { className: 'status-dot' }),
                    el('span', { className: 'status-label' }, isLate ? 'Late' : 'On Time'),
                ),
                el('span', { className: 'direction-arrow' }, train.Direction || ''),
            ),
            statusInfo ? el('p', { className: 'train-card__message' }, statusInfo.trim()) : null,
        );

        trainsGrid.appendChild(card);
    });
}

/**
 * Create arrow SVG icon
 */
function createArrowIcon() {
    const wrap = el('span', { className: 'train-card__arrow' });
    wrap.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
    return wrap;
}
