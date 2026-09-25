jest.mock('../../../../application/atlas/providers/openAI/client/openAIClient', () => ({
    getOpenAIClient: jest.fn(),
    createOpenAiChatCompletion: jest.fn(),
    logOpenAI: jest.fn(),
    summarizeSearchTaskContext: jest.fn(() => 'test-context')
}));

const OpenAIClient = require('../../../../application/atlas/providers/openAI/client/openAIClient');
const { CLOUDPILOT_AI_CONFIG } = require('../../../../application/atlas/config/cloudPilotAIConfig');
const {
    searchMessageForUserConfirmation,
    searchMessageForUserConfirmationInternal,
    parseOpenAIConfirmationResponse,
    buildConfirmationResult,
    buildUserConfirmationOpenAIMessages
} = require('../../../../application/atlas/cloudPilotIntelligence/understand/search/searchMessageForUserConfirmation');
const MasterDecision = require('../../../../application/atlas/cloudPilot/decide/masterDecision');
const { RESPONSE_TYPE, CHAT_TYPE } = require('../../../../application/atlas/cloudPilot/requests/decisionTypes');
const actionMap = require('../../../../application/atlas/cloudPilot/masterCloudPilotCapabilities');
const RequestTemplates = require('../../../../application/atlas/cloudPilot/chat/templates/requestTemplates');
const {
    buildCurrentStateContext
} = require('../../../../application/atlas/cloudPilotIntelligence/context/contextTypes/cloudPilotCurrentStateContext');
const {
    buildAISystemMessage
} = require('../../../../application/atlas/cloudPilotIntelligence/context/buildSystemMessage');
const {
    shouldIsolateUnrelatedOpenRequestTurn
} = require('../../../../application/atlas/cloudPilotIntelligence/conversation/generateGeneralMessageReply');

const waitingScanS3State = {
    pendingAction: 'scan_s3',
    status: 'waiting_on_confirmation',
    executionMode: null,
    workflowId: 1,
    missing: [],
    collected: { region: 'us-west-2', request_name: 'Production S3 Scan' },
    asked: {}
};

