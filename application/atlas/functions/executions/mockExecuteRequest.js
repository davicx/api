const FinishRequestFunctions = require('../requests/finishRequest');

/*
FUNCTIONS A: Mock Atlas/AWS execution (STEP 6 — scan_ec2 only for now)
    1) Function A1: mockExecuteRequest
*/

//Function A1: Simulate scan_ec2; close row on success or failure
async function mockExecuteRequest(decision, context) {
    const requestState = context.requestState || {};
    const workflowId = requestState.workflowId;
    const actionType = requestState.pendingAction;

    if (!workflowId) {
        return {
            ran: true,
            success: false,
            cloudPilotMessage: 'I could not find an open request to execute.',
            atlasResponse: null,
            request: null,
            error: 'no_open_request_id'
        };
    }

    if (actionType !== 'scan_ec2') {
        const finishOutcome = await FinishRequestFunctions.finishRequest(
            workflowId,
            'failed',
            'mock_not_implemented'
        );

        return {
            ran: true,
            success: false,
            cloudPilotMessage: 'Mock execution is not set up for this action yet.',
            atlasResponse: null,
            request: finishOutcome.request,
            error: 'mock_not_implemented'
        };
    }

    const collected = requestState.collected || {};
    let regionText = '';

    if (collected.region) {
        regionText = ' in ' + String(collected.region);
    }

    const atlasResponse = {
        status: 'completed',
        mock: true,
        action: 'scan_ec2',
        region: collected.region || null,
        findings: 4
    };

    const cloudPilotMessage =
        'EC2 scan completed (mock).' +
        regionText +
        '\nFound 4 resources requiring review.';

    const finishOutcome = await FinishRequestFunctions.finishRequest(
        workflowId,
        'completed',
        'success'
    );

    if (!finishOutcome.success) {
        return {
            ran: true,
            success: false,
            cloudPilotMessage:
                'The scan finished but I could not close the request row. Please try again.',
            atlasResponse: null,
            request: null,
            error: finishOutcome.error
        };
    }

    return {
        ran: true,
        success: true,
        cloudPilotMessage: cloudPilotMessage,
        atlasResponse: atlasResponse,
        request: finishOutcome.request,
        error: null
    };
}

module.exports = {
    mockExecuteRequest
};
