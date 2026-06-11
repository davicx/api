/*
FUNCTIONS A: Region extraction from user message
    1) Function A1: searchMessageForRegion
*/

//Function A1: Find an AWS region in the message
function searchMessageForRegion(message) {
    const text = String(message || '');
    const match = text.match(/\b((?:us|eu|ap|sa|ca|me|af)-(?:gov-)?[a-z]+-\d)\b/i);

    if (!match) {
        return {};
    }

    return { region: String(match[1]).toLowerCase() };
}

module.exports = { searchMessageForRegion };
