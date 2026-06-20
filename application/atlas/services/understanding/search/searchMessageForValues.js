const SearchMessageForRegionFunctions = require('./searchMessageForRegion');
const SearchMessageForStructuredFieldsFunctions = require('./searchMessageForStructuredFields');
const SearchMessageForInstanceIdFunctions = require('./searchMessageForInstanceId');
const SearchMessageForInstanceTypeFunctions = require('./searchMessageForInstanceType');
const SearchMessageForNameFunctions = require('./searchMessageForName');

/*
FUNCTIONS A: Structured field extraction from user message
    1) Function A1: searchMessageForValues
*/

//Function A1: Find all structured field values in the message
function searchMessageForValues(message) {
    const structured = SearchMessageForStructuredFieldsFunctions.searchMessageForStructuredFields(message);
    const values = { ...structured };

    const regionResult = SearchMessageForRegionFunctions.searchMessageForRegion(message);
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

    return values;
}

module.exports = { searchMessageForValues };
