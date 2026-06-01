const actionState = require('../state/ActionState');

jest.mock('./classes/Actions', () => ({
    getOpenActionForConversation: jest.fn()
}));

const Actions = require('./classes/Actions');
const {
    hydrateWorkflowFromDatabase,
    isMysqlWorkflowBackendEnabled,
    shouldHydrateFromDatabase,
    mapDbActionToMemoryPatch
} = require('./workflowStateFunctions');

const CONVERSATION_ID = 9001;

describe('workflowStateFunctions', () => {
    const originalBackend = process.env.CLOUDPILOT_STATE_BACKEND;

    afterEach(() => {
        actionState.clear(CONVERSATION_ID);
        jest.clearAllMocks();

        if (originalBackend === undefined) {
            delete process.env.CLOUDPILOT_STATE_BACKEND;
        } else {
            process.env.CLOUDPILOT_STATE_BACKEND = originalBackend;
        }
    });

    describe('shouldHydrateFromDatabase', () => {
        test('returns true when memory has no pending action', () => {
            expect(shouldHydrateFromDatabase({ pendingAction: null })).toBe(true);
        });

        test('returns false when memory already has pending action', () => {
            expect(shouldHydrateFromDatabase({ pendingAction: 'create_ec2' })).toBe(false);
        });
    });

    describe('mapDbActionToMemoryPatch', () => {
        test('maps DB row fields to ActionState shape', () => {
            const patch = mapDbActionToMemoryPatch({
                workflowId: 17,
                actionType: 'create_ec2',
                status: 'pending',
                executionMode: null,
                collected: { region: 'us-west-2' },
                missing: ['instance_name'],
                asked: { region: true }
            });

            expect(patch).toEqual({
                pendingAction: 'create_ec2',
                status: 'pending',
                executionMode: null,
                workflowId: 17,
                collected: { region: 'us-west-2' },
                missing: ['instance_name'],
                asked: { region: true }
            });
        });
    });

    describe('isMysqlWorkflowBackendEnabled', () => {
        test('defaults to mysql backend', () => {
            delete process.env.CLOUDPILOT_STATE_BACKEND;
            expect(isMysqlWorkflowBackendEnabled()).toBe(true);
        });

        test('returns false when CLOUDPILOT_STATE_BACKEND=memory', () => {
            process.env.CLOUDPILOT_STATE_BACKEND = 'memory';
            expect(isMysqlWorkflowBackendEnabled()).toBe(false);
        });
    });

    describe('hydrateWorkflowFromDatabase', () => {
        test('skips when memory backend flag is set', async () => {
            process.env.CLOUDPILOT_STATE_BACKEND = 'memory';

            const result = await hydrateWorkflowFromDatabase(CONVERSATION_ID);

            expect(result).toEqual({ hydrated: false, reason: 'memory_backend' });
            expect(Actions.getOpenActionForConversation).not.toHaveBeenCalled();
        });

        test('skips when memory already has active workflow', async () => {
            actionState.setPendingAction(CONVERSATION_ID, 'create_ec2', ['region']);

            const result = await hydrateWorkflowFromDatabase(CONVERSATION_ID);

            expect(result).toEqual({ hydrated: false, reason: 'memory_has_state' });
            expect(Actions.getOpenActionForConversation).not.toHaveBeenCalled();
        });

        test('hydrates ActionState from open DB row when memory is empty', async () => {
            Actions.getOpenActionForConversation.mockResolvedValue({
                success: true,
                action: {
                    workflowId: 42,
                    actionType: 'create_ec2',
                    status: 'pending',
                    executionMode: null,
                    collected: { region: 'us-west-2' },
                    missing: ['instance_name'],
                    asked: { region: true }
                },
                errors: []
            });

            const result = await hydrateWorkflowFromDatabase(CONVERSATION_ID);

            expect(result).toEqual({
                hydrated: true,
                reason: 'hydrated',
                workflowId: 42
            });

            const memoryState = actionState.getActionStatus(CONVERSATION_ID);

            expect(memoryState.pendingAction).toBe('create_ec2');
            expect(memoryState.workflowId).toBe(42);
            expect(memoryState.collected).toEqual({ region: 'us-west-2' });
            expect(memoryState.missing).toEqual(['instance_name']);
            expect(memoryState.asked).toEqual({ region: true });
        });

        test('returns no_open_workflow when DB has no open row', async () => {
            Actions.getOpenActionForConversation.mockResolvedValue({
                success: true,
                action: null,
                errors: []
            });

            const result = await hydrateWorkflowFromDatabase(CONVERSATION_ID);

            expect(result).toEqual({ hydrated: false, reason: 'no_open_workflow' });
            expect(actionState.getActionStatus(CONVERSATION_ID).pendingAction).toBeNull();
        });
    });
});

describe('ActionState.restoreFromDatabase', () => {
    afterEach(() => {
        actionState.clear(CONVERSATION_ID);
    });

    test('restores full workflow after simulated restart (clear memory)', () => {
        actionState.setPendingAction(CONVERSATION_ID, 'create_ec2', ['region', 'instance_name']);
        actionState.setField(CONVERSATION_ID, 'region', 'us-west-2');
        actionState.setWorkflowId(CONVERSATION_ID, 99);

        actionState.clear(CONVERSATION_ID);

        actionState.restoreFromDatabase(CONVERSATION_ID, {
            workflowId: 99,
            actionType: 'create_ec2',
            status: 'pending',
            executionMode: null,
            collected: { region: 'us-west-2' },
            missing: ['instance_name'],
            asked: { region: true }
        });

        const restored = actionState.getActionStatus(CONVERSATION_ID);

        expect(restored.pendingAction).toBe('create_ec2');
        expect(restored.workflowId).toBe(99);
        expect(restored.missing).toEqual(['instance_name']);
        expect(restored.collected.region).toBe('us-west-2');
    });
});
