/**
 * Departure Board Component
 * Shows live departures/arrivals for a selected station
 */

import { getStationData } from '../api.js';
import { el, $, formatDueIn, getTrainTypeInfo, getStatusInfo, formatTime, showToast } from '../utils/helpers.js';

let currentStation = null;
let currentData = [];
let currentTab = 'departures';
let currentFilter = 'All';
let onTrainSelectCallback = null;

/**
 * Initialize departure board
 * @param {Function} onTrainSelect - Callback when a train row is clicked
 */
export function initDepartureBoard(onTrainSelect) {
    onTrainSelectCallback = onTrainSelect;

    // Tab switching
    const tabs = document.querySelectorAll('.panel__tabs .tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => {
                t.classList.remove('tab--active');
                t.setAttribute('aria-selected', 'false');
            });
            tab.classList.add('tab--active');
            tab.setAttribute('aria-selected', 'true');
            currentTab = tab.dataset.tab;
            renderBoard();
        });
    });
}

/**
 * Load station data and render
 * @param {Object} station - Station object with StationCode, StationDesc
 */
export async function loadStation(station) {
    currentStation = station;
    const boardTitle = $('#boardTitle');
    const boardEmpty = $('#boardEmpty');
    const boardTableWrap = $('#boardTableWrap');
    const boardSkeleton = $('#boardSkeleton');

    boardTitle.textContent = station.StationDesc;
    boardEmpty.hidden = true;
    boardTableWrap.hidden = true;
    boardSkeleton.hidden = false;

    try {
        currentData = await getStationData(station.StationCode, 90);
        boardSkeleton.hidden = true;

        if (currentData.length === 0) {
            showEmptyBoard('No trains scheduled in the next 90 minutes');
        } else {
            renderBoard();
        }
    } catch (err) {
        boardSkeleton.hidden = true;
        showErrorBoard();
        showToast('Failed to load station data', 'error');
    }
}

/**
 * Refresh current station data
 */
export async function refresh() {
    if (currentStation) {
        await loadStation(currentStation);
    }
}

/**
 * Set the train type filter
 */
export function setFilter(filter) {
    currentFilter = filter;
    if (currentData.length > 0) {
        renderBoard();
    }
}

/**
 * Render the departure/arrival board
 */
function renderBoard() {
    const boardTableWrap = $('#boardTableWrap');
    const boardBody = $('#boardTableBody');
    const boardEmpty = $('#boardEmpty');

    let data = [...currentData];

    // Filter by type
    if (currentFilter !== 'All') {
        data = data.filter(t => t.Traintype === currentFilter);
    }

    // Filter by tab (direction)
    // "departures" shows trains departing from this station, "arrivals" shows arriving
    // The API doesn't separate these cleanly, so we use Locationtype
    if (currentTab === 'departures') {
        data.sort((a, b) => parseInt(a.Duein) - parseInt(b.Duein));
    } else {
        data.sort((a, b) => parseInt(a.Duein) - parseInt(b.Duein));
    }

    if (data.length === 0) {
        boardTableWrap.hidden = true;
        const filterLabel = currentFilter !== 'All' ? ` ${currentFilter}` : '';
        showEmptyBoard(`No${filterLabel} trains found`);
        return;
    }

    boardEmpty.hidden = true;
    boardTableWrap.hidden = false;
    boardBody.innerHTML = '';

    data.forEach((train, index) => {
        const statusInfo = getStatusInfo(train.Late, train.Status);
        const typeInfo = getTrainTypeInfo(train.Traintype);
        const dueText = formatDueIn(train.Duein);
        const expectedTime = currentTab === 'departures'
            ? formatTime(train.Expdepart)
            : formatTime(train.Exparrival);
        const destination = currentTab === 'departures'
            ? train.Destination
            : train.Origin;
        const origin = currentTab === 'departures'
            ? train.Origin
            : train.Destination;

        const row = el('tr', {
            className: `board-table__row`,
            onClick: () => {
                // Highlight selected row
                document.querySelectorAll('.board-table__row--selected').forEach(r =>
                    r.classList.remove('board-table__row--selected')
                );
                row.classList.add('board-table__row--selected');

                if (onTrainSelectCallback) {
                    onTrainSelectCallback(train);
                }
            },
            title: `${train.Traincode}: ${train.Origin} → ${train.Destination} | ${train.Status || 'No info'}`,
        },
            // Status
            el('td', { className: `board-table__td` },
                el('span', { className: `status-indicator ${statusInfo.className}` },
                    el('span', { className: 'status-dot' }),
                    el('span', { className: 'status-label' }, statusInfo.label),
                ),
            ),
            // Destination
            el('td', { className: 'board-table__td board-table__td--dest' }, destination),
            // Due in
            el('td', { className: 'board-table__td board-table__td--due' }, dueText),
            // Expected time
            el('td', { className: 'board-table__td board-table__td--time' }, expectedTime),
            // Type badge
            el('td', { className: 'board-table__td' },
                el('span', { className: `type-badge ${typeInfo.className}` }, typeInfo.label),
            ),
            // Origin
            el('td', { className: 'board-table__td board-table__td--origin' }, origin),
        );

        boardBody.appendChild(row);
    });
}

/**
 * Show empty board state
 */
function showEmptyBoard(message) {
    const boardEmpty = $('#boardEmpty');
    const boardTableWrap = $('#boardTableWrap');
    boardTableWrap.hidden = true;
    boardEmpty.hidden = false;
    const emptyText = boardEmpty.querySelector('.empty-state__text');
    if (emptyText) emptyText.textContent = message;
}

/**
 * Show error state
 */
function showErrorBoard() {
    const boardBody = $('#boardBody');
    const boardEmpty = $('#boardEmpty');
    const boardTableWrap = $('#boardTableWrap');
    boardEmpty.hidden = true;
    boardTableWrap.hidden = true;

    // Remove existing error state
    const existing = boardBody.querySelector('.error-state');
    if (existing) existing.remove();

    const errorEl = el('div', { className: 'error-state' },
        el('svg', {}, ''),
        el('p', { className: 'error-state__text' }, 'Unable to load train data. Please try again.'),
        el('button', {
            className: 'error-state__btn',
            onClick: () => {
                errorEl.remove();
                if (currentStation) loadStation(currentStation);
            },
        }, 'Retry'),
    );

    // Add error icon
    errorEl.querySelector('svg')?.remove();
    const iconWrap = el('div', { className: 'error-state__icon' });
    iconWrap.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
    errorEl.prepend(iconWrap);

    boardBody.appendChild(errorEl);
}

/**
 * Get current station code
 */
export function getCurrentStation() {
    return currentStation;
}
