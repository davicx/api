const AtlasTimeFunctions = require('../../../functions/atlasTimeFunctions');

/*
FUNCTIONS A: Request naming — internal key + default display name
    1) Function A1: buildDisplayNameInternal
    2) Function A2: buildDefaultDisplayName
    3) Function A3: resolveRegionSegment
*/

//Function A1: CloudPilot-generated unique request key (UTC, never updated)
//Format: {action_type}_{region_or_global}_{yyyymmdd_hhmmss}_{request_id}
function buildDisplayNameInternal(options) {
    const actionType = String(options.actionType || '').trim().toLowerCase();
    const requestId = Number(options.requestId);
    const collected = options.collected || {};
    const regionSegment = resolveRegionSegment(collected);
    const timestampSegment = AtlasTimeFunctions.formatUtcCompactTimestamp(options.createdAt);

    return actionType + '_' + regionSegment + '_' + timestampSegment + '_' + requestId;
}

//Function A2: Default user-facing name when user did not provide one
//Format: {requested_by_user} {Action Name} on {Friendly Date}
function buildDefaultDisplayName(options) {
    const requestedByUser = String(options.requestedByUser || '').trim();
    const actionLabel = String(options.actionLabel || '').trim();
    const friendlyDate = AtlasTimeFunctions.formatFriendlyMonthDay(options.createdAt);

    return requestedByUser + ' ' + actionLabel + ' on ' + friendlyDate;
}

//Function A3: Region from collected fields, or global when missing (MVP)
function resolveRegionSegment(collected) {
    const region = String(collected.region || '').trim();

    if (region) {
        return region;
    }

    return 'global';
}

module.exports = {
    buildDisplayNameInternal,
    buildDefaultDisplayName,
    resolveRegionSegment
};
