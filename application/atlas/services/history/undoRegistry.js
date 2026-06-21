const ChangeEC2Functions = require('../../capabilities/changes/changeEC2');
const { buildOutcomeMessage, getFirstOutcomeCode } = require('../chat/chatOutcomeRegistry');

/*
FUNCTIONS A: Undo payload execution — maps undo_payload.type → change capability
    1) Function A1: executeUndoPayload

FUNCTIONS B: Handlers
    1) Function B1: restoreToggleEc2
*/

const UNDO_HANDLERS = {
    toggle_ec2_restore: restoreToggleEc2
};

//Function A1: Dispatch undo_payload.type to the matching restore handler
async function executeUndoPayload(payload) {
    const undoType = payload && payload.type ? String(payload.type).trim() : '';
    const handler = UNDO_HANDLERS[undoType];

    if (typeof handler !== 'function') {
        return {
            success: false,
            cloudPilotMessage: 'That change cannot be undone yet.',
            error: 'unsupported_undo_payload',
            atlasResponse: null
        };
    }

    return handler(payload);
}

//Function B1: Reverse a toggle_ec2 change via Atlas /ec2/toggle
async function restoreToggleEc2(payload) {
    const region = String(payload.region || '').trim();
    const startInstanceId = String(payload.start_instance_id || '').trim();
    const stopInstanceId = String(payload.stop_instance_id || '').trim();

    if (!region || !startInstanceId || !stopInstanceId) {
        return {
            success: false,
            cloudPilotMessage: 'Undo payload is missing required toggle fields.',
            error: 'invalid_undo_payload',
            atlasResponse: null
        };
    }

    const requestBody = {
        region: region,
        targets: {
            primary_instance_id: stopInstanceId,
            secondary_instance_id: startInstanceId
        }
    };

    console.log('UNDO EXECUTION: Atlas toggle restore request body:');
    console.log(JSON.stringify(requestBody, null, 2));

    try {
        const atlasResponseRaw = await ChangeEC2Functions.toggleEC2(requestBody);

        if (
            atlasResponseRaw &&
            atlasResponseRaw.success === true &&
            atlasResponseRaw.data &&
            atlasResponseRaw.data.status === 'SUCCESS'
        ) {
            const primaryId =
                atlasResponseRaw.data.primary_instance_id || stopInstanceId;
            const secondaryId =
                atlasResponseRaw.data.secondary_instance_id || startInstanceId;
            const regionOut = atlasResponseRaw.data.region || region;

            return {
                success: true,
                cloudPilotMessage:
                    'Undo completed in ' +
                    regionOut +
                    '. Started ' +
                    startInstanceId +
                    ' and stopped ' +
                    stopInstanceId +
                    '.',
                error: null,
                atlasResponse: atlasResponseRaw.data
            };
        }

        const errCode = getFirstOutcomeCode(atlasResponseRaw);

        return {
            success: false,
            cloudPilotMessage: buildOutcomeMessage(errCode, {}, 'toggle_ec2'),
            error: errCode || 'undo_execution_failed',
            atlasResponse: null
        };
    } catch (error) {
        console.log('UNDO EXECUTION: Atlas toggle restore error');
        console.log(error);

        return {
            success: false,
            cloudPilotMessage: buildOutcomeMessage('atlas_unreachable', {}, 'toggle_ec2'),
            error: 'atlas_unreachable',
            atlasResponse: null
        };
    }
}

module.exports = {
    executeUndoPayload
};
