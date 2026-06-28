/*
FUNCTIONS A: Toggle EC2 history builder — target, snapshots, undo payload
    1) Function A1: buildToggleEc2HistoryFields
*/

const TARGET_TYPE = 'ec2_toggle_pair';

//Function A1: Build history fields for a toggle_ec2 execution
function buildToggleEc2HistoryFields(options) {
    const executionContext = options.executionContext || {};
    const executionResult = options.executionResult || {};
    const historyStatus = options.historyStatus || 'completed';
    const collected = (executionContext.state && executionContext.state.collected) || {};
    const atlasData = executionResult.atlasResponse || {};

    const region = String(
        atlasData.region || collected.region || ''
    ).trim();

    const primaryId = String(
        atlasData.primary_instance_id || collected.primary_instance_id || ''
    ).trim();

    const secondaryId = String(
        atlasData.secondary_instance_id || collected.secondary_instance_id || ''
    ).trim();

    const isCompleted = historyStatus === 'completed';

    if (!isCompleted && !primaryId && !secondaryId) {
        return null;
    }

    if (isCompleted && (!primaryId || !secondaryId)) {
        return null;
    }

    const targetId = buildTargetId(primaryId, secondaryId);
    const snapshots = buildBeforeAfterSnapshots(atlasData, primaryId, secondaryId, historyStatus);
    const undoAvailable = isCompleted;

    const fields = {
        target_type: TARGET_TYPE,
        target_id: targetId,
        target_region: region || null,
        resource_state_before: snapshots.before,
        resource_state_after: snapshots.after,
        undo_available: undoAvailable,
        undo_payload: null
    };

    if (undoAvailable) {
        fields.undo_payload = {
            type: 'toggle_ec2_restore',
            region: region,
            start_instance_id: primaryId,
            stop_instance_id: secondaryId
        };
    }

    return fields;
}

//Function B1: Before/after from Atlas response or toggle semantics
function buildBeforeAfterSnapshots(atlasData, primaryId, secondaryId, historyStatus) {
    const beforeFromAtlas = normalizeSnapshotBlock(atlasData.before, primaryId, secondaryId);
    const afterFromAtlas = normalizeSnapshotBlock(atlasData.after, primaryId, secondaryId);

    if (beforeFromAtlas && afterFromAtlas) {
        return {
            before: beforeFromAtlas,
            after: afterFromAtlas
        };
    }

    if (historyStatus !== 'completed') {
        return {
            before: buildSnapshot(primaryId, secondaryId, null, null),
            after: null
        };
    }

    return {
        before: buildSnapshot(primaryId, secondaryId, 'running', 'stopped'),
        after: buildSnapshot(primaryId, secondaryId, 'stopped', 'running')
    };
}

function normalizeSnapshotBlock(block, primaryId, secondaryId) {
    if (!block || typeof block !== 'object') {
        return null;
    }

    return buildSnapshot(
        primaryId,
        secondaryId,
        block.primary_state != null ? block.primary_state : block.primaryState,
        block.secondary_state != null ? block.secondary_state : block.secondaryState
    );
}

function buildTargetId(primaryId, secondaryId) {
    if (primaryId && secondaryId) {
        return primaryId + ':' + secondaryId;
    }

    return primaryId || secondaryId;
}

function buildSnapshot(primaryId, secondaryId, primaryState, secondaryState) {
    const snapshot = {
        primary_instance_id: primaryId,
        secondary_instance_id: secondaryId
    };

    if (primaryState != null) {
        snapshot.primary_state = primaryState;
    }

    if (secondaryState != null) {
        snapshot.secondary_state = secondaryState;
    }

    return snapshot;
}

module.exports = {
    buildToggleEc2HistoryFields
};
