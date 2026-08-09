const Instruction = require('./classes/Instruction');
const fileFunctions = require('../../functions/fileFunctions');
const Functions = require('../../functions/functions');
const actionMap = require('../cloudPilot/actionMap');

/*

FUNCTIONS A: All Functions Related to Instructions
    1) Function A1: Build Instruction Response
    2) Function A2: Load Instructions Payload (shared by GET + Mode 1)

FUNCTIONS B: All Instruction Helper Functions
    1) Function B1: Normalize Warnings
    2) Function B2: Build Image URL
    3) Function B3: Build Instruction Title
    4) Function B4: Normalize Instruction Step

*/

//FUNCTIONS A: All Functions Related to Instructions
//Function A1: Build Instruction Response
function buildInstructionResponse(currentUser) {
    return {
        data: {},
        message: "",
        success: false,
        statusCode: 500,
        errors: [],
        currentUser: currentUser
    };
}

//Function A2: Load Instructions Payload (shared by GET + Mode 1)
async function loadInstructionsPayload(instructionFor) {
    var payloadOutcome = {
        success: false,
        message: "",
        data: null,
        errors: []
    };

    if (!instructionFor || String(instructionFor).trim() === '') {
        payloadOutcome.message = "instruction_for is required";
        return payloadOutcome;
    }

    const actionKey = String(instructionFor).trim();

    try {
        const instructionsOutcome = await Instruction.getInstructionsByAction(actionKey);

        if (instructionsOutcome.success != true) {
            payloadOutcome.message = "Could not load instructions";
            payloadOutcome.errors = instructionsOutcome.errors;
            return payloadOutcome;
        }

        const steps = [];

        for (let i = 0; i < instructionsOutcome.instructions.length; i++) {
            steps.push(await normalizeInstructionStep(instructionsOutcome.instructions[i]));
        }

        payloadOutcome.success = true;
        payloadOutcome.message = steps.length > 0 ? "Instructions found" : "No instructions found";
        payloadOutcome.data = {
            type: "instructions",
            instructionFor: actionKey,
            title: buildInstructionTitle(actionKey),
            stepCount: steps.length,
            steps: steps
        };
    } catch(err) {
        payloadOutcome.message = "Could not load instructions";
        payloadOutcome.errors.push(err);
    }

    return payloadOutcome;
}

//FUNCTIONS B: All Instruction Helper Functions
//Function B1: Normalize Warnings
function normalizeWarnings(warnings) {
    if (warnings == null || warnings === '') {
        return [];
    }

    var parsed = warnings;

    if (typeof warnings === 'string') {
        try {
            parsed = JSON.parse(warnings);
        } catch(err) {
            return [];
        }
    }

    if (Array.isArray(parsed)) {
        return parsed;
    }

    if (typeof parsed === 'object') {
        return [parsed];
    }

    return [];
}

//Function B2: Build Image URL
// DB stores object key only (e.g. instructions/create_ec2/...).
// Local: public/<AWS_BUCKET_NAME>/<key> via express.static('public')
// AWS: same key inside bucket AWS_BUCKET_NAME
// Doc: doc/development/finished/feature_images.md
async function buildImageUrl(relativeImagePath) {
    if (!relativeImagePath || String(relativeImagePath).trim() === '') {
        return null;
    }

    const objectKey = String(relativeImagePath).trim().replace(/^\/+/, '');
    const bucketName = String(process.env.AWS_BUCKET_NAME || 'kite-us-west-two').trim().replace(/^\/+|\/+$/g, '');
    const publicFileBaseUrl = (process.env.PUBLIC_FILE_BASE_URL || '').replace(/\/+$/, '');
    const fileLocation = process.env.FILE_LOCATION || 'local';

    // Avoid double-prefix if a caller already included the bucket folder
    const alreadyPrefixed = bucketName !== ''
        && (objectKey === bucketName || objectKey.indexOf(bucketName + '/') === 0);
    const localStaticPath = alreadyPrefixed || bucketName === ''
        ? objectKey
        : bucketName + '/' + objectKey;

    const localImageUrl = publicFileBaseUrl
        ? publicFileBaseUrl + '/' + localStaticPath
        : '/' + localStaticPath;

    if (Functions.compareStrings(fileLocation, "aws") == true) {
        return await fileFunctions.getImageURL(fileLocation, localImageUrl, objectKey);
    }

    return localImageUrl;
}

//Function B3: Build Instruction Title
function buildInstructionTitle(instructionFor) {
    const actionDefinition = actionMap[instructionFor];

    if (actionDefinition && actionDefinition.actionLabel) {
        return actionDefinition.actionLabel;
    }

    return instructionFor;
}

//Function B4: Normalize Instruction Step
async function normalizeInstructionStep(step) {
    return {
        instructionId: step.instructionId,
        stepNumber: step.stepNumber,
        title: step.title,
        instruction: step.instruction,
        image: step.image,
        imageUrl: await buildImageUrl(step.image),
        warnings: normalizeWarnings(step.warnings),
        estimatedTime: step.estimatedTime,
        optional: Boolean(step.optional)
    };
}

module.exports = {
    buildInstructionResponse,
    loadInstructionsPayload,
    normalizeWarnings,
    buildImageUrl,
    buildInstructionTitle,
    normalizeInstructionStep
};