describe('searchMessageForUserConfirmation', () => {
    const originalAiEnabled = CLOUDPILOT_AI_CONFIG.aiEnabled;
    const originalMode = CLOUDPILOT_AI_CONFIG.userConfirmationSearch;

    afterEach(() => {
        CLOUDPILOT_AI_CONFIG.aiEnabled = originalAiEnabled;
        CLOUDPILOT_AI_CONFIG.userConfirmationSearch = originalMode;
        jest.clearAllMocks();
    });

    test('parseOpenAIConfirmationResponse accepts five reply types', () => {
        expect(parseOpenAIConfirmationResponse('{"replyType":"confirm"}')).toBe('confirm');
        expect(parseOpenAIConfirmationResponse('{"replyType":"cancel"}')).toBe('cancel');
        expect(parseOpenAIConfirmationResponse('{"replyType":"about_open_request"}')).toBe(
            'about_open_request'
        );
        expect(parseOpenAIConfirmationResponse('{"replyType":"ambiguous_confirmation"}')).toBe(
            'ambiguous_confirmation'
        );
        expect(parseOpenAIConfirmationResponse('{"replyType":"unrelated"}')).toBe('unrelated');
        expect(parseOpenAIConfirmationResponse('{"replyType":"unclear"}')).toBe(null);
        expect(parseOpenAIConfirmationResponse('not-json')).toBe(null);
    });

    test('internal: known phrases remain intact and greetings are unrelated', () => {
        expect(searchMessageForUserConfirmationInternal('run it').replyType).toBe('confirm');
        expect(searchMessageForUserConfirmationInternal('cancel').replyType).toBe('cancel');
        expect(searchMessageForUserConfirmationInternal('lets run it').replyType).toBe(
            'unrelated'
        );
        expect(searchMessageForUserConfirmationInternal('hello').replyType).toBe('unrelated');
        expect(searchMessageForUserConfirmationInternal('hi').replyType).toBe('unrelated');
        expect(searchMessageForUserConfirmationInternal('help').replyType).toBe('unrelated');
        expect(searchMessageForUserConfirmationInternal('yes!').replyType).toBe('confirm');
        expect(searchMessageForUserConfirmationInternal('yes').replyType).toBe('confirm');
    });

    test('yes! uses internal confirm even if OpenAI would return unrelated', async () => {
        CLOUDPILOT_AI_CONFIG.aiEnabled = true;
        CLOUDPILOT_AI_CONFIG.userConfirmationSearch = 'openai';
        OpenAIClient.getOpenAIClient.mockReturnValue({});
        OpenAIClient.createOpenAiChatCompletion.mockResolvedValue({
            success: true,
            data: JSON.stringify({ replyType: 'unrelated' }),
            usage: null
        });

        const result = await searchMessageForUserConfirmation('yes!', waitingScanS3State);

        expect(result.replyType).toBe('confirm');
        expect(result.replySource).toBe('internal');
        expect(OpenAIClient.createOpenAiChatCompletion).not.toHaveBeenCalled();

        const decision = MasterDecision.decideNextStep({
            understanding: {
                reply: 'confirm',
                replyType: 'confirm',
                action: 'general_chat',
                values: {},
                openRequestEffectResult: {
                    affectsOpenRequest: true,
                    openRequestEffect: { type: 'confirm', values: {} }
                }
            },
            requestState: waitingScanS3State
        });

        expect(decision.response.type).toBe(RESPONSE_TYPE.EXECUTION_STARTED);
        expect(decision.response.type).not.toBe(RESPONSE_TYPE.GENERAL_CHAT);
    });

    test('openai mode: regression messages preserve all five classifier results', async () => {
        CLOUDPILOT_AI_CONFIG.aiEnabled = true;
        CLOUDPILOT_AI_CONFIG.userConfirmationSearch = 'openai';
        OpenAIClient.getOpenAIClient.mockReturnValue({});

        async function classify(message, expectedReplyType) {
            OpenAIClient.createOpenAiChatCompletion.mockResolvedValue({
                success: true,
                data: JSON.stringify({ replyType: expectedReplyType }),
                usage: null
            });
            const result = await searchMessageForUserConfirmation(
                message,
                waitingScanS3State
            );
            expect(result.replyType).toBe(expectedReplyType);
        }

        const cases = [
            ['hello', 'unrelated'],
            ['hi', 'unrelated'],
            ['help', 'unrelated'],
            ['maybe', 'ambiguous_confirmation'],
            ['is this safe?', 'about_open_request'],
            ['what will the scan do?', 'about_open_request'],
            ['will this cost money?', 'about_open_request'],
            ['what EC2 instances do I have?', 'unrelated'],
            ['yes', 'confirm'],
            ['cancel', 'cancel']
        ];

        for (const testCase of cases) {
            await classify(testCase[0], testCase[1]);
        }
    });

    test('OpenAI prompt defines the five canonical results and critical boundaries', () => {
        const prompt = buildUserConfirmationOpenAIMessages({
            userMessage: 'hello',
            action: 'scan_s3',
            actionLabel: 'Scan S3',
            description: 'Scan S3 buckets'
        }).systemMessage;

        expect(prompt).toContain('ambiguous_confirmation');
        expect(prompt).toContain('"hello", "hi", "hey", "help"');
        expect(prompt).toContain('"what will this do?"');
        expect(prompt).toContain('"is this safe?"');
        expect(prompt).toContain('"will this cost money?"');
        expect(prompt).toContain('"what region will it scan?"');
        expect(prompt).toContain('not ambiguous_confirmation merely because it is vague, short');
    });

    test('openai invalid JSON → unrelated (continue normally, no force confirm)', async () => {
        CLOUDPILOT_AI_CONFIG.aiEnabled = true;
        CLOUDPILOT_AI_CONFIG.userConfirmationSearch = 'openai';
        OpenAIClient.getOpenAIClient.mockReturnValue({});
        OpenAIClient.createOpenAiChatCompletion.mockResolvedValue({
            success: true,
            data: 'not valid json',
            usage: null
        });

        const result = await searchMessageForUserConfirmation(
            'would that be okay?',
            waitingScanS3State
        );
        expect(result.replyType).toBe('unrelated');
        expect(result.fallbackReason).toBe('invalid_json');
    });

    test('AI disabled forces internal', async () => {
        CLOUDPILOT_AI_CONFIG.aiEnabled = false;
        CLOUDPILOT_AI_CONFIG.userConfirmationSearch = 'openai';

        const result = await searchMessageForUserConfirmation('run it', waitingScanS3State);
        expect(result.replyType).toBe('confirm');
        expect(result.replySource).toBe('internal');
        expect(OpenAIClient.createOpenAiChatCompletion).not.toHaveBeenCalled();
    });
});

