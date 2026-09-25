jest.mock('../../../../application/atlas/providers/openAI/client/openAIClient', () => ({
    getOpenAIClient: jest.fn(),
    createOpenAiChatCompletion: jest.fn(),
    logOpenAI: jest.fn(),
    summarizeSearchTaskContext: jest.fn(() => 'test-context')
}));

const OpenAIClient = require('../../../../application/atlas/providers/openAI/client/openAIClient');
const { CLOUDPILOT_AI_CONFIG } = require('../../../../application/atlas/config/cloudPilotAIConfig');
const {
    searchMessageForOpenRequestFields,
    parseOpenAIOpenRequestFieldsResponse
} = require('../../../../application/atlas/cloudPilotIntelligence/understand/search/values/searchMessageForOpenRequestFields');
const MasterDecision = require('../../../../application/atlas/cloudPilot/decide/masterDecision');
const OpenRequestEffectFunctions = require('../../../../application/atlas/cloudPilot/requests/interpretOpenRequestEffect');
const { RESPONSE_TYPE, CHAT_TYPE } = require('../../../../application/atlas/cloudPilot/requests/decisionTypes');
const RequestTemplates = require('../../../../application/atlas/cloudPilot/chat/templates/requestTemplates');
const actionMap = require('../../../../application/atlas/cloudPilot/masterCloudPilotCapabilities');

const waitingScanS3FieldsState = {
    pendingAction: 'scan_s3',
    status: 'waiting_on_fields',
    executionMode: null,
    workflowId: 1,
    missing: ['region', 'request_name'],
    collected: {},
    asked: {}
};

