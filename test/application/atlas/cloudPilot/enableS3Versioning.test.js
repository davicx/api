jest.mock('../../../../application/atlas/providers/atlas/s3/enableS3Versioning', () => ({
    readS3Versioning: jest.fn(),
    enableS3Versioning: jest.fn()
}));

const EnableS3Versioning = require('../../../../application/atlas/providers/atlas/s3/enableS3Versioning');
const enableS3VersioningHandler = require('../../../../application/atlas/cloudPilot/actions/enableS3Versioning/enableS3VersioningHandler');
const {
    applyVersioningFixContext
} = require('../../../../application/atlas/cloudPilot/actions/enableS3Versioning/applyVersioningFixContext');
const actionMap = require('../../../../application/atlas/cloudPilot/masterCloudPilotCapabilities');
const { decideNextStep } = require('../../../../application/atlas/cloudPilot/decide/masterDecision');
const { RESPONSE_TYPE } = require('../../../../application/atlas/cloudPilot/requests/decisionTypes');
const { getRequestMessageReply } = require('../../../../application/atlas/cloudPilot/chat/templates/requestTemplates');

function emptyRequestState() {
    return {
        pendingAction: null,
        status: null,
        executionMode: null,
        workflowId: null,
        missing: [],
        collected: {},
        asked: {}
    };
}

describe('enable_s3_versioning', () => {
    beforeEach(() => {
        EnableS3Versioning.enableS3Versioning.mockReset();
    });

    test('is a confirmed change with bucket_name and cost metadata', () => {
        const capability = actionMap.enable_s3_versioning;

        expect(capability.requestType).toBe('change');
        expect(capability.permission).toBe('confirmation');
        expect(capability.requiredFields).toEqual(['bucket_name']);
        expect(capability.costImpact.classification).toBe('possible_increase');
        expect(capability.costImpact.estimateAvailable).toBe(false);
        expect(capability.allowed).toBe(true);
    });

    test('rejects a change capability without cost metadata', () => {
        expect(() => {
            actionMap.validateChangeCostImpact({
                example_change: {
                    requestType: 'change'
                }
            });
        }).toThrow(/missing costImpact/);
    });

    test('fix context becomes the stored bucket and finding', () => {
        const understanding = applyVersioningFixContext(
            {
                action: 'general_chat',
                values: {},
                ambiguous: true,
                question: 's3_inventory',
                candidates: []
            },
            {
                action: 'enable_s3_versioning',
                bucketName: 'kite-assets',
                findingId: 's3-versioning-off-kite-assets',
                ruleId: 's3_versioning_disabled',
                scanSnapshotId: 15
            }
        );

        const decision = decideNextStep({
            understanding: understanding,
            requestState: emptyRequestState()
        });

        expect(decision.response.type).toBe(RESPONSE_TYPE.AWAITING_CONFIRMATION);
        expect(decision.request.collected.bucket_name).toBe('kite-assets');
        expect(decision.request.collected.finding_id).toBe('s3-versioning-off-kite-assets');
        expect(decision.request.collected.scan_snapshot_id).toBe(15);
        expect(decision.request.executionMode).toBeFalsy();
    });

    test('confirmation names the bucket, state, and possible cost increase', async () => {
        const reply = await getRequestMessageReply({
            actionEvent: 'awaiting_confirmation',
            actionDefinition: actionMap.enable_s3_versioning,
            actionState: {
                collectedFields: {
                    bucket_name: 'kite-assets',
                    versioning_status_before: 'never_versioned',
                    cost_impact_summary:
                        'Enabling versioning has no separate activation fee, but retained object versions can increase S3 storage costs.'
                }
            }
        });

        expect(reply.message).toContain('Enable versioning for kite-assets?');
        expect(reply.message).toContain('Current: Never versioned');
        expect(reply.message).toContain('Proposed: Enabled');
        expect(reply.message).toContain('Cost impact: Possible increase.');
        expect(reply.message).toContain('CloudPilot automatic fix');
        expect(reply.message).not.toContain('1. Instructions');
    });

    test('cancel while waiting does not call the versioning operation', () => {
        const decision = decideNextStep({
            understanding: {
                action: null,
                values: {},
                replyType: 'cancel',
                openRequestEffect: { type: 'cancel' },
                openRequestEffectResult: {
                    affectsOpenRequest: true,
                    openRequestEffect: { type: 'cancel' }
                }
            },
            requestState: {
                pendingAction: 'enable_s3_versioning',
                status: 'waiting_on_confirmation',
                executionMode: null,
                workflowId: 4,
                missing: [],
                collected: { bucket_name: 'kite-assets' },
                asked: {}
            }
        });

        expect(decision.response.type).toBe(RESPONSE_TYPE.REQUEST_CANCELLED);
        expect(decision.closeRequest).toBe(true);
        expect(EnableS3Versioning.enableS3Versioning).not.toHaveBeenCalled();
    });

    test('handler enables a bucket once and reports the verified state', async () => {
        EnableS3Versioning.enableS3Versioning.mockResolvedValue({
            success: true,
            data: {
                bucket_name: 'kite-assets',
                versioning_status_before: 'never_versioned',
                versioning_status_after: 'enabled',
                changed: true,
                noop: false,
                verified: true
            }
        });

        const result = await enableS3VersioningHandler({
            state: {
                collected: {
                    bucket_name: 'kite-assets',
                    cost_impact_summary: 'Retained versions can increase storage costs.'
                }
            }
        });

        expect(EnableS3Versioning.enableS3Versioning).toHaveBeenCalledTimes(1);
        expect(result.success).toBe(true);
        expect(result.cloudPilotMessage).toContain('Enabled versioning for kite-assets');
        expect(result.cloudPilotMessage).toContain('Previous: Never versioned');
        expect(result.atlasResponse.verified).toBe(true);
    });

    test('handler reports an already enabled bucket without describing a change', async () => {
        EnableS3Versioning.enableS3Versioning.mockResolvedValue({
            success: true,
            data: {
                bucket_name: 'kite-assets',
                versioning_status_before: 'enabled',
                versioning_status_after: 'enabled',
                changed: false,
                noop: true,
                verified: true
            }
        });

        const result = await enableS3VersioningHandler({
            state: { collected: { bucket_name: 'kite-assets' } }
        });

        expect(result.success).toBe(true);
        expect(result.cloudPilotMessage).toContain('already enabled');
        expect(result.cloudPilotMessage).toContain('did not change');
    });

    test('handler cannot succeed when verification fails', async () => {
        EnableS3Versioning.enableS3Versioning.mockResolvedValue({
            success: false,
            message: 'Observed state: never_versioned.',
            errors: ['versioning_not_verified'],
            data: {}
        });

        const result = await enableS3VersioningHandler({
            state: { collected: { bucket_name: 'kite-assets' } }
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe('versioning_not_verified');
        expect(result.cloudPilotMessage).toContain('could not verify');
    });
});
