const Conversation = require('../../../../functions/classes/Conversation');
const ScanSnapshot = require('./classes/ScanSnapshot');

const SCAN_ACTIONS = {
    scan_s3: 's3',
    scan_ec2: 'ec2'
};
const SCHEMA_VERSION = 1;

async function saveCompletedScan(options) {
    const input = options || {};
    const service = SCAN_ACTIONS[input.actionType] || null;
    const atlasResponse = input.atlasResponse;

    if (!service || !atlasResponse || typeof atlasResponse !== 'object') {
        return {
            success: true,
            skipped: true,
            scanSnapshotId: null,
            errors: []
        };
    }

    const conversationOutcome = await Conversation.getConversationById(
        Number(input.conversationId)
    );
    if (!conversationOutcome.success || !conversationOutcome.conversation) {
        return failure('conversation_not_found');
    }

    const summary = atlasResponse.summary || {};
    const collected = input.collected || {};
    const region = summary.region || collected.region || null;
    const scanName = resolveScanName({
        service,
        region,
        collected,
        requestedName: input.scanName
    });
    const payload = {
        schemaVersion: SCHEMA_VERSION,
        ...atlasResponse
    };

    return ScanSnapshot.create({
        organization: input.organization || 'Cloud Pilot',
        groupId: conversationOutcome.conversation.groupID,
        conversationId: input.conversationId,
        requestId: input.requestId,
        executedByUser: input.executedByUser,
        scanName,
        actionType: input.actionType,
        service,
        region,
        resourcesScanned: summary.resourcesScanned,
        findingCount: summary.findingCount,
        schemaVersion: SCHEMA_VERSION,
        payload
    });
}

async function attachMessage({ scanSnapshotId, messageId }) {
    if (!Number(scanSnapshotId) || !Number(messageId)) {
        return failure('invalid_message_link');
    }
    return ScanSnapshot.attachMessageID({ scanSnapshotId, messageId });
}

async function getLatestForConversation({ conversationId, currentUser }) {
    const access = await checkConversationAccess({ conversationId, currentUser });
    if (!access.allowed) {
        return access;
    }
    return ScanSnapshot.getLatestByConversation({ conversationId });
}

async function listRecentForConversation({
    conversationId,
    currentUser,
    limit = 3
}) {
    const access = await checkConversationAccess({ conversationId, currentUser });
    if (!access.allowed) {
        return access;
    }
    return ScanSnapshot.listRecentByConversation({ conversationId, limit });
}

async function getByID({ scanSnapshotId, currentUser }) {
    const result = await ScanSnapshot.findByID({ scanSnapshotId });
    if (!result.success || !result.scan) {
        return result;
    }

    const access = await checkConversationAccess({
        conversationId: result.scan.conversationId,
        currentUser
    });
    if (!access.allowed) {
        return access;
    }
    return result;
}

async function checkConversationAccess({ conversationId, currentUser }) {
    if (!Number(conversationId) || !currentUser) {
        return {
            success: false,
            allowed: false,
            statusCode: 400,
            errors: [{ code: 'invalid_scan_access' }]
        };
    }

    const access = await ScanSnapshot.userCanAccessConversation({
        conversationId,
        userName: currentUser
    });
    if (!access.success) {
        return {
            success: false,
            allowed: false,
            statusCode: 500,
            errors: access.errors
        };
    }
    if (!access.allowed) {
        return {
            success: false,
            allowed: false,
            statusCode: 403,
            errors: [{ code: 'scan_access_denied' }]
        };
    }

    return {
        success: true,
        allowed: true,
        errors: []
    };
}

function resolveScanName({ service, region, collected, requestedName }) {
    const name =
        requestedName ||
        collected.request_name ||
        collected.requestName ||
        collected.scan_name ||
        collected.scanName ||
        collected.name;
    if (name != null && String(name).trim()) {
        return String(name).trim();
    }
    return `${service === 'ec2' ? 'EC2' : 'S3'} scan — ${region || 'all regions'}`;
}

function failure(code) {
    return {
        success: false,
        allowed: false,
        scanSnapshotId: null,
        errors: [{ code }]
    };
}

module.exports = {
    saveCompletedScan,
    attachMessage,
    getLatestForConversation,
    listRecentForConversation,
    getByID,
    resolveScanName
};
