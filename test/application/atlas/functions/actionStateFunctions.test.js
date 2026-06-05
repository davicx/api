const actionState = require('../../../../application/atlas/state/ActionState');

jest.mock('../../../../application/atlas/functions/classes/Actions', () => ({
    getOpenActionForConversation: jest.fn(),
    createAction: jest.fn(),
    cancelAction: jest.fn(),
    setField: jest.fn(),
    setStatus: jest.fn(),
    setExecutionMode: jest.fn()
}));

const Actions = require('../../../../application/atlas/functions/classes/Actions');
const {
    getUsersActionState,
    loadUsersOpenAction,
    startNewUsersAction,
    setUsersActionField,
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

    describe('getUsersActionState', () => {
        test('reads open action from database', async () => {
            Actions.getOpenActionForConversation.mockResolvedValue({
                success: true,
                action: {
                    workflowId: 42,
                    actionType: 'create_ec2',
                    status: 'pending',
                    executionMode: null,
                    collected: { region: 'us-west-2' },
                    missing: ['instance_name'],
                    asked: {}
                },
                errors: []
            });

            const state = await getUsersActionState(CONVERSATION_ID);

            expect(state.pendingAction).toBe('create_ec2');
            expect(state.workflowId).toBe(42);
            expect(state.missing).toEqual(['instance_name']);
        });

        test('returns empty state when no open row', async () => {
            Actions.getOpenActionForConversation.mockResolvedValue({
                success: true,
                action: null,
                errors: []
            });

            const state = await getUsersActionState(CONVERSATION_ID);

            expect(state.pendingAction).toBeNull();
        });
    });

    describe('startNewUsersAction', () => {
        test('cancels open row before creating a different action', async () => {
            Actions.getOpenActionForConversation
                .mockResolvedValueOnce({
                    success: true,
                    action: { workflowId: 1, actionType: 'scan_ec2' },
                    errors: []
                })
                .mockResolvedValue({
                    success: true,
                    action: null,
                    errors: []
                });

            Actions.cancelAction.mockResolvedValue({ success: true });
            Actions.createAction.mockResolvedValue({
                success: true,
                workflowId: 2,
                action: {
                    workflowId: 2,
                    actionType: 'toggle_ec2',
                    status: 'pending',
                    executionMode: null,
                    collected: {},
                    missing: ['region', 'primary_instance_id', 'secondary_instance_id'],
                    asked: {}
                },
                errors: []
            });

            const outcome = await startNewUsersAction(CONVERSATION_ID, {
                masterSite: 'kite',
                requestedByUserName: 'davey'
            }, {
                type: 'toggle_ec2',
                actionLabel: 'Toggle EC2',
                requiredFields: ['region', 'primary_instance_id', 'secondary_instance_id']
            });

            expect(Actions.cancelAction).toHaveBeenCalledWith(1);
            expect(Actions.createAction).toHaveBeenCalledWith(
                expect.objectContaining({
                    actionType: 'toggle_ec2',
                    displayName: 'Toggle EC2'
                })
            );
            expect(outcome.success).toBe(true);
            expect(outcome.state.pendingAction).toBe('toggle_ec2');
        });
    });

    describe('setUsersActionField', () => {
        test('writes field to database and returns updated state', async () => {
            Actions.getOpenActionForConversation.mockResolvedValue({
                success: true,
                action: { workflowId: 5, actionType: 'create_ec2' },
                errors: []
            });

            Actions.setField.mockResolvedValue({
                success: true,
                action: {
                    workflowId: 5,
                    actionType: 'create_ec2',
                    status: 'pending',
                    executionMode: null,
                    collected: { region: 'us-west-2' },
                    missing: [],
                    asked: {}
                }
            });

            const state = await setUsersActionField(CONVERSATION_ID, 'region', 'us-west-2');

            expect(Actions.setField).toHaveBeenCalledWith(5, 'region', 'us-west-2');
            expect(state.collected.region).toBe('us-west-2');
            expect(state.missing).toEqual([]);
        });
    });

    describe('loadUsersOpenAction', () => {
        test('skips when memory-only mode is set', async () => {
            process.env.CLOUDPILOT_STATE_BACKEND = 'memory';

            const result = await loadUsersOpenAction(CONVERSATION_ID);

            expect(result).toEqual({ loaded: false, reason: 'memory_only_mode' });
            expect(Actions.getOpenActionForConversation).not.toHaveBeenCalled();
        });

        test('in database mode returns loaded when open row exists', async () => {
            Actions.getOpenActionForConversation.mockResolvedValue({
                success: true,
                action: {
                    workflowId: 42,
                    actionType: 'create_ec2',
                    status: 'pending',
                    executionMode: null,
                    collected: {},
                    missing: ['region'],
                    asked: {}
                },
                errors: []
            });

            const result = await loadUsersOpenAction(CONVERSATION_ID);

            expect(result).toEqual({ loaded: true, actionId: 42 });
        });
    });
});

describe('ActionState.loadActionFromDatabase', () => {
    afterEach(() => {
        actionState.clear(CONVERSATION_ID);
    });

    test('loads full action after simulated restart (memory-only cache)', () => {
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
