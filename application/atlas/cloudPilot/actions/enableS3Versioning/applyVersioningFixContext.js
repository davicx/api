const ENABLE_S3_VERSIONING = 'enable_s3_versioning';

function applyVersioningFixContext(understanding, selectedFinding) {
    if (!understanding || !selectedFinding || typeof selectedFinding !== 'object') {
        return understanding;
    }

    if (selectedFinding.action !== ENABLE_S3_VERSIONING) {
        return understanding;
    }

    const bucketName = String(
        selectedFinding.bucketName || selectedFinding.bucket_name || ''
    ).trim();

    if (!bucketName) {
        return understanding;
    }

    const values = Object.assign({}, understanding.values || {});
    values.bucket_name = bucketName;

    if (selectedFinding.findingId) {
        values.finding_id = String(selectedFinding.findingId);
    }
    if (selectedFinding.ruleId) {
        values.rule_id = String(selectedFinding.ruleId);
    }
    if (selectedFinding.scanSnapshotId != null && selectedFinding.scanSnapshotId !== '') {
        values.scan_snapshot_id = selectedFinding.scanSnapshotId;
    }

    understanding.action = ENABLE_S3_VERSIONING;
    understanding.values = values;
    understanding.ambiguous = false;
    understanding.question = null;
    understanding.candidates = [ENABLE_S3_VERSIONING];
    understanding.source = 'selected_finding';

    return understanding;
}

module.exports = {
    applyVersioningFixContext
};
