const express = require('express');
const request = require('supertest');

jest.mock(
    '../../../../application/functions/middlewareFunctions',
    () => ({
        verifyUser: (req, res, next) => {
            req.currentUser = 'david';
            next();
        }
    })
);
jest.mock(
    '../../../../application/atlas/cloudPilot/scans/persistence/ScanSnapshotService',
    () => ({
        getLatestForConversation: jest.fn(),
        listRecentForConversation: jest.fn(),
        getByID: jest.fn()
    })
);

const ScanSnapshotService = require('../../../../application/atlas/cloudPilot/scans/persistence/ScanSnapshotService');
const scanRoutes = require('../../../../application/atlas/routes/scanRoutes');

function buildApp() {
    const app = express();
    app.use(scanRoutes);
    return app;
}

describe('scan routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('returns the latest authorized scan', async () => {
        ScanSnapshotService.getLatestForConversation.mockResolvedValue({
            success: true,
            scan: { id: 9, conversationId: 12 },
            errors: []
        });

        const response = await request(buildApp())
            .get('/cloudpilot/scans/conversation/12/latest')
            .expect(200);

        expect(response.body.data.id).toBe(9);
        expect(ScanSnapshotService.getLatestForConversation).toHaveBeenCalledWith({
            conversationId: 12,
            currentUser: 'david'
        });
    });

    test('returns only the requested number of recent scans', async () => {
        ScanSnapshotService.listRecentForConversation.mockResolvedValue({
            success: true,
            scans: [{ id: 9 }, { id: 8 }, { id: 7 }],
            errors: []
        });

        const response = await request(buildApp())
            .get('/cloudpilot/scans/conversation/12/recent?limit=3')
            .expect(200);

        expect(response.body.data).toHaveLength(3);
        expect(
            ScanSnapshotService.listRecentForConversation
        ).toHaveBeenCalledWith({
            conversationId: 12,
            currentUser: 'david',
            limit: '3'
        });
    });

    test('does not expose a scan when access is denied', async () => {
        ScanSnapshotService.getByID.mockResolvedValue({
            success: false,
            allowed: false,
            statusCode: 403,
            errors: [{ code: 'scan_access_denied' }]
        });

        const response = await request(buildApp())
            .get('/cloudpilot/scans/99')
            .expect(403);

        expect(response.body.data).toBeNull();
    });
});