describe('decideNextStep waiting_on_confirmation routing', () => {
    test('confirm → execution_started', () => {
        const decision = MasterDecision.decideNextStep({
            understanding: {
                reply: 'confirm',
                replyType: 'confirm',
                action: 'general_chat',
                values: {},
                openRequestEffectResult: {
                    affectsOpenRequest: true,
                    openRequestEffect: { type: 'confirm', values: {} }
                }
            },
            requestState: waitingScanS3State
        });

        expect(decision.response.type).toBe(RESPONSE_TYPE.EXECUTION_STARTED);
        expect(decision.request.status).toBe('running');
    });

    test('cancel → request_cancelled', () => {
        const decision = MasterDecision.decideNextStep({
            understanding: {
                reply: 'cancel',
                replyType: 'cancel',
                action: 'general_chat',
                values: {},
                openRequestEffectResult: {
                    affectsOpenRequest: true,
                    openRequestEffect: { type: 'cancel', values: {} }
                }
            },
            requestState: waitingScanS3State
        });

        expect(decision.response.type).toBe(RESPONSE_TYPE.REQUEST_CANCELLED);
        expect(decision.closeRequest).toBe(true);
    });

    test('about_open_request → answer through contextual chat, do not execute or mutate', () => {
        const decision = MasterDecision.decideNextStep({
            understanding: {
                reply: null,
                replyType: 'about_open_request',
                action: 'general_chat',
                values: {}
            },
            requestState: waitingScanS3State
        });

        expect(decision.response.type).toBe(RESPONSE_TYPE.ABOUT_OPEN_REQUEST);
        expect(decision.chatType).toBe(CHAT_TYPE.GENERAL_CHAT_RESPONDING);
        expect(decision.request).toBe(null);
        expect(decision.execute).toBeUndefined();
        expect(decision.closeRequest).toBeUndefined();
    });

    test('ambiguous_confirmation → confirmation_unclear without execution', () => {
        const decision = MasterDecision.decideNextStep({
            understanding: {
                reply: null,
                replyType: 'ambiguous_confirmation',
                action: 'general_chat',
                values: {}
            },
            requestState: waitingScanS3State
        });

        expect(decision.response.type).toBe(RESPONSE_TYPE.CONFIRMATION_UNCLEAR);
        expect(decision.execute).toBeUndefined();
        expect(decision.closeRequest).toBeUndefined();
    });

    test.each(['hello', 'hi', 'help'])(
        'unrelated greeting "%s" → general_chat; pending unchanged',
        (message) => {
            const decision = MasterDecision.decideNextStep({
                understanding: {
                    reply: null,
                    replyType: 'unrelated',
                    action: 'general_chat',
                    values: {},
                    rawMessage: message
                },
                requestState: waitingScanS3State
            });

            expect(decision.response.type).toBe(RESPONSE_TYPE.GENERAL_CHAT);
            expect(decision.response.type).not.toBe(RESPONSE_TYPE.CONFIRMATION_UNCLEAR);
            expect(decision.chatType).toBe(CHAT_TYPE.GENERAL_CHAT_RESPONDING);
            expect(decision.request).toBe(null);
            expect(decision.execute).toBeUndefined();
            expect(decision.closeRequest).toBeUndefined();
        }
    );

    test('unrelated + s3 inventory question → immediate inventory, not confirmation', () => {
        const decision = MasterDecision.decideNextStep({
            understanding: {
                reply: null,
                replyType: 'unrelated',
                action: 'general_chat',
                question: 's3_inventory',
                values: {},
                rawMessage: 'how many S3 buckets do I have?'
            },
            requestState: waitingScanS3State
        });

        expect(decision.response.type).toBe(RESPONSE_TYPE.IMMEDIATE_EXECUTION);
        expect(decision.execute.action).toBe('get_s3_inventory');
    });

    test('unrelated + EC2 inventory question does not execute the open S3 scan', () => {
        const decision = MasterDecision.decideNextStep({
            understanding: {
                reply: null,
                replyType: 'unrelated',
                action: 'general_chat',
                question: 'ec2_inventory',
                values: {},
                rawMessage: 'what EC2 instances do I have?'
            },
            requestState: waitingScanS3State
        });

        expect(decision.response.type).toBe(RESPONSE_TYPE.IMMEDIATE_EXECUTION);
        expect(decision.execute.action).toBe('get_ec2_inventory');
        expect(decision.execute.action).not.toBe('scan_s3');
    });

    test('unrelated + new scan_ec2 → replace offer, do not silent replace', () => {
        const decision = MasterDecision.decideNextStep({
            understanding: {
                reply: null,
                replyType: 'unrelated',
                action: 'scan_ec2',
                values: {},
                rawMessage: 'scan my EC2'
            },
            requestState: waitingScanS3State
        });

        expect(decision.response.type).toBe(RESPONSE_TYPE.REPLACE_OPEN_REQUEST);
        expect(decision.replaceOpenRequest).toBe(false);
        expect(decision.request.action).toBe('scan_s3');
        expect(decision.request.status).toBe('waiting_on_confirmation');
    });
});

