jest.mock(
    '../../../../application/functions/classes/Conversation',
    () => ({
        getConversationById: jest.fn()
    })
);
jest.mock(
    '../../../../application/atlas/cloudPilot/scans/persistence/classes/ScanSnapshot',
    () => ({
        create: jest.fn(),
        attachMessageID: jest.fn(),
        getLatestByConversation: jest.fn(),
        listRecentByConversation: jest.fn(),
        findByID: jest.fn(),
        userCanAccessConversation: jest.fn()
    })
);

const Conversation = require('../../../../application/functions/classes/Conversation');
const ScanSnapshot = require('../../../../application/atlas/cloudPilot/scans/persistence/classes/ScanSnapshot');
const ScanSnapshotService = require('../../../../application/atlas/cloudPilot/scans/persistence/ScanSnapshotService');

describe('ScanSnapshotService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        Conversation.getConversationById.mockResolvedValue({
            success: true,
            conversation: { conversationID: 12, groupID: 70 }
        });
        ScanSnapshot.userCanAccessConversation.mockResolvedValue({
            success: true,
            allowed: true,
            errors: []
        });
        ScanSnapshot.create.mockResolvedValue({
            success: true,
            scanSnapshotId: 44,
            errors: []
        });
    });

    test('saves one formatted S3 snapshot', async () => {
        const result = await ScanSnapshotService.saveCompletedScan({
            actionType: 'scan_s3',
            conversationId: 12,
            requestId: 99,
            executedByUser: 'david',
            collected: { region: 'us-west-2', request_name: 'Finding Fix' },
            atlasResponse: {
                summary: {
                    region: 'us-west-2',
                    resourcesScanned: 3,
                    findingCount: 18
                },
                buckets: [{ bucketName: 'kite' }],
                findings: [{ findingID: 'finding-1' }]
            }
        });

        expect(result.scanSnapshotId).toBe(44);
        expect(ScanSnapshot.create).toHaveBeenCalledWith(
            expect.objectContaining({
                groupId: 70,
                conversationId: 12,
                requestId: 99,
                scanName: 'Finding Fix',
                service: 's3',
                resourcesScanned: 3,
                findingCount: 18,
                payload: expect.objectContaining({
                    schemaVersion: 1,
                    buckets: [{ bucketName: 'kite' }]
                })
            })
        );
    });

    test('skips non-scan executions', async () => {
        const result = await ScanSnapshotService.saveCompletedScan({
            actionType: 'pause_ec2',
            atlasResponse: {}
        });

        expect(result.skipped).toBe(true);
        expect(ScanSnapshot.create).not.toHaveBeenCalled();
    });

    test('checks group membership before returning latest', async () => {
        ScanSnapshot.getLatestByConversation.mockResolvedValue({
            success: true,
            scan: { id: 44 },
            errors: []
        });

        const result = await ScanSnapshotService.getLatestForConversation({
            conversationId: 12,
            currentUser: 'david'
        });

        expect(
            ScanSnapshot.userCanAccessConversation
        ).toHaveBeenCalledWith({
            conversationId: 12,
            userName: 'david'
        });
        expect(result.scan.id).toBe(44);
    });

    test('denies users outside the conversation group', async () => {
        ScanSnapshot.userCanAccessConversation.mockResolvedValue({
            success: true,
            allowed: false,
            errors: []
        });

        const result = await ScanSnapshotService.listRecentForConversation({
            conversationId: 12,
            currentUser: 'stranger'
        });

        expect(result.statusCode).toBe(403);
        expect(ScanSnapshot.listRecentByConversation).not.toHaveBeenCalled();
    });
});
