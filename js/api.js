/**
 * Irish Rail API Client
 * Handles CORS proxying and all API endpoint calls
 */

import { parseXML } from './utils/xmlParser.js';

const API_BASE = 'http://api.irishrail.ie/realtime/realtime.asmx';

const CORS_PROXIES = [
    (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url) => `https://cors-anywhere.herokuapp.com/${url}`,
];

let activeProxyIndex = 0;
let cache = new Map();
const CACHE_TTL = 30000; // 30 seconds

/**
 * Fetch from Irish Rail API with CORS proxy fallback
 */
async function apiFetch(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE}/${endpoint}${queryString ? '?' + queryString : ''}`;

    // Check cache
    const cacheKey = url;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.time < CACHE_TTL) {
        return cached.data;
    }

    // Try direct first (in case CORS is supported)
    try {
        const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (resp.ok) {
            const text = await resp.text();
            const data = parseXML(text);
            cache.set(cacheKey, { data, time: Date.now() });
            return data;
        }
    } catch (e) {
        // Direct fetch failed, try proxies
    }

    // Try CORS proxies starting from the last successful one
    const proxyOrder = [
        ...CORS_PROXIES.slice(activeProxyIndex),
        ...CORS_PROXIES.slice(0, activeProxyIndex),
    ];

    for (let i = 0; i < proxyOrder.length; i++) {
        const proxy = proxyOrder[i];
        try {
            const proxyUrl = proxy(url);
            const resp = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) });
            if (resp.ok) {
                const text = await resp.text();
                const data = parseXML(text);
                activeProxyIndex = CORS_PROXIES.indexOf(proxy);
                cache.set(cacheKey, { data, time: Date.now() });
                return data;
            }
        } catch (e) {
            continue;
        }
    }

    throw new Error('Unable to connect to Irish Rail API. All proxies failed.');
}

/**
 * Clear the API cache
 */
export function clearCache() {
    cache.clear();
}

/**
 * Get all stations
 * @param {string} type - A=All, M=Mainline, S=Suburban, D=DART
 */
export async function getAllStations(type = 'A') {
    return apiFetch('getAllStationsXML', { StationType: type });
}

/**
 * Get station data by code with time window
 * @param {string} stationCode - Station code (e.g., 'HSTON')
 * @param {number} numMins - Time window in minutes
 */
export async function getStationData(stationCode, numMins = 90) {
    return apiFetch('getStationDataByCodeXML_WithNumMins', {
        StationCode: stationCode,
        NumMins: numMins,
    });
}

/**
 * Get station data by name
 * @param {string} stationName - Station name (e.g., 'Dublin Heuston')
 * @param {number} numMins - Time window in minutes
 */
export async function getStationDataByName(stationName, numMins = 90) {
    return apiFetch('getStationDataByNameXML', {
        StationDesc: stationName,
        NumMins: numMins,
    });
}

/**
 * Get all currently running trains
 * @param {string} type - A=All, M=Mainline, S=Suburban, D=DART
 */
export async function getCurrentTrains(type = 'A') {
    return apiFetch('getCurrentTrainsXML', { TrainType: type });
}

/**
 * Get train movements (all stops for a train)
 * @param {string} trainId - Train code (e.g., 'E109')
 * @param {string} trainDate - Date in dd/mm/yyyy format
 */
export async function getTrainMovements(trainId, trainDate) {
    return apiFetch('getTrainMovementsXML', {
        TrainId: trainId,
        TrainDate: trainDate,
    });
}

/**
 * Search stations by text
 * @param {string} text - Search text
 */
export async function searchStations(text) {
    return apiFetch('getStationsFilter', { StationText: text });
}
