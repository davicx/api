const ScanSnapshotService = require('../cloudPilot/scans/persistence/ScanSnapshotService');

async function getLatestScan(req, res) {
    const conversationId = Number(req.params.conversation_id);
    const result = await ScanSnapshotService.getLatestForConversation({
        conversationId,
        currentUser: req.currentUser
    });
    return sendLookupResponse(res, result, 'Latest scan');
}

async function getRecentScans(req, res) {
    const conversationId = Number(req.params.conversation_id);
    const result = await ScanSnapshotService.listRecentForConversation({
        conversationId,
        currentUser: req.currentUser,
        limit: req.query.limit
    });
    return sendLookupResponse(res, result, 'Recent scans');
}

async function getScanByID(req, res) {
    const scanSnapshotId = Number(req.params.scan_id);
    if (!scanSnapshotId) {
        return res.status(400).json({
            success: false,
            message: 'Valid scan ID is required',
            data: null,
            errors: [{ code: 'invalid_scan_id' }]
        });
    }

    const result = await ScanSnapshotService.getByID({
        scanSnapshotId,
        currentUser: req.currentUser
    });
    return sendLookupResponse(res, result, 'Scan snapshot');
}

function sendLookupResponse(res, result, message) {
    if (result.allowed === false) {
        return res.status(result.statusCode || 403).json({
            success: false,
            message: 'Scan access denied',
            data: null,
            errors: result.errors || []
        });
    }

    if (!result.success) {
        return res.status(500).json({
            success: false,
            message: 'Could not load scans',
            data: null,
            errors: result.errors || []
        });
    }

    const data =
        Object.prototype.hasOwnProperty.call(result, 'scans')
            ? result.scans
            : result.scan;
    return res.json({
        success: true,
        message,
        data: data == null ? null : data,
        errors: []
    });
}

module.exports = {
    getLatestScan,
    getRecentScans,
    getScanByID
};
