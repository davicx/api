const SearchMessageForRegionFunctions = require('./values/searchMessageForRegion');
const SearchMessageForStructuredFieldsFunctions = require('./helpers/searchMessageForStructuredFields');
const SearchMessageForInstanceIdFunctions = require('./values/searchMessageForInstanceId');
const SearchMessageForInstanceTypeFunctions = require('./values/searchMessageForInstanceType');
const SearchMessageForNameFunctions = require('./values/searchMessageForName');
const SearchMessageForTagUpdateFunctions = require('./values/searchMessageForTagUpdate');
const SearchMessageForOpenRequestFieldsFunctions = require('./values/searchMessageForOpenRequestFields');

/*
FUNCTIONS A: Structured field extraction from user message
    1) Function A1: searchMessageForValues

Orchestrator — loops value extractors under ./values/ (+ helpers).
Questions (AI spend, open requests) live under ./questions/ — not here.
*/

//Function A1: Find all structured field values in the message
async function searchMessageForValues(message, requestState) {
    const structured = SearchMessageForStructuredFieldsFunctions.searchMessageForStructuredFields(message);
    const values = { ...structured };
    let ambiguousFields = [];

    const regionResult = await SearchMessageForRegionFunctions.searchMessageForRegion(
        message,
        requestState
    );
    if (regionResult.region && values.region === undefined) {
        values.region = regionResult.region;
    }

    const instanceResult = SearchMessageForInstanceIdFunctions.searchMessageForInstanceId(message);
    const hasStructuredInstanceField =
        values.instance_id !== undefined ||
        values.primary_instance_id !== undefined ||
        values.secondary_instance_id !== undefined;

    for (const key of Object.keys(instanceResult)) {
        if (values[key] !== undefined) {
            continue;
        }

        if (key === 'instance_id' && hasStructuredInstanceField) {
            continue;
        }

        values[key] = instanceResult[key];
    }

    const typeResult = SearchMessageForInstanceTypeFunctions.searchMessageForInstanceType(message);
    if (typeResult.instance_type && values.instance_type === undefined) {
        values.instance_type = typeResult.instance_type;
    }

    const nameResult = SearchMessageForNameFunctions.searchMessageForName(message);
    if (nameResult.name && values.name === undefined) {
        values.name = nameResult.name;
    }

    const tagUpdateResult =
        SearchMessageForTagUpdateFunctions.searchMessageForTagUpdate(message);
    if (tagUpdateResult.tag_key && values.tag_key === undefined) {
        values.tag_key = tagUpdateResult.tag_key;
    }
    if (tagUpdateResult.tag_value && values.tag_value === undefined) {
        values.tag_value = tagUpdateResult.tag_value;
    }

    // OpenAI fill for remaining missing open-request fields (multi-field, multi-word).
    const openRequestFields =
        await SearchMessageForOpenRequestFieldsFunctions.searchMessageForOpenRequestFields(
            message,
            requestState,
            values
        );
    const openValues =
        openRequestFields && openRequestFields.values
            ? openRequestFields.values
            : {};

    for (const fieldName of Object.keys(openValues)) {
        if (values[fieldName] === undefined || values[fieldName] === '') {
            values[fieldName] = openValues[fieldName];
        }
    }

    ambiguousFields = Array.isArray(openRequestFields && openRequestFields.ambiguousFields)
        ? openRequestFields.ambiguousFields.slice()
        : [];

    return {
        values: values,
        ambiguousFields: ambiguousFields
    };
}

module.exports = { searchMessageForValues };
