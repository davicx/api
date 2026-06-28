/*
FUNCTIONS A: Create EC2 history builder — target, snapshots, undo payload
    1) Function A1: buildCreateEc2HistoryFields
*/

const TARGET_TYPE = 'ec2_instance';

//Function A1: Build history fields for a create_ec2 execution
function buildCreateEc2HistoryFields(options) {
    const executionContext = options.executionContext || {};
    const executionResult = options.executionResult || {};
    const historyStatus = options.historyStatus || 'completed';
    const collected = (executionContext.state && executionContext.state.collected) || {};
    const atlasData = executionResult.atlasResponse || {};

    const region = String(atlasData.region || collected.region || '').trim();
    const instanceId = String(atlasData.instance_id || '').trim();
    const name = String(atlasData.name || collected.name || '').trim();
    const instanceType = String(
        atlasData.instance_type || collected.instance_type || ''
    ).trim();

    const isCompleted = historyStatus === 'completed';

    if (isCompleted && !instanceId) {
        return null;
    }

    if (!isCompleted && !instanceId && !name && !region) {
        return null;
    }

    const targetId = instanceId || name || region;
    const resourceStateAfter = buildResourceStateAfter({
        instanceId: instanceId,
        region: region,
        name: name,
        instanceType: instanceType,
        tags: resolveTags(atlasData, collected)
    });

    const undoAvailable = isCompleted && Boolean(instanceId && region);

    const fields = {
        target_type: TARGET_TYPE,
        target_id: targetId,
        target_region: region || null,
        resource_state_before: null,
        resource_state_after: resourceStateAfter,
        undo_available: undoAvailable,
        undo_payload: null
    };

    if (undoAvailable) {
        fields.undo_payload = {
            type: 'delete_ec2_undo',
            region: region,
            instance_id: instanceId
        };
    }

    return fields;
}

function buildResourceStateAfter(options) {
    const snapshot = {};

    if (options.instanceId) {
        snapshot.instance_id = options.instanceId;
    }

    if (options.region) {
        snapshot.region = options.region;
    }

    if (options.name) {
        snapshot.name = options.name;
    }

    if (options.instanceType) {
        snapshot.instance_type = options.instanceType;
    }

    if (options.tags && Object.keys(options.tags).length > 0) {
        snapshot.tags = options.tags;
    }

    return Object.keys(snapshot).length > 0 ? snapshot : null;
}

function resolveTags(atlasData, collected) {
    const atlasTags = atlasData && atlasData.tags;
    const collectedTags = collected && collected.tags;

    if (atlasTags && typeof atlasTags === 'object' && !Array.isArray(atlasTags)) {
        return { ...atlasTags };
    }

    if (collectedTags && typeof collectedTags === 'object' && !Array.isArray(collectedTags)) {
        return { ...collectedTags };
    }

    return {};
}

module.exports = {
    buildCreateEc2HistoryFields
};
