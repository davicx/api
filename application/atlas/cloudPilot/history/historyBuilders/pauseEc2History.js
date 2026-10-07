/*
FUNCTIONS A: Pause EC2 history builder — target, snapshots, undo payload
    1) Function A1: buildPauseEc2HistoryFields
*/

const TARGET_TYPE = 'ec2_instance';

//Function A1: Build history fields for a pause_ec2 execution
function buildPauseEc2HistoryFields(options) {
    const executionContext = options.executionContext || {};
    const executionResult = options.executionResult || {};
    const historyStatus = options.historyStatus || 'completed';
    const collected = (executionContext.state && executionContext.state.collected) || {};
    const atlasData = executionResult.atlasResponse || {};

    const region = String(atlasData.region || collected.region || '').trim();
    const instanceId = String(
        atlasData.instance_id || collected.instance_id || ''
    ).trim();
    const stateBefore = String(atlasData.state_before || '').trim() || null;
    const stateAfter = String(atlasData.state_after || '').trim() || null;
    const isNoop = atlasData.noop === true;
    const changedByCloudPilot = atlasData.changed_by_cloudpilot === true;

    const isCompleted = historyStatus === 'completed';

    if (isCompleted && (!instanceId || !region)) {
        return null;
    }

    if (!isCompleted && !instanceId && !region) {
        return null;
    }

    const resourceStateBefore = buildStateSnapshot({
        instanceId: instanceId,
        region: region,
        state: stateBefore,
        stateBefore: stateBefore,
        stateAfter: stateAfter,
        noop: isNoop,
        changedByCloudPilot: changedByCloudPilot
    });

    const resourceStateAfter = buildStateSnapshot({
        instanceId: instanceId,
        region: region,
        state: stateAfter || (isCompleted ? 'stopped' : null),
        stateBefore: stateBefore,
        stateAfter: stateAfter || (isCompleted ? 'stopped' : null),
        noop: isNoop,
        changedByCloudPilot: changedByCloudPilot
    });

    const undoAvailable = isCompleted && changedByCloudPilot && Boolean(instanceId && region);

    const fields = {
        target_type: TARGET_TYPE,
        target_id: instanceId || region,
        target_region: region || null,
        resource_state_before: resourceStateBefore,
        resource_state_after: resourceStateAfter,
        undo_available: undoAvailable,
        undo_payload: null
    };

    if (undoAvailable) {
        fields.undo_payload = {
            type: 'pause_ec2_undo',
            region: region,
            instance_id: instanceId
        };
    }

    return fields;
}

function buildStateSnapshot(options) {
    const snapshot = {
        instance_id: options.instanceId || null,
        region: options.region || null,
        noop: options.noop === true,
        changed_by_cloudpilot: options.changedByCloudPilot === true
    };

    if (options.state) {
        snapshot.state = options.state;
    }

    if (options.stateBefore) {
        snapshot.state_before = options.stateBefore;
    }

    if (options.stateAfter) {
        snapshot.state_after = options.stateAfter;
    }

    return snapshot;
}

module.exports = {
    buildPauseEc2HistoryFields
};