describe('open-request field collection', () => {
    const originalAiEnabled = CLOUDPILOT_AI_CONFIG.aiEnabled;
    const originalMode = CLOUDPILOT_AI_CONFIG.openRequestFieldsSearch;

    afterEach(() => {
        CLOUDPILOT_AI_CONFIG.aiEnabled = originalAiEnabled;
        CLOUDPILOT_AI_CONFIG.openRequestFieldsSearch = originalMode;
        jest.clearAllMocks();
    });

    test('parse accepts multi-field values and ambiguousFields', () => {
        const parsed = parseOpenAIOpenRequestFieldsResponse(
            JSON.stringify({
                values: {
                    region: 'us-west-2',
                    request_name: 'finding a new fix'
                },
                ambiguousFields: []
            }),
            ['region', 'request_name']
        );

        expect(parsed.values).toEqual({
            region: 'us-west-2',
            request_name: 'finding a new fix'
        });
        expect(parsed.ambiguousFields).toEqual([]);
    });

    test('case 1: us-west-2 finding a new fix saves both and asks confirmation', async () => {
        CLOUDPILOT_AI_CONFIG.aiEnabled = true;
        CLOUDPILOT_AI_CONFIG.openRequestFieldsSearch = 'openai';
        OpenAIClient.getOpenAIClient.mockReturnValue({});
        OpenAIClient.createOpenAiChatCompletion.mockResolvedValue({
            success: true,
            data: JSON.stringify({
                values: {
                    region: 'us-west-2',
                    request_name: 'finding a new fix'
                },
                ambiguousFields: []
            }),
            usage: null
        });

        const before = {
            pendingAction: 'scan_s3',
            status: 'waiting_on_fields',
            missing: ['region', 'request_name'],
            collected: {}
        };

        const extraction = await searchMessageForOpenRequestFields(
            'us-west-2 finding a new fix',
            waitingScanS3FieldsState,
            {}
        );

        expect(extraction.values).toEqual({
            region: 'us-west-2',
            request_name: 'finding a new fix'
        });

        const effect = OpenRequestEffectFunctions.interpretOpenRequestEffect(
            {
                values: extraction.values,
                action: 'general_chat'
            },
            waitingScanS3FieldsState,
            'us-west-2 finding a new fix'
        );

        expect(effect.affectsOpenRequest).toBe(true);
        expect(effect.openRequestEffect.continueNormalConversation).toBe(false);
        expect(effect.openRequestEffect.values).toEqual({
            region: 'us-west-2',
            request_name: 'finding a new fix'
        });

        const decision = MasterDecision.decideNextStep({
            understanding: {
                values: extraction.values,
                action: 'general_chat',
                ambiguousFields: [],
                openRequestEffectResult: effect,
                rawMessage: 'us-west-2 finding a new fix'
            },
            requestState: waitingScanS3FieldsState
        });

        expect(decision.response.type).toBe(RESPONSE_TYPE.AWAITING_CONFIRMATION);
        expect(decision.chatType).toBe(CHAT_TYPE.CLOUD_PILOT_RESPONDING);
        expect(decision.request.status).toBe('waiting_on_confirmation');
        expect(decision.request.collected).toEqual({
            region: 'us-west-2',
            request_name: 'finding a new fix'
        });
        expect(decision.request.missing).toEqual([]);
        expect(decision.response.type).not.toBe(RESPONSE_TYPE.GENERAL_CHAT);

        const reply = await RequestTemplates.getRequestMessageReply({
            actionEvent: 'awaiting_confirmation',
            actionDefinition: actionMap.scan_s3,
            actionState: {
                missingFields: decision.request.missing,
                collectedFields: decision.request.collected,
                askedForFields: {},
                executionMode: null
            }
        });

        expect(reply.message.toLowerCase()).toContain('confirm');
        expect(reply.message).toContain('finding a new fix');
        expect(reply.message).toContain('us-west-2');
        expect(reply.message.toLowerCase()).not.toContain(
            'i\'ll use "finding a new fix"'
        );

        // before/after snapshot for case 1 reporting
        expect({
            before: before,
            after: {
                status: decision.request.status,
                collected: decision.request.collected,
                missing: decision.request.missing,
                responseType: decision.response.type
            }
        }).toEqual({
            before: {
                pendingAction: 'scan_s3',
                status: 'waiting_on_fields',
                missing: ['region', 'request_name'],
                collected: {}
            },
            after: {
                status: 'waiting_on_confirmation',
                collected: {
                    region: 'us-west-2',
                    request_name: 'finding a new fix'
                },
                missing: [],
                responseType: RESPONSE_TYPE.AWAITING_CONFIRMATION
            }
        });
    });

    test('case 2: us-west-2 alone saves region and still asks for scan name', () => {
        const decision = MasterDecision.decideNextStep({
            understanding: {
                values: { region: 'us-west-2' },
                action: 'general_chat',
                ambiguousFields: [],
                openRequestEffectResult: {
                    affectsOpenRequest: true,
                    openRequestEffect: {
                        type: 'information',
                        values: { region: 'us-west-2' },
                        continueNormalConversation: false
                    }
                },
                rawMessage: 'us-west-2'
            },
            requestState: waitingScanS3FieldsState
        });

        expect(decision.response.type).toBe(RESPONSE_TYPE.ASK_FOR_MISSING_FIELDS);
        expect(decision.request.collected.region).toBe('us-west-2');
        expect(decision.request.missing).toEqual(['request_name']);
        expect(decision.request.status).toBe('waiting_on_fields');
    });

    test('case 3: finding a new fix alone saves scan name and asks for region', () => {
        const decision = MasterDecision.decideNextStep({
            understanding: {
                values: { request_name: 'finding a new fix' },
                action: 'general_chat',
                ambiguousFields: [],
                openRequestEffectResult: {
                    affectsOpenRequest: true,
                    openRequestEffect: {
                        type: 'information',
                        values: { request_name: 'finding a new fix' },
                        continueNormalConversation: false
                    }
                },
                rawMessage: 'finding a new fix'
            },
            requestState: waitingScanS3FieldsState
        });

        expect(decision.response.type).toBe(RESPONSE_TYPE.ASK_FOR_MISSING_FIELDS);
        expect(decision.request.collected.request_name).toBe('finding a new fix');
        expect(decision.request.missing).toEqual(['region']);
        expect(decision.request.status).toBe('waiting_on_fields');
    });

    test('case 4: unrelated question does not silently change the open request', () => {
        const decision = MasterDecision.decideNextStep({
            understanding: {
                values: {},
                action: 'general_chat',
                question: 'ec2_inventory',
                ambiguousFields: [],
                replyType: null,
                rawMessage: 'what EC2 instances do I have?'
            },
            requestState: waitingScanS3FieldsState
        });

        expect(decision.response.type).toBe(RESPONSE_TYPE.IMMEDIATE_EXECUTION);
        expect(decision.execute.action).toBe('get_ec2_inventory');
        expect(decision.request).toBe(null);
        expect(decision.closeRequest).toBeUndefined();
    });

    test('case 5: unclear scan name asks a specific clarification', async () => {
        const decision = MasterDecision.decideNextStep({
            understanding: {
                values: {},
                action: 'general_chat',
                ambiguousFields: ['request_name'],
                rawMessage: 'maybe that one'
            },
            requestState: waitingScanS3FieldsState
        });

        expect(decision.response.type).toBe(RESPONSE_TYPE.FIELD_UNCLEAR);
        expect(decision.response.field).toBe('request_name');
        expect(decision.request.status).toBe('waiting_on_fields');
        expect(decision.request.collected).toEqual({});
        expect(decision.request.missing).toEqual(['region', 'request_name']);

        const reply = await RequestTemplates.getRequestMessageReply({
            actionEvent: 'field_unclear',
            actionDefinition: actionMap.scan_s3,
            unclearField: 'request_name',
            actionState: {
                missingFields: decision.request.missing,
                collectedFields: decision.request.collected,
                askedForFields: {}
            }
        });

        expect(reply.message.toLowerCase()).toContain('scan name');
        expect(reply.message.toLowerCase()).not.toContain('saved');
        expect(reply.message.toLowerCase()).not.toContain('ready');
    });

    test('never claims a scan name was saved when it was not', async () => {
        const decision = MasterDecision.decideNextStep({
            understanding: {
                values: { region: 'us-west-2' },
                action: 'general_chat',
                ambiguousFields: [],
                openRequestEffectResult: {
                    affectsOpenRequest: true,
                    openRequestEffect: {
                        type: 'information',
                        values: { region: 'us-west-2' },
                        continueNormalConversation: false
                    }
                },
                rawMessage: 'us-west-2 finding a new fix'
            },
            requestState: waitingScanS3FieldsState
        });

        expect(decision.request.collected.request_name).toBeUndefined();
        expect(decision.request.missing).toContain('request_name');
        expect(decision.response.type).toBe(RESPONSE_TYPE.ASK_FOR_MISSING_FIELDS);

        const reply = await RequestTemplates.getRequestMessageReply({
            actionEvent: 'missing_fields_given',
            actionDefinition: actionMap.scan_s3,
            actionState: {
                missingFields: decision.request.missing,
                collectedFields: decision.request.collected,
                askedForFields: {}
            }
        });

        expect(reply.message.toLowerCase()).not.toContain('finding a new fix');
        expect(reply.message.toLowerCase()).toContain('name');
    });

    test('internal mode stays empty for multi-word names', async () => {
        CLOUDPILOT_AI_CONFIG.aiEnabled = false;
        CLOUDPILOT_AI_CONFIG.openRequestFieldsSearch = 'openai';

        const result = await searchMessageForOpenRequestFields(
            'us-west-2 finding a new fix',
            waitingScanS3FieldsState,
            {}
        );

        expect(result.values).toEqual({});
        expect(OpenAIClient.createOpenAiChatCompletion).not.toHaveBeenCalled();
    });
});
