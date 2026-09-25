const TARGET_TYPE = 's3_bucket';

function buildEnableS3VersioningHistoryFields(options) {
    const executionContext = options.executionContext || {};
    const executionResult = options.executionResult || {};
    const collected = (executionContext.state && executionContext.state.collected) || {};
    const atlasData = executionResult.atlasResponse || {};
    const bucketName = String(atlasData.bucket_name || collected.bucket_name || '').trim();
    const region = String(atlasData.region || '').trim() || null;
    const before = String(atlasData.versioning_status_before || collected.versioning_status_before || '').trim() || null;
    const after = String(atlasData.versioning_status_after || '').trim() || null;
    const changed = atlasData.changed_by_cloudpilot === true || atlasData.changed === true;

    if (!bucketName) {
        return null;
    }

    return {
        target_type: TARGET_TYPE,
        target_id: bucketName,
        target_region: region,
        resource_state_before: {
            bucket_name: bucketName,
            region: region,
            versioning_status: before,
            finding_id: collected.finding_id || null,
            scan_snapshot_id: collected.scan_snapshot_id || null
        },
        resource_state_after: {
            bucket_name: bucketName,
            region: region,
            versioning_status: after,
            changed: changed,
            verified: atlasData.verified === true
        },
        undo_available: false,
        undo_payload: null
    };
}

module.exports = {
    buildEnableS3VersioningHistoryFields
};
