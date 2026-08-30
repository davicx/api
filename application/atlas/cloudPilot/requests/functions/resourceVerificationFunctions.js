const actionMap = require('../../actionMap');
const ChangeEC2Functions = require('../../../providers/atlas/ec2/changeEC2');
const Request = require('../classes/Request');
const RequestFunctions = require('./requestFunctions');
const RequestStateFunctions = require('./requestLoadFunctions');
const ActionStatusFunctions = require('./requestStatusFunctions');
const { RESPONSE_TYPE } = require('../decisionTypes');

/*
FUNCTIONS A: Existing-resource preflight (Atlas truth — not Intelligence)
    1) Function A1: runVerifyResourcePreflight
    2) Function A2: verifyActionResource

HELPERS
    1) Helper H1: stashVerifiedInstanceType

Doc: doc/development/finished/feature_verify_request.md (Steps 2–3)
*/

//Function A1: After store, before mode speech — gate pause/resume (etc.) on Atlas verify
async function runVerifyResourcePreflight(decision, requestState) {
    const outcome = {
        decision: decision,
        requestState: requestState,
        blocked: false,
        verification: null
    };

    if (!decision || !decision.response || !requestState || !requestState.pendingAction) {
        return outcome;
    }

    const responseType = decision.response.type;
    const shouldGate =
        responseType === RESPONSE_TYPE.AWAITING_EXECUTION_MODE ||
        responseType === RESPONSE_TYPE.AWAITING_CONFIRMATION;

    if (!shouldGate) {
        return outcome;
    }

    // Already past mode selection (e.g. automatic confirmation) — preflight ran earlier
    if (requestState.executionMode) {
        return outcome;
    }

    if ((requestState.missing || []).length > 0) {
        return outcome;
    }

    const actionDefinition = actionMap[requestState.pendingAction];

    if (!actionDefinition || !actionDefinition.verifyResource) {
        return outcome;
    }

    const verification = await verifyActionResource(
        actionDefinition,
        requestState.collected || {}
    );
    outcome.verification = verification;

    if (verification.outcome === 'found') {
        const enrichedState = await stashVerifiedInstanceType(
            requestState,
            verification
        );

        if (enrichedState) {
            outcome.requestState = enrichedState;
        }

        return outcome;
    }

    outcome.blocked = true;

    if (verification.outcome === 'not_found') {
        decision.response = {
            type: RESPONSE_TYPE.RESOURCE_NOT_FOUND,
            verifyResource: verification
        };

        // Keep request open for yes/no scan offer (Step 3)
        if (requestState.workflowId) {
            const updateOutcome = await Request.updateAction(requestState.workflowId, {
                status: ActionStatusFunctions.STATUS.WAITING_ON_RESOURCE_SCAN
            });

            if (updateOutcome.success && updateOutcome.action) {
                outcome.requestState = RequestStateFunctions.mapActionToState(updateOutcome.action);
            } else {
                outcome.requestState = Object.assign({}, requestState, {
                    status: ActionStatusFunctions.STATUS.WAITING_ON_RESOURCE_SCAN,
                    executionMode: null
                });
            }
        }

        return outcome;
    }

    // Atlas/AWS error — stop; do not offer scan as if the target is absent
    decision.response = {
        type: RESPONSE_TYPE.RESOURCE_VERIFY_FAILED,
        verifyResource: verification
    };

    if (requestState.workflowId) {
        await RequestFunctions.finishRequest(
            requestState.workflowId,
            ActionStatusFunctions.STATUS.FAILED,
            'resource_verify_failed'
        );
    }

    outcome.requestState = {
        pendingAction: null,
        status: null,
        executionMode: null,
        workflowId: null,
        missing: [],
        collected: {},
        asked: {}
    };

    return outcome;
}

//Function A2: Read verifyResource metadata → Atlas provider → found | not_found | error
async function verifyActionResource(actionDefinition, collectedFields) {
    const meta = actionDefinition.verifyResource;
    const collected = collectedFields || {};

    if (!meta || !meta.resourceType) {
        return {
            outcome: 'error',
            message: 'Action is missing verifyResource metadata.',
            atlasResponse: null
        };
    }

    if (meta.resourceType !== 'ec2') {
        return {
            outcome: 'error',
            message: 'Resource verification is not supported for this resource type yet.',
            atlasResponse: null
        };
    }

    const regionField = meta.regionField ? String(meta.regionField).trim() : '';
    const region = regionField ? String(collected[regionField] || '').trim() : '';
    const targets = Array.isArray(meta.targets) ? meta.targets : [];

    if (!region) {
        return {
            outcome: 'error',
            message: 'Region is required to verify the EC2 instance.',
            atlasResponse: null
        };
    }

    if (targets.length === 0) {
        return {
            outcome: 'error',
            message: 'Action verifyResource.targets is empty.',
            atlasResponse: null
        };
    }

    let lastAtlasResponse = null;

    for (let i = 0; i < targets.length; i++) {
        const idField = targets[i] && targets[i].idField
            ? String(targets[i].idField).trim()
            : '';
        const instanceId = idField ? String(collected[idField] || '').trim() : '';

        if (!instanceId) {
            return {
                outcome: 'error',
                message: 'Instance id is required to verify the EC2 instance.',
                atlasResponse: null
            };
        }

        const atlasResponse = await ChangeEC2Functions.verifyEC2({
            region: region,
            instance_id: instanceId
        });
        lastAtlasResponse = atlasResponse;

        if (!atlasResponse || atlasResponse.success !== true) {
            return {
                outcome: 'error',
                message:
                    (atlasResponse && atlasResponse.message) ||
                    'Could not verify that EC2 instance with Atlas.',
                atlasResponse: atlasResponse || null
            };
        }

        const exists = atlasResponse.data && atlasResponse.data.exists === true;

        if (!exists) {
            return {
                outcome: 'not_found',
                message:
                    (atlasResponse && atlasResponse.message) ||
                    'EC2 instance was not found.',
                atlasResponse: atlasResponse
            };
        }
    }

    return {
        outcome: 'found',
        message: 'EC2 instance was found.',
        atlasResponse: lastAtlasResponse
    };
}

//Helper H1: Persist Atlas instance_type onto the open request (for pause cost speak)
async function stashVerifiedInstanceType(requestState, verification) {
    const atlasData =
        verification &&
        verification.atlasResponse &&
        verification.atlasResponse.data
            ? verification.atlasResponse.data
            : null;
    const instanceType =
        atlasData && atlasData.instance_type != null
            ? String(atlasData.instance_type).trim()
            : '';

    if (!instanceType || !requestState || !requestState.workflowId) {
        return null;
    }

    const collected = Object.assign({}, requestState.collected || {});

    if (String(collected.instance_type || '').trim() === instanceType) {
        return null;
    }

    collected.instance_type = instanceType;

    const updateOutcome = await Request.updateAction(requestState.workflowId, {
        collected: collected
    });

    if (!updateOutcome.success || !updateOutcome.action) {
        return Object.assign({}, requestState, { collected: collected });
    }

    return RequestStateFunctions.mapActionToState(updateOutcome.action);
}

module.exports = {
    runVerifyResourcePreflight,
    verifyActionResource
};
