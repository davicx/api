const EnableS3Versioning = require('../../../providers/atlas/s3/enableS3Versioning');
const {
    buildOutcomeMessage,
    getFirstOutcomeCode,
    buildActionOutcomeContext
} = require('../../execution/outcomes/outcomeRegistry');

const COST_SUMMARY =
    'Enabling versioning has no separate activation fee, but retained object versions can increase S3 storage costs.';

async function enableS3VersioningHandler(context) {
    try {
        const collected = (context && context.state && context.state.collected) || {};
        const bucketName = String(collected.bucket_name || '').trim();

        if (!bucketName) {
            return {
                success: false,
                cloudPilotMessage: buildOutcomeMessage(
                    'missing_bucket_name',
                    { bucket_name: '' },
                    'enable_s3_versioning'
                ),
                error: 'missing_bucket_name',
                atlasResponse: null
            };
        }

        const atlasResponseRaw = await EnableS3Versioning.enableS3Versioning({
            bucket_name: bucketName
        });
        const atlasData = atlasResponseRaw && atlasResponseRaw.data ? atlasResponseRaw.data : null;
        const verified = atlasData && atlasData.verified === true;
        const after = atlasData ? String(atlasData.versioning_status_after || '') : '';

        if (atlasResponseRaw && atlasResponseRaw.success === true && verified && after === 'enabled') {
            return {
                success: true,
                cloudPilotMessage: buildSuccessMessage(bucketName, atlasData, collected),
                error: null,
                atlasResponse: atlasData
            };
        }

        const errCode = getFirstOutcomeCode(atlasResponseRaw) || 'versioning_not_verified';
        const outcomeContext = buildActionOutcomeContext(collected, atlasResponseRaw);
        outcomeContext.bucket_name = bucketName;
        outcomeContext.detail =
            (atlasResponseRaw && atlasResponseRaw.message) ||
            'CloudPilot could not verify the final versioning state.';

        return {
            success: false,
            cloudPilotMessage: buildOutcomeMessage(errCode, outcomeContext, 'enable_s3_versioning'),
            error: errCode,
            atlasResponse: atlasData
        };
    } catch (error) {
        return {
            success: false,
            cloudPilotMessage: buildOutcomeMessage('atlas_unreachable', {}, 'enable_s3_versioning'),
            error: 'atlas_unreachable',
            atlasResponse: null
        };
    }
}

function buildSuccessMessage(bucketName, atlasData, collected) {
    const before = stateLabel(atlasData.versioning_status_before);
    const costSummary = String(collected.cost_impact_summary || COST_SUMMARY).trim();

    if (atlasData.changed === false || atlasData.noop === true) {
        return (
            'Versioning is already enabled for ' +
            bucketName +
            '. CloudPilot did not change the bucket.'
        );
    }

    return (
        'Enabled versioning for ' +
        bucketName +
        '.\n\n' +
        'Previous: ' +
        before +
        '\n' +
        'Current: Enabled\n\n' +
        'Versioning helps with future overwrites and deletions. It does not recover objects deleted before it was enabled.\n\n' +
        'Cost impact: Possible increase. ' +
        costSummary
    );
}

function stateLabel(state) {
    if (state === 'suspended') {
        return 'Suspended';
    }
    if (state === 'never_versioned') {
        return 'Never versioned';
    }
    if (state === 'enabled') {
        return 'Enabled';
    }
    return 'Unknown';
}

module.exports = enableS3VersioningHandler;
