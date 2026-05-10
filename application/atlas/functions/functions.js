/*
FUNCTIONS A: AWS Helper Functions 
	1) Function A1: Extract AWS region from user text
	2) Function A2: Extract EC2 instance type from user text
	3) Function A3: fieldExtractors map (field name → extractor)

*/

//FUNCTIONS A: AWS Helper Functions
//Function A1: Extract AWS region from user text
function extractAwsRegion(userText) {
    const s = String(userText || '');
    const match = s.match(/\b((?:us|eu|ap|sa|ca|me|af)-(?:gov-)?[a-z]+-\d)\b/i);
    if (!match) {
        return null;
    }
    return String(match[1]).toLowerCase();
}

//Function A2: Extract EC2 instance type from user text
function extractInstanceType(text) {
    const match = text.match(/\b(t2|t3|m5|c5)\.(micro|small|medium|large)\b/i);
    if (!match) {
        return null;
    }
    return String(match[0]).toLowerCase();
}

//Function A3: fieldExtractors map (field name → extractor)
const fieldExtractors = {
    region: extractAwsRegion,
    instance_type: extractInstanceType
};

module.exports = fieldExtractors;
