/**
 * Utility helpers for the Irish Rail Dashboard
 */

/**
 * Create a debounced version of a function
 */
export function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

/**
 * Create a DOM element with optional attributes and children
 */
export function el(tag, attrs = {}, ...children) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'dataset') {
            Object.assign(element.dataset, value);
        } else if (key.startsWith('on')) {
            element.addEventListener(key.slice(2).toLowerCase(), value);
        } else {
            element.setAttribute(key, value);
        }
    }
    for (const child of children) {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            element.appendChild(child);
        }
    }
    return element;
}

/**
 * Shorthand for querySelector
 */
export function $(selector, parent = document) {
    return parent.querySelector(selector);
}

/**
 * Shorthand for querySelectorAll
 */
export function $$(selector, parent = document) {
    return [...parent.querySelectorAll(selector)];
}

/**
 * Format minutes into human-readable "Due in" text
 */
export function formatDueIn(minutes) {
    const mins = parseInt(minutes, 10);
    if (isNaN(mins)) return minutes;
    if (mins <= 0) return 'Now';
    if (mins === 1) return '1 min';
    return `${mins} mins`;
}

/**
 * Format late minutes
 */
export function formatLate(minutes) {
    const mins = parseInt(minutes, 10);
    if (isNaN(mins) || mins <= 0) return null;
    return `+${mins} min${mins > 1 ? 's' : ''}`;
}

/**
 * Get train type display info
 */
export function getTrainTypeInfo(type) {
    const types = {
        'DART': { label: 'DART', className: 'type-badge--dart', code: 'D' },
        'Mainline': { label: 'Mainline', className: 'type-badge--mainline', code: 'M' },
        'Suburban': { label: 'Suburban', className: 'type-badge--suburban', code: 'S' },
    };
    return types[type] || { label: type || 'Unknown', className: 'type-badge--unknown', code: '?' };
}

/**
 * Get status class based on late minutes
 */
export function getStatusInfo(late, status) {
    const lateMin = parseInt(late, 10);
    if (status === 'No Information') {
        return { className: 'status--unknown', label: 'No Info', icon: 'question' };
    }
    if (isNaN(lateMin) || lateMin <= 0) {
        return { className: 'status--ontime', label: 'On Time', icon: 'check' };
    }
    if (lateMin <= 5) {
        return { className: 'status--slight', label: `${lateMin}m late`, icon: 'clock' };
    }
    return { className: 'status--late', label: `${lateMin}m late`, icon: 'alert' };
}

/**
 * Get today's date in dd/mm/yyyy format (for API)
 */
export function getTodayFormatted() {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

/**
 * Format time string (HH:MM) for display
 */
export function formatTime(timeStr) {
    if (!timeStr || timeStr === '00:00') return '--:--';
    return timeStr;
}

/**
 * Format timestamp for "last updated" display
 */
export function formatTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString('en-IE', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

/**
 * Simple fuzzy match for station search
 */
export function fuzzyMatch(query, text) {
    const q = query.toLowerCase();
    const t = text.toLowerCase();
    if (t.includes(q)) return true;
    // Check if all chars of query appear in order in text
    let qi = 0;
    for (let i = 0; i < t.length && qi < q.length; i++) {
        if (t[i] === q[qi]) qi++;
    }
    return qi === q.length;
}

/**
 * Score a fuzzy match (higher is better)
 */
export function fuzzyScore(query, text) {
    const q = query.toLowerCase();
    const t = text.toLowerCase();
    if (t === q) return 100;
    if (t.startsWith(q)) return 90;
    if (t.includes(q)) return 80;
    // Fuzzy scoring
    let score = 0;
    let qi = 0;
    let consecutive = 0;
    for (let i = 0; i < t.length && qi < q.length; i++) {
        if (t[i] === q[qi]) {
            qi++;
            consecutive++;
            score += consecutive * 2;
        } else {
            consecutive = 0;
        }
    }
    return qi === q.length ? score : 0;
}

/**
 * Show a toast notification
 */
export function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    const toast = el('div', { className: `toast toast--${type}` },
        el('span', { className: 'toast__message' }, message),
        el('button', {
            className: 'toast__close',
            ariaLabel: 'Dismiss',
            onClick: () => toast.remove()
        }, '\u00d7')
    );
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast--visible'));
    setTimeout(() => {
        toast.classList.remove('toast--visible');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}
