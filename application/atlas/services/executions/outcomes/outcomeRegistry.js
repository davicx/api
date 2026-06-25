/*
Execution outcome messages — friendly copy for handler success/failure results.
*/

const OUTCOME_MESSAGES = {
    instance_not_found:
        'It seems like EC2 instance {instance_id} was not found in {region}. It may have been deleted, or the ID may be wrong.',
    instances_not_found:
        'It seems like one or both of these EC2 instances were not found in {region}: {primary_instance_id} and {secondary_instance_id}. They may have been deleted, or the IDs may be wrong.',
    instance_terminated:
        'It seems like EC2 instance {instance_id} in {region} is already terminated, so I cannot run that action on it.',
    invalid_instance_id:
        'That EC2 instance ID does not look valid. Use instance_id: "i-0abc123"',
    invalid_instance_state:
        'That EC2 instance is not in a state that allows this action right now.',
    same_instance:
        'Primary and secondary must be two different EC2 instances.',
    aws_toggle_failed:
        'I could not complete the EC2 toggle. {detail}',
    aws_terminate_failed:
        'I could not terminate that EC2 instance. {detail}',
    atlas_unreachable:
        'I could not reach the service that runs AWS actions. Please make sure Atlas is running and try again.',
    missing_instance_ids:
        'Send both instance IDs:\nprimary_instance_id: "i-0abc123"\nsecondary_instance_id: "i-0xyz987"',
    missing_instance_id:
        'Send the instance ID:\ninstance_id: "i-0abc123"',
    invalid_region:
        'That AWS region does not look valid. Use region: "us-west-2"',
    no_default_ami_for_region:
        'I do not have a default AMI configured for {region} yet.',
    aws_run_instances_failed:
        'I could not create that EC2 instance. {detail}',
    execution_failed:
        'That action did not complete. Please check your inputs and try again.'
};

const DEFAULT_EXECUTION_FAILED = {
    toggle_ec2: 'I could not toggle the EC2 instances.',
    delete_ec2: 'I could not delete the EC2 instance.',
    create_ec2: 'I could not create the EC2 instance.'
};

function applyOutcomeTemplate(template, context) {
    const region = context && context.region ? String(context.region) : 'that region';
    const instanceId =
        context && context.instance_id ? String(context.instance_id) : 'that instance';
    const primaryInstanceId =
        context && context.primary_instance_id ? String(context.primary_instance_id) : 'the primary instance';
    const secondaryInstanceId =
        context && context.secondary_instance_id ? String(context.secondary_instance_id) : 'the secondary instance';
    const detail =
        context && context.detail
            ? String(context.detail)
            : 'Please try again in a moment.';

    return String(template)
        .replace(/\{region\}/g, region)
        .replace(/\{instance_id\}/g, instanceId)
        .replace(/\{primary_instance_id\}/g, primaryInstanceId)
        .replace(/\{secondary_instance_id\}/g, secondaryInstanceId)
        .replace(/\{detail\}/g, detail);
}

function buildActionOutcomeContext(collected, atlasResponseRaw) {
    return {
        region: collected && collected.region ? String(collected.region).trim() : '',
        instance_id: collected && collected.instance_id ? String(collected.instance_id).trim() : '',
        primary_instance_id:
            collected && collected.primary_instance_id ? String(collected.primary_instance_id).trim() : '',
        secondary_instance_id:
            collected && collected.secondary_instance_id ? String(collected.secondary_instance_id).trim() : '',
        detail: atlasResponseRaw && atlasResponseRaw.message ? String(atlasResponseRaw.message) : ''
    };
}

function getFirstOutcomeCode(atlasResponseRaw) {
    if (!atlasResponseRaw || !Array.isArray(atlasResponseRaw.errors) || !atlasResponseRaw.errors[0]) {
        return '';
    }
    return String(atlasResponseRaw.errors[0]);
}

function buildOutcomeMessage(outcomeCode, context, actionType) {
    const code = outcomeCode ? String(outcomeCode) : 'execution_failed';
    const template = OUTCOME_MESSAGES[code];

    if (template) {
        return applyOutcomeTemplate(template, context);
    }

    if (context && context.detail) {
        return applyOutcomeTemplate('That action did not complete. {detail}', context);
    }

    if (actionType && DEFAULT_EXECUTION_FAILED[actionType]) {
        return DEFAULT_EXECUTION_FAILED[actionType];
    }

    return OUTCOME_MESSAGES.execution_failed;
}

module.exports = {
    OUTCOME_MESSAGES,
    buildOutcomeMessage,
    buildActionOutcomeContext,
    getFirstOutcomeCode
};
