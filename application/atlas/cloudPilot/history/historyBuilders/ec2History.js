/*
FUNCTIONS A: EC2 history builders — update_ec2_tag (Phase G)
    1) Function A1: buildUpdateEc2TagHistoryFields
*/

const TARGET_TYPE = 'ec2_instance';

//Function A1: Build history fields for update_ec2_tag (touched keys only)
function buildUpdateEc2TagHistoryFields(options) {
    const executionContext = options.executionContext || {};
    const executionResult = options.executionResult || {};
    const historyStatus = options.historyStatus || 'completed';
    const collected = (executionContext.state && executionContext.state.collected) || {};
    const atlasData = executionResult.atlasResponse || {};
    const defaults =
        executionContext.action && executionContext.action.defaults
            ? executionContext.action.defaults
            : {};

    const region = String(atlasData.region || collected.region || '').trim();
    const instanceId = String(atlasData.instance_id || collected.instance_id || '').trim();
    const tagKey = String(
        atlasData.tag_key || collected.tag_key || defaults.tag_key || ''
    ).trim();
    const tagValue = String(
        atlasData.tag_value != null ? atlasData.tag_value : (collected.tag_value || '')
    ).trim();

    const isCompleted = historyStatus === 'completed';

    if (!instanceId && !region && !tagKey) {
        return null;
    }

    if (isCompleted && (!instanceId || !region || !tagKey)) {
        return null;
    }

    const tagExistedBefore =
        atlasData.tag_existed_before === true ||
        (atlasData.previous_value != null && String(atlasData.previous_value).trim() !== '');

    const previousValue =
        atlasData.previous_value != null && String(atlasData.previous_value).trim() !== ''
            ? String(atlasData.previous_value)
            : null;

    const beforeTags = {};
    if (tagExistedBefore && previousValue != null) {
        beforeTags[tagKey] = previousValue;
    }

    const afterTags = {};
    if (tagKey && tagValue) {
        afterTags[tagKey] = tagValue;
    }

    const resourceStateBefore =
        Object.keys(beforeTags).length > 0
            ? {
                instance_id: instanceId || null,
                region: region || null,
                tags: beforeTags
            }
            : {
                instance_id: instanceId || null,
                region: region || null,
                tags: {}
            };

    const resourceStateAfter = {
        instance_id: instanceId || null,
        region: region || null,
        tags: afterTags
    };

    const undoAvailable = isCompleted && Boolean(instanceId && region && tagKey);

    const fields = {
        target_type: TARGET_TYPE,
        target_id: instanceId || tagKey || region,
        target_region: region || null,
        resource_state_before: resourceStateBefore,
        resource_state_after: resourceStateAfter,
        undo_available: undoAvailable,
        undo_payload: null
    };

    if (undoAvailable) {
        if (tagExistedBefore && previousValue != null) {
            fields.undo_payload = {
                type: 'restore_ec2_tag',
                instance_id: instanceId,
                region: region,
                tag_key: tagKey,
                tag_exists: true,
                tag_value: previousValue
            };
        } else {
            fields.undo_payload = {
                type: 'restore_ec2_tag',
                instance_id: instanceId,
                region: region,
                tag_key: tagKey,
                tag_exists: false
            };
        }
    }

    return fields;
}

module.exports = {
    buildUpdateEc2TagHistoryFields
};
