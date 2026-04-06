/**
 * Irish Rail Live - Main Application
 * Initializes all components, manages state, handles auto-refresh and routing
 */

import { clearCache } from './api.js';
import { initStationSearch } from './components/stationSearch.js';
import { initDepartureBoard, loadStation, refresh as refreshBoard, setFilter as setBoardFilter } from './components/departureBoard.js';
import { initFilterBar } from './components/filterBar.js';
import { initJourneyViewer, loadJourney } from './components/journeyViewer.js';
import { initTrainTracker, setFilter as setTrainsFilter, loadTrains } from './components/trainTracker.js';
import { $, formatTimestamp, showToast } from './utils/helpers.js';

// ============================================
// App State
// ============================================
const state = {
    autoRefresh: true,
    refreshInterval: 60, // seconds
    countdown: 60,
    refreshTimer: null,
    countdownTimer: null,
    currentStation: null,
};

// ============================================
// Initialization
// ============================================
async function init() {
    // Load theme preference
    loadTheme();

    // Initialize components
    initFilterBar(handleFilterChange);
    initDepartureBoard(handleTrainSelect);
    initJourneyViewer();
    initTrainTracker(handleTrainCardClick);

    // Station search - loads stations and sets up autocomplete
    await initStationSearch(handleStationSelect);

    // Set up header controls
    setupAutoRefresh();
    setupThemeToggle();

    // Handle URL hash routing
    handleHashRoute();
    window.addEventListener('hashchange', handleHashRoute);

    // Page visibility - pause/resume refresh
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            pauseRefresh();
        } else {
            if (state.autoRefresh) {
                startRefreshCountdown();
                // Refresh immediately if tab was hidden
                doRefresh();
            }
        }
    });

    // Update last updated time
    updateLastUpdated();
}

// ============================================
// Event Handlers
// ============================================

/**
 * Handle station selection from search
 */
function handleStationSelect(station) {
    state.currentStation = station;
    loadStation(station);
    updateLastUpdated();

    // Update URL hash
    if (station.StationCode) {
        history.replaceState(null, '', `#station=${station.StationCode}`);
    }

    // Reset refresh countdown
    if (state.autoRefresh) {
        startRefreshCountdown();
    }
}

/**
 * Handle filter change
 */
function handleFilterChange(filter) {
    setBoardFilter(filter);
    setTrainsFilter(filter);
}

/**
 * Handle train row click on departure board
 */
function handleTrainSelect(train) {
    loadJourney(train);
}

/**
 * Handle train card click in running trains
 */
function handleTrainCardClick(train) {
    loadJourney(train);
}

// ============================================
// Auto Refresh
// ============================================

function setupAutoRefresh() {
    const toggle = $('#autoRefreshToggle');
    const refreshBtn = $('#refreshBtn');
    const countdownEl = $('#countdown');

    toggle.checked = state.autoRefresh;

    toggle.addEventListener('change', () => {
        state.autoRefresh = toggle.checked;
        if (state.autoRefresh) {
            startRefreshCountdown();
        } else {
            pauseRefresh();
            countdownEl.textContent = '';
        }
    });

    refreshBtn.addEventListener('click', () => {
        refreshBtn.classList.add('refreshing');
        doRefresh().finally(() => {
            setTimeout(() => refreshBtn.classList.remove('refreshing'), 1000);
        });
    });

    if (state.autoRefresh) {
        startRefreshCountdown();
    }
}

function startRefreshCountdown() {
    pauseRefresh();
    state.countdown = state.refreshInterval;
    updateCountdown();

    state.countdownTimer = setInterval(() => {
        state.countdown--;
        updateCountdown();

        if (state.countdown <= 0) {
            doRefresh();
            state.countdown = state.refreshInterval;
        }
    }, 1000);
}

function pauseRefresh() {
    if (state.countdownTimer) {
        clearInterval(state.countdownTimer);
        state.countdownTimer = null;
    }
}

function updateCountdown() {
    const countdownEl = $('#countdown');
    if (state.autoRefresh) {
        countdownEl.textContent = `${state.countdown}s`;
    }
}

async function doRefresh() {
    clearCache();
    await refreshBoard();
    updateLastUpdated();

    // Refresh trains grid if visible
    const trainsGridWrap = $('#trainsGridWrap');
    if (!trainsGridWrap.hidden) {
        await loadTrains();
    }
}

function updateLastUpdated() {
    const el = $('#lastUpdated');
    el.textContent = formatTimestamp();
}

// ============================================
// Theme
// ============================================

function setupThemeToggle() {
    const themeToggle = $('#themeToggle');
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('irish-rail-theme', newTheme);
    });
}

function loadTheme() {
    const saved = localStorage.getItem('irish-rail-theme');
    if (saved) {
        document.documentElement.setAttribute('data-theme', saved);
    }
    // Default is dark (no attribute needed, CSS treats it as default)
}

// ============================================
// URL Hash Routing
// ============================================

function handleHashRoute() {
    const hash = window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash.slice(1));
    const stationCode = params.get('station');

    if (stationCode) {
        // Wait for stations to load, then select
        const checkAndSelect = () => {
            const searchInput = $('#stationSearch');
            // Trigger station load by code
            handleStationSelect({
                StationCode: stationCode,
                StationDesc: stationCode, // Will be updated when data loads
            });
        };

        // Slight delay to let stations load
        setTimeout(checkAndSelect, 1500);
    }
}

// ============================================
// Start the app
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    init().catch(err => {
        console.error('App initialization failed:', err);
        showToast('Failed to initialize. Please refresh the page.', 'error', 10000);
    });
});