describe('scan required fields', () => {
    test('scan_s3 and scan_ec2 require region + request_name', () => {
        expect(actionMap.scan_s3.requiredFields).toEqual(['region', 'request_name']);
        expect(actionMap.scan_ec2.requiredFields).toEqual(['region', 'request_name']);
    });
});

describe('buildConfirmationResult mapping', () => {
    test('maps replyType to reply contract', () => {
        expect(buildConfirmationResult('confirm', 'openai').reply).toBe('confirm');
        expect(buildConfirmationResult('cancel', 'openai').reply).toBe('cancel');
        expect(buildConfirmationResult('unrelated', 'openai').reply).toBe(null);
        expect(buildConfirmationResult('about_open_request', 'openai').reply).toBe(null);
        expect(buildConfirmationResult('ambiguous_confirmation', 'openai').reply).toBe(null);
    });
});

describe('confirmation response wording', () => {
    test('S3 ambiguity asks one specific question', async () => {
        const result = await RequestTemplates.getRequestMessageReply({
            actionEvent: 'confirmation_unclear',
            actionDefinition: actionMap.scan_s3,
            actionState: {
                missingFields: [],
                collectedFields: waitingScanS3State.collected,
                askedForFields: {}
            }
        });

        expect(result.message).toBe('Did you want me to run the S3 scan?');
        expect(result.message).not.toContain('Please confirm whether');
        expect(result.message).not.toContain('cancel');
    });
});

describe('general response open-request guardrails', () => {
    test('unrelated turn with an open request is isolated from request context and history', () => {
        expect(
            shouldIsolateUnrelatedOpenRequestTurn({
                requestState: waitingScanS3State,
                openRequestReplyType: 'unrelated'
            })
        ).toBe(true);

        expect(
            shouldIsolateUnrelatedOpenRequestTurn({
                requestState: waitingScanS3State,
                openRequestReplyType: 'about_open_request'
            })
        ).toBe(false);
    });

    test('unrelated greeting cannot trigger an open-request reminder', () => {
        const currentState = buildCurrentStateContext({
            requestState: waitingScanS3State,
            openRequestReplyType: 'unrelated'
        });
        const systemMessage = buildAISystemMessage({ currentState });

        expect(systemMessage).toContain(
            'The current message is unrelated to the open request.'
        );
        expect(systemMessage).toContain(
            'Do not mention, summarize, confirm, cancel, or remind the user about the open request'
        );
    });

    test('about-open-request asks for an answer without a confirmation reminder', () => {
        const currentState = buildCurrentStateContext({
            requestState: waitingScanS3State,
            openRequestReplyType: 'about_open_request'
        });
        const systemMessage = buildAISystemMessage({ currentState });

        expect(systemMessage).toContain(
            'Answer the user\'s actual question about the open request'
        );
        expect(systemMessage).toContain(
            'do not append a generic confirmation or cancellation reminder'
        );
    });
});
