/**
 * Filter Bar Component
 * Train type filter toggles: All, DART, Mainline, Suburban
 */

import { $$ } from '../utils/helpers.js';

let onFilterChangeCallback = null;
let currentFilter = 'All';

/**
 * Initialize the filter bar
 * @param {Function} onChange - Callback when filter changes: (filterType) => void
 */
export function initFilterBar(onChange) {
    onFilterChangeCallback = onChange;
    const buttons = $$('.filter-btn');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            if (type === currentFilter) return;

            currentFilter = type;

            // Update button states
            buttons.forEach(b => {
                b.classList.remove('filter-btn--active');
                b.setAttribute('aria-selected', 'false');
            });
            btn.classList.add('filter-btn--active');
            btn.setAttribute('aria-selected', 'true');

            if (onFilterChangeCallback) {
                onFilterChangeCallback(currentFilter);
            }
        });
    });
}

/**
 * Get the API type code for current filter
 */
export function getFilterTypeCode() {
    const map = { 'All': 'A', 'DART': 'D', 'Mainline': 'M', 'Suburban': 'S' };
    return map[currentFilter] || 'A';
}

/**
 * Get current filter value
 */
export function getCurrentFilter() {
    return currentFilter;
}
