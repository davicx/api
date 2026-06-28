/*
Field prompt examples for request template copy (copy-paste format).
*/

const MISSING_FIELDS_INTRO = 'We also need the following information';

const OPTIONAL_REQUEST_NAME_INTRO = 'Do you want to name this request?';

const FIELD_FORMAT_EXAMPLES = {
    region: 'us-west-2',
    primary_instance_id: 'i-0abc123',
    secondary_instance_id: 'i-0xyz987',
    instance_id: 'i-0abc123',
    name: 'my-app-server',
    instance_type: 't3.micro',
    request_name: 'updating kite S3'
};

const REQUEST_NAME_EXAMPLES_BY_ACTION = {
    toggle_ec2: 'Kite EC2 toggle',
    create_ec2: 'updating kite S3',
    delete_ec2: 'removing demo instance',
    scan_ec2: 'Kite EC2 scan',
    scan_s3: 'updating kite S3',
    inventory_aws: 'Kite inventory'
};

function formatFieldPromptLine(fieldName, exampleValue) {
    return String(fieldName) + ': "' + String(exampleValue) + '"';
}

function buildMissingFieldPromptLines(missingFields, actionDefinition) {
    const registryMessages =
        actionDefinition &&
        actionDefinition.messages &&
        actionDefinition.messages.missingFields
            ? actionDefinition.messages.missingFields
            : {};

    const lines = [];

    for (const fieldName of missingFields) {
        const override = registryMessages[fieldName];

        if (override && String(override).includes(':')) {
            lines.push(String(override).trim());
            continue;
        }

        const example =
            FIELD_FORMAT_EXAMPLES[fieldName] != null
                ? FIELD_FORMAT_EXAMPLES[fieldName]
                : 'your_value_here';

        lines.push(formatFieldPromptLine(fieldName, example));
    }

    return lines;
}

function buildMissingFieldsMessage(actionDefinition, missingFields, collectedFields) {
    const lines = buildMissingFieldPromptLines(missingFields, actionDefinition);
    const parts = [];

    if (lines.length > 0) {
        parts.push(MISSING_FIELDS_INTRO + '\n\n' + lines.join('\n'));
    }

    const requestNamePrompt = buildOptionalRequestNamePrompt(actionDefinition, collectedFields);

    if (requestNamePrompt) {
        parts.push(requestNamePrompt);
    }

    return parts.join('\n\n');
}

function buildOptionalRequestNamePrompt(actionDefinition, collectedFields) {
    const collected = collectedFields || {};

    if (collected.request_name != null && String(collected.request_name).trim() !== '') {
        return '';
    }

    const actionType =
        actionDefinition && actionDefinition.type ? String(actionDefinition.type).trim() : '';
    const example =
        REQUEST_NAME_EXAMPLES_BY_ACTION[actionType] != null
            ? REQUEST_NAME_EXAMPLES_BY_ACTION[actionType]
            : FIELD_FORMAT_EXAMPLES.request_name;

    return (
        OPTIONAL_REQUEST_NAME_INTRO +
        '\n\n' +
        formatFieldPromptLine('request_name', example)
    );
}

function resolveRequestNameExample(actionDefinition) {
    const actionType =
        actionDefinition && actionDefinition.type ? String(actionDefinition.type).trim() : '';

    if (REQUEST_NAME_EXAMPLES_BY_ACTION[actionType] != null) {
        return REQUEST_NAME_EXAMPLES_BY_ACTION[actionType];
    }

    return FIELD_FORMAT_EXAMPLES.request_name;
}

module.exports = {
    MISSING_FIELDS_INTRO,
    OPTIONAL_REQUEST_NAME_INTRO,
    FIELD_FORMAT_EXAMPLES,
    REQUEST_NAME_EXAMPLES_BY_ACTION,
    formatFieldPromptLine,
    buildMissingFieldPromptLines,
    buildMissingFieldsMessage,
    buildOptionalRequestNamePrompt,
    resolveRequestNameExample
};
