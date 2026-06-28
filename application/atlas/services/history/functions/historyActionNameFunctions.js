const actionMap = require('../../actions/actionMap');
const AtlasTimeFunctions = require('../../../functions/atlasTimeFunctions');

/*
FUNCTIONS A: History row naming (machine + human)
    1) Function A1: buildHistoryActionNames
    2) Function A2: buildActionDisplayName
*/

//Function A1: Build action_display_name and action_record_key at insert time
function buildHistoryActionNames(options) {
    const actionName = String(options.actionName || '').trim();
    const recordedAt = options.recordedAt || new Date();

    return {
        actionDisplayName: buildActionDisplayName(options),
        actionRecordKey: AtlasTimeFunctions.formatActionRecordKey(actionName, recordedAt)
    };
}

//Function A2: User-facing label frozen on the history row
function buildActionDisplayName(options) {
    const actionName = String(options.actionName || '').trim();

    if (actionName.indexOf('undo_') === 0) {
        return buildUndoDisplayName(options);
    }

    const baseLabel = resolveActionLabel(actionName);
    const contextName = resolveContextName(options);

    if (contextName) {
        return baseLabel + ' for ' + contextName;
    }

    return baseLabel;
}

function buildUndoDisplayName(options) {
    const originalHistory = options.originalHistory || {};

    if (originalHistory.actionDisplayName) {
        return 'Undo ' + originalHistory.actionDisplayName;
    }

    const undoActionName = String(options.actionName || '').trim();
    const originalActionName = undoActionName.replace(/^undo_/, '');
    const baseLabel = resolveActionLabel(originalActionName);
    const contextName = resolveContextName({
        collected: options.collected || {},
        resourceStateBefore: originalHistory.resourceStateBefore,
        resourceStateAfter: originalHistory.resourceStateAfter,
        masterSite: options.masterSite
    });

    if (contextName) {
        return 'Undo ' + baseLabel + ' for ' + contextName;
    }

    return 'Undo ' + baseLabel;
}

function resolveActionLabel(actionName) {
    const actionDefinition = actionMap[actionName];

    if (actionDefinition && actionDefinition.actionLabel) {
        return String(actionDefinition.actionLabel).trim();
    }

    return String(actionName || '')
        .split('_')
        .filter(Boolean)
        .map(function capitalizeWord(word) {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
}

function resolveContextName(options) {
    const collected = options.collected || {};
    const resourceStateAfter = options.resourceStateAfter || {};
    const resourceStateBefore = options.resourceStateBefore || {};

    const directName =
        pickName(collected.name) ||
        pickName(resourceStateAfter.name) ||
        pickName(resourceStateBefore.name);

    if (directName) {
        return directName;
    }

    const tagName =
        pickNameFromTags(collected.tags) ||
        pickNameFromTags(resourceStateAfter.tags) ||
        pickNameFromTags(resourceStateBefore.tags);

    if (tagName) {
        return tagName;
    }

    const masterSite = String(options.masterSite || '').trim();

    if (masterSite && masterSite.toLowerCase() !== 'cloud pilot') {
        return formatSiteLabel(masterSite);
    }

    return null;
}

function pickName(value) {
    const name = String(value || '').trim();
    return name || null;
}

function pickNameFromTags(tags) {
    if (!tags || typeof tags !== 'object' || Array.isArray(tags)) {
        return null;
    }

    const candidates = [tags.Name, tags.name, tags['Name']];

    for (let i = 0; i < candidates.length; i++) {
        const candidate = pickName(candidates[i]);

        if (candidate) {
            return candidate;
        }
    }

    return null;
}

function formatSiteLabel(masterSite) {
    const text = String(masterSite || '').trim();

    if (!text) {
        return null;
    }

    return text.charAt(0).toUpperCase() + text.slice(1);
}

module.exports = {
    buildHistoryActionNames
};
