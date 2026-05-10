/*
FUNCTIONS A: AWS Helper Functions 
	1) Function A1: Extract AWS region from user text
	2) Function A2: Extract EC2 instance type from user text
	3) Function A3: Extract instance name from user text (MVP phrases)
	4) Function A4: fieldExtractors map (field name → extractor)

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

//Function A3: Extract instance name from user text (MVP phrases)
function extractName(text) {
    const s = String(text || '');
    let match = s.match(/\bname\s+it\s+([a-z0-9][a-z0-9._-]*)\b/i);
    if (match) {
        return String(match[1]).trim();
    }
    match = s.match(/\bcall\s+it\s+([a-z0-9][a-z0-9._-]*)\b/i);
    if (match) {
        return String(match[1]).trim();
    }
    return null;
}

//Function A4: fieldExtractors map (field name → extractor)
const fieldExtractors = {
    region: extractAwsRegion,
    instance_type: extractInstanceType,
    name: extractName
};

module.exports = fieldExtractors;
