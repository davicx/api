const SearchLogs = require('../helpers/searchLogs');

/*
FUNCTIONS A: Instance name extraction from user message
    1) Function A1: searchMessageForName
*/

//Function A1: Find an instance name in the message
function searchMessageForName(message) {
    const s = String(message || '');
    let result = {};
    let match = s.match(/\bname\s+it\s+([a-z0-9][a-z0-9._-]*)\b/i);

    if (match) {
        result = { name: String(match[1]).trim() };
    } else {
        match = s.match(/\bcall\s+it\s+([a-z0-9][a-z0-9._-]*)\b/i);

        if (match) {
            result = { name: String(match[1]).trim() };
        } else {
            const trimmed = s.trim();
            const lower = trimmed.toLowerCase();

            if (!/^(hello|hi|hey|thanks|thank you|yes|no|ok)\s*$/i.test(lower)) {
                const afterLeadIn = trimmed.replace(/^(ok|yes|sure|thanks)[,.\s]+/i, '').trim();
                const candidate = afterLeadIn.length ? afterLeadIn : trimmed;

                if (
                    !/^i-[0-9a-f]/i.test(candidate) &&
                    !/^(t2|t3|m5|c5)\./i.test(candidate) &&
                    /^[a-z0-9][a-z0-9._-]{1,62}$/i.test(candidate) &&
                    (candidate.includes('-') || candidate.includes('_') || candidate.includes('.'))
                ) {
                    result = { name: candidate };
                }
            }
        }
    }

    SearchLogs.recordSearch({
        name: 'Name',
        method: 'Internal',
        result: result.name || null
    });

    return result;
}

module.exports = { searchMessageForName };
