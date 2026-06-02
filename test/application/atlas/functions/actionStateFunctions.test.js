const actionState = require('../../../../application/atlas/state/ActionState');

jest.mock('../../../../application/atlas/functions/classes/Actions', () => ({
    getOpenActionForConversation: jest.fn()
}));

const Actions = require('../../../../application/atlas/functions/classes/Actions');
const {
    loadUsersOpenAction,
    useDatabaseActionState,
    actionStateIsEmpty,
    mapActionToState
} = require('../../../../application/atlas/functions/actionStateFunctions');

const CONVERSATION_ID = 9001;

describe('actionStateFunctions', () => {
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

    describe('actionStateIsEmpty', () => {
        test('returns true when memory has no pending action', () => {
            expect(actionStateIsEmpty({ pendingAction: null })).toBe(true);
        });

        test('returns false when memory already has pending action', () => {
            expect(actionStateIsEmpty({ pendingAction: 'create_ec2' })).toBe(false);
        });
    });

    describe('mapActionToState', () => {
        test('maps DB row fields to ActionState shape', () => {
            const state = mapActionToState({
                workflowId: 17,
                actionType: 'create_ec2',
                status: 'pending',
                executionMode: null,
                collected: { region: 'us-west-2' },
                missing: ['instance_name'],
                asked: { region: true }
            });

            expect(state).toEqual({
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

    describe('useDatabaseActionState', () => {
        test('defaults to database action state', () => {
            delete process.env.CLOUDPILOT_STATE_BACKEND;
            expect(useDatabaseActionState()).toBe(true);
        });

        test('returns false when CLOUDPILOT_STATE_BACKEND=memory', () => {
            process.env.CLOUDPILOT_STATE_BACKEND = 'memory';
            expect(useDatabaseActionState()).toBe(false);
        });
    });

    describe('loadUsersOpenAction', () => {
        test('skips when memory-only mode is set', async () => {
            process.env.CLOUDPILOT_STATE_BACKEND = 'memory';

            const result = await loadUsersOpenAction(CONVERSATION_ID);

            expect(result).toEqual({ loaded: false, reason: 'memory_only_mode' });
            expect(Actions.getOpenActionForConversation).not.toHaveBeenCalled();
        });

        test('skips when memory already has active action', async () => {
            actionState.setPendingAction(CONVERSATION_ID, 'create_ec2', ['region']);

            const result = await loadUsersOpenAction(CONVERSATION_ID);

            expect(result).toEqual({ loaded: false, reason: 'memory_has_action' });
            expect(Actions.getOpenActionForConversation).not.toHaveBeenCalled();
        });

        test('loads ActionState from open DB row when memory is empty', async () => {
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

            const result = await loadUsersOpenAction(CONVERSATION_ID);

            expect(result).toEqual({
                loaded: true,
                actionId: 42
            });

            const memoryState = actionState.getActionStatus(CONVERSATION_ID);

            expect(memoryState.pendingAction).toBe('create_ec2');
            expect(memoryState.workflowId).toBe(42);
            expect(memoryState.collected).toEqual({ region: 'us-west-2' });
            expect(memoryState.missing).toEqual(['instance_name']);
            expect(memoryState.asked).toEqual({ region: true });
        });

        test('returns no_open_action when DB has no open row', async () => {
            Actions.getOpenActionForConversation.mockResolvedValue({
                success: true,
                action: null,
                errors: []
            });

            const result = await loadUsersOpenAction(CONVERSATION_ID);

            expect(result).toEqual({ loaded: false, reason: 'no_open_action' });
            expect(actionState.getActionStatus(CONVERSATION_ID).pendingAction).toBeNull();
        });
    });
});

describe('ActionState.loadActionFromDatabase', () => {
    afterEach(() => {
        actionState.clear(CONVERSATION_ID);
    });

    test('loads full action after simulated restart (clear memory)', () => {
        actionState.setPendingAction(CONVERSATION_ID, 'create_ec2', ['region', 'instance_name']);
        actionState.setField(CONVERSATION_ID, 'region', 'us-west-2');
        actionState.setWorkflowId(CONVERSATION_ID, 99);

        actionState.clear(CONVERSATION_ID);

        actionState.loadActionFromDatabase(CONVERSATION_ID, {
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
