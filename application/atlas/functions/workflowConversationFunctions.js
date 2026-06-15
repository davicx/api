/*
FUNCTIONS A: Open-actions conversation intents (P3B + focus switch)

    1) Function A1: detectListOpenActionsIntent
    2) Function A2: resolveFocusSwitchFromMessage
*/

//Function A1: User wants a list of open workflows (no mutation)
function detectListOpenActionsIntent(userMessage) {
    const text = String(userMessage || '').toLowerCase().trim();

    if (!text) {
        return false;
    }

    const listPhrases = [
        'show open actions',
        'show my open actions',
        'list open actions',
        'list my actions',
        'what am i waiting on',
        'what are my open actions',
        'open actions',
        'my open actions'
    ];

    for (let i = 0; i < listPhrases.length; i++) {
        if (text === listPhrases[i] || text.includes(listPhrases[i])) {
            return true;
        }
    }

    return false;
}

//Function A2: Switch focused workflow by display name, index, or explicit phrase
function resolveFocusSwitchFromMessage(userMessage, openActions, currentFocusedWorkflowId) {
    const text = String(userMessage || '').toLowerCase().trim();
    const actions = Array.isArray(openActions) ? openActions : [];

    if (!text || actions.length === 0) {
        return { switched: false, ambiguous: false, focusedWorkflowId: null, message: '' };
    }

    if (detectListOpenActionsIntent(userMessage)) {
        return { switched: false, ambiguous: false, focusedWorkflowId: null, message: '' };
    }

    const indexMatch = text.match(/^(?:switch to|focus on|use|select|run)\s*#?(\d+)$/);
    const bareIndexMatch = actions.length > 1 ? text.match(/^(\d+)$/) : null;
    const indexStr = indexMatch ? indexMatch[1] : (bareIndexMatch ? bareIndexMatch[1] : null);

    if (indexStr) {
        const idx = Number(indexStr) - 1;
        if (idx >= 0 && idx < actions.length) {
            const picked = actions[idx];
            return buildFocusSwitchResult(picked, currentFocusedWorkflowId, true);
        }
    }

    const matched = [];

    for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        const label = String(action.displayName || action.actionName || action.actionType || '')
            .toLowerCase()
            .trim();

        if (!label) {
            continue;
        }

        const prefixPatterns = [
            'switch to ' + label,
            'focus on ' + label,
            'work on ' + label,
            'use ' + label,
            'select ' + label
        ];

        let hit = false;

        for (let p = 0; p < prefixPatterns.length; p++) {
            if (text.includes(prefixPatterns[p])) {
                hit = true;
                break;
            }
        }

        if (!hit && label.length >= 4 && text.includes(label)) {
            hit = true;
        }

        if (hit) {
            matched.push(action);
        }
    }

    if (matched.length === 1) {
        const acknowledgeOnly =
            !text.includes(':') &&
            (text.startsWith('switch to ') ||
                text.startsWith('focus on ') ||
                text.startsWith('work on ') ||
                text.startsWith('use ') ||
                text.startsWith('select '));

        return buildFocusSwitchResult(matched[0], currentFocusedWorkflowId, acknowledgeOnly);
    }

    if (matched.length > 1) {
        const names = matched
            .map(function (a) {
                return '"' + (a.displayName || a.actionName || a.actionType) + '"';
            })
            .join(', ');

        return {
            switched: false,
            ambiguous: true,
            focusedWorkflowId: null,
            message:
                'That matches more than one open action: ' +
                names +
                '. Say "switch to 1" or use a fuller name.'
        };
    }

    return { switched: false, ambiguous: false, focusedWorkflowId: null, message: '' };
}

function buildFocusSwitchResult(action, currentFocusedWorkflowId, acknowledgeOnly) {
    const id = action.workflowId;
    const label = action.displayName || action.actionName || action.actionType || 'action';
    const alreadyFocused = Number(currentFocusedWorkflowId) === Number(id);

    return {
        switched: !alreadyFocused,
        ambiguous: false,
        focusedWorkflowId: id,
        displayName: label,
        acknowledgeOnly: Boolean(acknowledgeOnly),
        message: alreadyFocused
            ? 'Still on "' + label + '".'
            : 'Okay, continuing with "' + label + '".'
    };
}

module.exports = {
    detectListOpenActionsIntent,
    resolveFocusSwitchFromMessage
};
