const SearchMessageForRegionFunctions = require('./searchMessageForRegion');

/*
FUNCTIONS A: Structured field extraction from user message
    1) Function A1: searchMessageForValues
*/

//Function A1: Find all structured field values in the message
function searchMessageForValues(message) {
    const values = {};
    const regionResult = SearchMessageForRegionFunctions.searchMessageForRegion(message);

    if (regionResult.region) {
        values.region = regionResult.region;
    }

    return values;
}

module.exports = { searchMessageForValues };
