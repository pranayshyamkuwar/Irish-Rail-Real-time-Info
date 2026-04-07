/**
 * Station Search Component
 * Autocomplete search with From/To inputs and popular station quick-picks
 */

import { getAllStations } from '../api.js';
import { debounce, el, $, fuzzyScore, showToast } from '../utils/helpers.js';

const POPULAR_STATIONS = [
    { name: 'Dublin Heuston', code: 'HSTON' },
    { name: 'Dublin Connolly', code: 'CNLLY' },
    { name: 'Dublin Pearse', code: 'PERSE' },
    { name: 'Tara Street', code: 'TARA' },
    { name: 'Bray', code: 'BRAY' },
    { name: 'Cork', code: 'CORK' },
    { name: 'Galway', code: 'GALWY' },
    { name: 'Limerick', code: 'LMRCK' },
];

let allStations = [];
let onSelectCallback = null;
let onClearCallback = null;
let onDestinationCallback = null;

// Track state for each search input
const searchState = {
    from: { filteredStations: [], activeIndex: -1 },
    to: { filteredStations: [], activeIndex: -1 },
};

/**
 * Initialize the station search component
 * @param {Object} callbacks - { onSelect, onClear, onDestination }
 */
export async function initStationSearch(callbacks) {
    onSelectCallback = callbacks.onSelect;
    onClearCallback = callbacks.onClear;
    onDestinationCallback = callbacks.onDestination;

    // Load all stations
    try {
        allStations = await getAllStations();
    } catch (err) {
        showToast('Failed to load stations. Please refresh.', 'error');
        allStations = [];
    }

    // Setup "From" search
    setupSearchInput('stationSearch', 'searchClear', 'searchResults', 'from', (station) => {
        if (onSelectCallback) onSelectCallback(station);
    });

    // Setup "To" search
    setupSearchInput('destSearch', 'destClear', 'destResults', 'to', (station) => {
        if (onDestinationCallback) onDestinationCallback(station);
    });

    // Render popular stations
    renderQuickStations($('#quickStations'));
}

/**
 * Setup autocomplete for a search input
 */
function setupSearchInput(inputId, clearId, resultsId, stateKey, onSelect) {
    const searchInput = $(`#${inputId}`);
    const searchClear = $(`#${clearId}`);
    const searchResults = $(`#${resultsId}`);

    if (!searchInput || !searchClear || !searchResults) return;

    const state = searchState[stateKey];

    const handleSearch = debounce((query) => {
        if (!query || query.length < 1) {
            hideResults(searchResults);
            return;
        }
        state.filteredStations = allStations
            .map(s => ({ ...s, score: fuzzyScore(query, s.StationDesc + (s.StationAlias || '')) }))
            .filter(s => s.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 15);

        if (state.filteredStations.length === 0) {
            showNoResults(searchResults);
        } else {
            renderResults(state.filteredStations, searchResults, state, (station) => {
                searchInput.value = station.StationDesc;
                searchClear.hidden = false;
                hideResults(searchResults);
                onSelect(station);
            });
        }
    }, 200);

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        searchClear.hidden = !query;
        handleSearch(query);
    });

    // Clear button
    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchClear.hidden = true;
        hideResults(searchResults);
        searchInput.focus();

        if (stateKey === 'from' && onClearCallback) {
            onClearCallback();
        }
        if (stateKey === 'to' && onDestinationCallback) {
            onDestinationCallback(null);
        }
    });

    // Keyboard navigation
    searchInput.addEventListener('keydown', (e) => {
        if (searchResults.hidden) return;
        const items = searchResults.querySelectorAll('.search-results__item');

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                state.activeIndex = Math.min(state.activeIndex + 1, items.length - 1);
                updateActiveItem(items, state.activeIndex);
                break;
            case 'ArrowUp':
                e.preventDefault();
                state.activeIndex = Math.max(state.activeIndex - 1, 0);
                updateActiveItem(items, state.activeIndex);
                break;
            case 'Enter':
                e.preventDefault();
                if (state.activeIndex >= 0 && state.activeIndex < state.filteredStations.length) {
                    const station = state.filteredStations[state.activeIndex];
                    searchInput.value = station.StationDesc;
                    searchClear.hidden = false;
                    hideResults(searchResults);
                    onSelect(station);
                }
                break;
            case 'Escape':
                hideResults(searchResults);
                searchInput.blur();
                break;
        }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest(`#${inputId}`) && !e.target.closest(`#${resultsId}`)) {
            hideResults(searchResults);
        }
    });
}

/**
 * Render search results dropdown
 */
function renderResults(stations, searchResults, state, onSelect) {
    state.activeIndex = -1;
    searchResults.innerHTML = '';

    stations.forEach((station, index) => {
        const item = el('li', {
            className: 'search-results__item',
            role: 'option',
            dataset: { index: String(index) },
            onClick: () => onSelect(station),
        },
            el('span', { className: 'search-results__name' }, station.StationDesc),
            el('span', { className: 'search-results__code' }, station.StationCode),
        );
        searchResults.appendChild(item);
    });

    searchResults.hidden = false;
}

/**
 * Show no results message
 */
function showNoResults(searchResults) {
    searchResults.innerHTML = '';
    searchResults.appendChild(
        el('li', { className: 'no-results' }, 'No stations found')
    );
    searchResults.hidden = false;
}

/**
 * Hide search results
 */
function hideResults(searchResults) {
    searchResults.hidden = true;
}

/**
 * Update active item highlight
 */
function updateActiveItem(items, activeIndex) {
    items.forEach((item, i) => {
        item.classList.toggle('search-results__item--active', i === activeIndex);
        if (i === activeIndex) {
            item.scrollIntoView({ block: 'nearest' });
        }
    });
}

/**
 * Render popular station chips
 */
function renderQuickStations(container) {
    POPULAR_STATIONS.forEach((station) => {
        const chip = el('button', {
            className: 'quick-station-chip',
            onClick: () => {
                const fullStation = allStations.find(s => s.StationCode === station.code) || {
                    StationDesc: station.name,
                    StationCode: station.code,
                };
                // Set the from input and trigger selection
                const searchInput = $('#stationSearch');
                searchInput.value = fullStation.StationDesc;
                $('#searchClear').hidden = false;
                if (onSelectCallback) onSelectCallback(fullStation);
            },
        }, station.name);
        container.appendChild(chip);
    });
}

/**
 * Get all loaded stations
 */
export function getStations() {
    return allStations;
}
