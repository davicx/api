/*
Field prompt examples for request template copy (copy-paste format).
*/

const MISSING_FIELDS_INTRO = 'We also need the following information';

const FIELD_FORMAT_EXAMPLES = {
    region: 'us-west-2',
    primary_instance_id: 'i-0abc123',
    secondary_instance_id: 'i-0xyz987',
    instance_id: 'i-0abc123',
    name: 'my-app-server',
    instance_type: 't3.micro'
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

function buildMissingFieldsMessage(actionDefinition, missingFields) {
    const lines = buildMissingFieldPromptLines(missingFields, actionDefinition);

    if (lines.length === 0) {
        return '';
    }

    return MISSING_FIELDS_INTRO + '\n\n' + lines.join('\n');
}

module.exports = {
    MISSING_FIELDS_INTRO,
    FIELD_FORMAT_EXAMPLES,
    formatFieldPromptLine,
    buildMissingFieldPromptLines,
    buildMissingFieldsMessage
};
