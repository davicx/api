const ChangeEC2Functions = require('../../providers/atlas/ec2/changeEC2');
const { buildOutcomeMessage, getFirstOutcomeCode } = require('../execution/outcomes/outcomeRegistry');

/*
FUNCTIONS A: Undo payload execution — maps undo_payload.type → change capability
    1) Function A1: executeUndoPayload

FUNCTIONS B: Handlers
    1) Function B1: restoreToggleEc2
    2) Function B2: deleteCreatedEc2
    3) Function B3: restoreEc2Tag
    4) Function B4: undoPauseEc2
    5) Function B5: undoResumeEc2
*/

const UNDO_HANDLERS = {
    toggle_ec2_restore: restoreToggleEc2,
    delete_ec2_undo: deleteCreatedEc2,
    restore_ec2_tag: restoreEc2Tag,
    pause_ec2_undo: undoPauseEc2,
    resume_ec2_undo: undoResumeEc2
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

//Function B2: Undo create_ec2 by terminating the created instance
async function deleteCreatedEc2(payload) {
    const region = String(payload.region || '').trim();
    const instanceId = String(payload.instance_id || '').trim();

    if (!region || !instanceId) {
        return {
            success: false,
            cloudPilotMessage: 'Undo payload is missing required delete fields.',
            error: 'invalid_undo_payload',
            atlasResponse: null
        };
    }

    const requestBody = {
        region: region,
        instance_id: instanceId
    };

    console.log('UNDO EXECUTION: Atlas delete created instance request body:');
    console.log(JSON.stringify(requestBody, null, 2));

    try {
        const atlasResponseRaw = await ChangeEC2Functions.deleteEC2(requestBody);

        if (
            atlasResponseRaw &&
            atlasResponseRaw.success === true &&
            atlasResponseRaw.data &&
            atlasResponseRaw.data.instance_id
        ) {
            const instanceIdOut = atlasResponseRaw.data.instance_id;
            const regionOut = atlasResponseRaw.data.region || region;
            const stateOut = atlasResponseRaw.data.state || 'terminating';

            return {
                success: true,
                cloudPilotMessage:
                    'Undo completed. Termination requested for ' +
                    instanceIdOut +
                    ' in ' +
                    regionOut +
                    ' (' +
                    stateOut +
                    ').',
                error: null,
                atlasResponse: atlasResponseRaw.data
            };
        }

        const errCode = getFirstOutcomeCode(atlasResponseRaw);

        return {
            success: false,
            cloudPilotMessage: buildOutcomeMessage(errCode, {}, 'delete_ec2'),
            error: errCode || 'undo_execution_failed',
            atlasResponse: null
        };
    } catch (error) {
        console.log('UNDO EXECUTION: Atlas delete created instance error');
        console.log(error);

        return {
            success: false,
            cloudPilotMessage: buildOutcomeMessage('atlas_unreachable', {}, 'delete_ec2'),
            error: 'atlas_unreachable',
            atlasResponse: null
        };
    }
}

//Function B3: Restore EC2 tag to desired end state (write value or delete key)
async function restoreEc2Tag(payload) {
    const region = String(payload.region || '').trim();
    const instanceId = String(payload.instance_id || '').trim();
    const tagKey = String(payload.tag_key || '').trim();
    const tagExists = payload.tag_exists === true;
    const tagValue =
        payload.tag_value != null ? String(payload.tag_value).trim() : '';

    if (!region || !instanceId || !tagKey) {
        return {
            success: false,
            cloudPilotMessage: 'Undo payload is missing required tag fields.',
            error: 'invalid_undo_payload',
            atlasResponse: null
        };
    }

    if (tagExists && !tagValue) {
        return {
            success: false,
            cloudPilotMessage: 'Undo payload is missing the prior tag value.',
            error: 'invalid_undo_payload',
            atlasResponse: null
        };
    }

    try {
        if (tagExists) {
            const requestBody = {
                region: region,
                instance_id: instanceId,
                tag_key: tagKey,
                tag_value: tagValue
            };

            console.log('UNDO EXECUTION: Atlas restore tag (write) request body:');
            console.log(JSON.stringify(requestBody, null, 2));

            const atlasResponseRaw = await ChangeEC2Functions.updateEC2Tag(requestBody);

            if (
                atlasResponseRaw &&
                atlasResponseRaw.success === true &&
                atlasResponseRaw.data &&
                atlasResponseRaw.data.tag_key
            ) {
                return {
                    success: true,
                    cloudPilotMessage:
                        'Undo completed. Restored tag ' +
                        tagKey +
                        ' to ' +
                        tagValue +
                        ' on ' +
                        instanceId +
                        ' in ' +
                        region +
                        '.',
                    error: null,
                    atlasResponse: atlasResponseRaw.data
                };
            }

            const errCode = getFirstOutcomeCode(atlasResponseRaw);

            return {
                success: false,
                cloudPilotMessage: buildOutcomeMessage(errCode, {}, 'update_ec2_tag'),
                error: errCode || 'undo_execution_failed',
                atlasResponse: null
            };
        }

        const deleteBody = {
            region: region,
            instance_id: instanceId,
            tag_key: tagKey
        };

        console.log('UNDO EXECUTION: Atlas restore tag (delete) request body:');
        console.log(JSON.stringify(deleteBody, null, 2));

        const atlasResponseRaw = await ChangeEC2Functions.deleteEC2Tag(deleteBody);

        if (atlasResponseRaw && atlasResponseRaw.success === true && atlasResponseRaw.data) {
            return {
                success: true,
                cloudPilotMessage:
                    'Undo completed. Removed tag ' +
                    tagKey +
                    ' from ' +
                    instanceId +
                    ' in ' +
                    region +
                    '.',
                error: null,
                atlasResponse: atlasResponseRaw.data
            };
        }

        const errCode = getFirstOutcomeCode(atlasResponseRaw);

        return {
            success: false,
            cloudPilotMessage: buildOutcomeMessage(errCode, {}, 'update_ec2_tag'),
            error: errCode || 'undo_execution_failed',
            atlasResponse: null
        };
    } catch (error) {
        console.log('UNDO EXECUTION: Atlas restore tag error');
        console.log(error);

        return {
            success: false,
            cloudPilotMessage: buildOutcomeMessage('atlas_unreachable', {}, 'update_ec2_tag'),
            error: 'atlas_unreachable',
            atlasResponse: null
        };
    }
}

//Function B4: Undo pause_ec2 by resuming the instance via Atlas /ec2/resume
async function undoPauseEc2(payload) {
    const region = String(payload.region || '').trim();
    const instanceId = String(payload.instance_id || '').trim();

    if (!region || !instanceId) {
        return {
            success: false,
            cloudPilotMessage: 'Undo payload is missing required pause fields.',
            error: 'invalid_undo_payload',
            atlasResponse: null
        };
    }

    const requestBody = {
        region: region,
        instance_id: instanceId
    };

    console.log('UNDO EXECUTION: Atlas pause undo (resume) request body:');
    console.log(JSON.stringify(requestBody, null, 2));

    try {
        const atlasResponseRaw = await ChangeEC2Functions.resumeEC2(requestBody);

        if (
            atlasResponseRaw &&
            atlasResponseRaw.success === true &&
            atlasResponseRaw.data &&
            atlasResponseRaw.data.instance_id
        ) {
            const atlasData = atlasResponseRaw.data;
            const instanceIdOut = atlasData.instance_id;
            const regionOut = atlasData.region || region;
            const stateAfter = atlasData.state_after || 'running';

            return {
                success: true,
                cloudPilotMessage:
                    'Undo completed. Resumed ' +
                    instanceIdOut +
                    ' in ' +
                    regionOut +
                    ' (now ' +
                    stateAfter +
                    ').',
                error: null,
                atlasResponse: atlasData
            };
        }

        const errCode = getFirstOutcomeCode(atlasResponseRaw);

        return {
            success: false,
            cloudPilotMessage: buildOutcomeMessage(errCode, {}, 'resume_ec2'),
            error: errCode || 'undo_execution_failed',
            atlasResponse: null
        };
    } catch (error) {
        console.log('UNDO EXECUTION: Atlas pause undo error');
        console.log(error);

        return {
            success: false,
            cloudPilotMessage: buildOutcomeMessage('atlas_unreachable', {}, 'resume_ec2'),
            error: 'atlas_unreachable',
            atlasResponse: null
        };
    }
}

//Function B5: Undo resume_ec2 by pausing the instance via Atlas /ec2/pause
async function undoResumeEc2(payload) {
    const region = String(payload.region || '').trim();
    const instanceId = String(payload.instance_id || '').trim();

    if (!region || !instanceId) {
        return {
            success: false,
            cloudPilotMessage: 'Undo payload is missing required resume fields.',
            error: 'invalid_undo_payload',
            atlasResponse: null
        };
    }

    const requestBody = {
        region: region,
        instance_id: instanceId
    };

    console.log('UNDO EXECUTION: Atlas resume undo (pause) request body:');
    console.log(JSON.stringify(requestBody, null, 2));

    try {
        const atlasResponseRaw = await ChangeEC2Functions.pauseEC2(requestBody);

        if (
            atlasResponseRaw &&
            atlasResponseRaw.success === true &&
            atlasResponseRaw.data &&
            atlasResponseRaw.data.instance_id
        ) {
            const atlasData = atlasResponseRaw.data;
            const instanceIdOut = atlasData.instance_id;
            const regionOut = atlasData.region || region;
            const stateAfter = atlasData.state_after || 'stopped';

            return {
                success: true,
                cloudPilotMessage:
                    'Undo completed. Paused ' +
                    instanceIdOut +
                    ' in ' +
                    regionOut +
                    ' (now ' +
                    stateAfter +
                    ').',
                error: null,
                atlasResponse: atlasData
            };
        }

        const errCode = getFirstOutcomeCode(atlasResponseRaw);

        return {
            success: false,
            cloudPilotMessage: buildOutcomeMessage(errCode, {}, 'pause_ec2'),
            error: errCode || 'undo_execution_failed',
            atlasResponse: null
        };
    } catch (error) {
        console.log('UNDO EXECUTION: Atlas resume undo error');
        console.log(error);

        return {
            success: false,
            cloudPilotMessage: buildOutcomeMessage('atlas_unreachable', {}, 'pause_ec2'),
            error: 'atlas_unreachable',
            atlasResponse: null
        };
    }
}

module.exports = {
    executeUndoPayload
};
