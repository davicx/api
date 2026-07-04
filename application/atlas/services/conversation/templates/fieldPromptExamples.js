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
    tag_key: 'CloudPilot-Test',
    tag_value: 'B',
    request_name: 'updating kite S3'
};

const REQUEST_NAME_EXAMPLES_BY_ACTION = {
    toggle_ec2: 'Kite EC2 toggle',
    create_ec2: 'updating kite S3',
    delete_ec2: 'removing demo instance',
    update_ec2_tag: 'update CloudPilot-Test tag',
    scan_ec2: 'Kite EC2 scan',
    scan_s3: 'updating kite S3',
    inventory_aws: 'Kite inventory'
};

function formatFieldPromptLine(fieldName, exampleValue) {
    return String(fieldName) + ': "' + String(exampleValue) + '"';
}

// Soft fill (A): prefer known examples (e.g. last scan) over static placeholders — never writes collected.
function resolveFieldExample(fieldName, actionDefinition, exampleContext) {
    const context = exampleContext || {};

    if (context[fieldName] != null && String(context[fieldName]).trim() !== '') {
        return String(context[fieldName]).trim();
    }

    const defaults =
        actionDefinition && actionDefinition.defaults ? actionDefinition.defaults : {};

    if (defaults[fieldName] != null && String(defaults[fieldName]).trim() !== '') {
        return String(defaults[fieldName]).trim();
    }

    if (FIELD_FORMAT_EXAMPLES[fieldName] != null) {
        return FIELD_FORMAT_EXAMPLES[fieldName];
    }

    return 'your_value_here';
}

function buildMissingFieldPromptLines(missingFields, actionDefinition, exampleContext) {
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

        const example = resolveFieldExample(fieldName, actionDefinition, exampleContext);

        lines.push(formatFieldPromptLine(fieldName, example));
    }

    return lines;
}

function buildMissingFieldsMessage(actionDefinition, missingFields, collectedFields, exampleContext) {
    const lines = buildMissingFieldPromptLines(missingFields, actionDefinition, exampleContext);
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
    resolveFieldExample,
    buildMissingFieldPromptLines,
    buildMissingFieldsMessage,
    buildOptionalRequestNamePrompt,
    resolveRequestNameExample
};
