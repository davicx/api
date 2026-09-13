const { CLOUDPILOT_AI_CONFIG } = require('../../../../config/cloudPilotAIConfig');
const MasterLogging = require('../../../../cloudPilot/logging/masterLogging');

/*
SEARCH logging — one structured block for how CloudPilot understood the message.

Gated by masterLogging.logUnderstandingSearchDetailsOn (control panel).
ENV CLOUDPILOT_SEARCH_LOGS remains a secondary gate for compatibility.

Usage:
  beginSearchSession()
  recordSearch({ name, method, result })
  flushSearchLog()
*/

let searchSession = null;

function searchDetailsEnabled() {
    return (
        MasterLogging.logUnderstandingSearchDetailsOn === true &&
        CLOUDPILOT_AI_CONFIG.searchLogs === true
    );
}

//Function A1: Start collecting search rows for this understandMessage pass
function beginSearchSession() {
    if (!searchDetailsEnabled()) {
        searchSession = null;
        return;
    }

    searchSession = [];
}

//Function A2: Record one search row (no-op when SEARCH logs off)
function recordSearch(details) {
    if (!searchSession) {
        return;
    }

    const name =
        details && details.name != null && String(details.name).trim() !== ''
            ? String(details.name).trim()
            : 'Search';
    const method = formatMethod(details && details.method);
    const found = formatSearchResult(details && details.result);
    const result = found !== null ? found : emptyResultLabel(method);

    searchSession.push({
        name: name,
        method: method,
        result: result
    });
}

//Function A3: Print the SEARCH block and clear the session
function flushSearchLog() {
    if (!searchSession) {
        return;
    }

    const rows = searchSession;
    searchSession = null;

    if (rows.length === 0) {
        return;
    }

    console.log('MASTER STEP 2A: SEARCH RESULTS');
    console.log('');

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        console.log(row.name);
        console.log('Method: ' + row.method);
        console.log('Result: ' + row.result);
        console.log('');
    }
}

function formatMethod(method) {
    const raw = method == null ? '' : String(method).trim();

    if (!raw) {
        return 'Internal';
    }

    const lower = raw.toLowerCase();

    if (lower === 'openai' || lower === 'open ai') {
        return 'OpenAI';
    }

    if (lower === 'internal') {
        return 'Internal';
    }

    if (lower === 'skipped' || lower === 'skip') {
        return 'Skipped';
    }

    return raw;
}

function emptyResultLabel(method) {
    if (method === 'Skipped') {
        return 'Not used';
    }

    return 'Searched but nothing found';
}

// Returns a display string, or null when nothing was found
function formatSearchResult(result) {
    if (result === undefined || result === null) {
        return null;
    }

    if (typeof result === 'string') {
        const text = result.trim();
        return text !== '' ? text : null;
    }

    if (typeof result === 'number' || typeof result === 'boolean') {
        return String(result);
    }

    if (Array.isArray(result)) {
        if (result.length === 0) {
            return null;
        }

        return result.join(', ');
    }

    if (typeof result === 'object') {
        const keys = Object.keys(result);

        if (keys.length === 0) {
            return null;
        }

        if (keys.length === 1) {
            const onlyKey = keys[0];
            const onlyValue = result[onlyKey];

            if (onlyValue === true) {
                return onlyKey;
            }

            if (onlyValue === false || onlyValue === null || onlyValue === undefined) {
                return null;
            }

            if (typeof onlyValue === 'string' || typeof onlyValue === 'number') {
                return String(onlyValue);
            }
        }

        const parts = [];

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const value = result[key];

            if (value === undefined || value === null || value === '') {
                continue;
            }

            parts.push(key + '=' + String(value));
        }

        return parts.length > 0 ? parts.join(', ') : null;
    }

    return String(result);
}

module.exports = {
    beginSearchSession,
    recordSearch,
    flushSearchLog,
    formatSearchResult
};
