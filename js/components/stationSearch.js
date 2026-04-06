/**
 * Station Search Component
 * Autocomplete search with popular station quick-picks
 */

import { getAllStations } from '../api.js';
import { debounce, el, $, fuzzyMatch, fuzzyScore, showToast } from '../utils/helpers.js';

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
let filteredStations = [];
let activeIndex = -1;
let onSelectCallback = null;

/**
 * Initialize the station search component
 * @param {Function} onSelect - Callback when a station is selected: (station) => void
 */
export async function initStationSearch(onSelect) {
    onSelectCallback = onSelect;
    const searchInput = $('#stationSearch');
    const searchClear = $('#searchClear');
    const searchResults = $('#searchResults');
    const quickStationsContainer = $('#quickStations');

    // Load all stations
    try {
        allStations = await getAllStations();
    } catch (err) {
        showToast('Failed to load stations. Please refresh.', 'error');
        allStations = [];
    }

    // Render popular stations
    renderQuickStations(quickStationsContainer);

    // Search input handler
    const handleSearch = debounce((query) => {
        if (!query || query.length < 1) {
            hideResults();
            return;
        }
        filteredStations = allStations
            .map(s => ({ ...s, score: fuzzyScore(query, s.StationDesc + (s.StationAlias || '')) }))
            .filter(s => s.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 15);

        if (filteredStations.length === 0) {
            showNoResults();
        } else {
            renderResults(filteredStations);
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
        hideResults();
        searchInput.focus();
    });

    // Keyboard navigation
    searchInput.addEventListener('keydown', (e) => {
        if (searchResults.hidden) return;
        const items = searchResults.querySelectorAll('.search-results__item');

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                activeIndex = Math.min(activeIndex + 1, items.length - 1);
                updateActiveItem(items);
                break;
            case 'ArrowUp':
                e.preventDefault();
                activeIndex = Math.max(activeIndex - 1, 0);
                updateActiveItem(items);
                break;
            case 'Enter':
                e.preventDefault();
                if (activeIndex >= 0 && activeIndex < filteredStations.length) {
                    selectStation(filteredStations[activeIndex]);
                }
                break;
            case 'Escape':
                hideResults();
                searchInput.blur();
                break;
        }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper')) {
            hideResults();
        }
    });
}

/**
 * Render search results dropdown
 */
function renderResults(stations) {
    const searchResults = $('#searchResults');
    activeIndex = -1;
    searchResults.innerHTML = '';

    stations.forEach((station, index) => {
        const item = el('li', {
            className: 'search-results__item',
            role: 'option',
            dataset: { index: String(index) },
            onClick: () => selectStation(station),
        },
            el('span', { className: 'search-results__name' }, station.StationDesc),
            el('span', { className: 'search-results__code' }, station.StationCode),
        );
        searchResults.appendChild(item);
    });

    searchResults.hidden = false;
    searchResults.closest('.search-wrapper')
        ?.querySelector('[role="combobox"]')
        ?.setAttribute('aria-expanded', 'true');
}

/**
 * Show no results message
 */
function showNoResults() {
    const searchResults = $('#searchResults');
    searchResults.innerHTML = '';
    searchResults.appendChild(
        el('li', { className: 'no-results' }, 'No stations found')
    );
    searchResults.hidden = false;
}

/**
 * Hide search results
 */
function hideResults() {
    const searchResults = $('#searchResults');
    searchResults.hidden = true;
    activeIndex = -1;
    searchResults.closest('.search-wrapper')
        ?.querySelector('[role="combobox"]')
        ?.setAttribute('aria-expanded', 'false');
}

/**
 * Update active item highlight
 */
function updateActiveItem(items) {
    items.forEach((item, i) => {
        item.classList.toggle('search-results__item--active', i === activeIndex);
        if (i === activeIndex) {
            item.scrollIntoView({ block: 'nearest' });
        }
    });
}

/**
 * Select a station
 */
function selectStation(station) {
    const searchInput = $('#stationSearch');
    searchInput.value = station.StationDesc;
    $('#searchClear').hidden = false;
    hideResults();
    if (onSelectCallback) {
        onSelectCallback(station);
    }
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
                selectStation(fullStation);
            },
        }, station.name);
        container.appendChild(chip);
    });
}

/**
 * Get filtered stations based on train type filter
 */
export function getStations() {
    return allStations;
}
