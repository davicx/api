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
    buildConfirmationResult
} = require('../../../../application/atlas/cloudPilotIntelligence/understand/search/searchMessageForUserConfirmation');
const MasterDecision = require('../../../../application/atlas/cloudPilot/decide/masterDecision');
const { RESPONSE_TYPE } = require('../../../../application/atlas/cloudPilot/requests/decisionTypes');

const waitingScanS3State = {
    pendingAction: 'scan_s3',
    status: 'waiting_on_confirmation',
    executionMode: null,
    workflowId: 1,
    missing: [],
    collected: { region: 'us-west-2' },
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

    test('parseOpenAIConfirmationResponse accepts confirm cancel unclear', () => {
        expect(parseOpenAIConfirmationResponse('{"replyType":"confirm"}')).toBe('confirm');
        expect(parseOpenAIConfirmationResponse('{"replyType":"cancel"}')).toBe('cancel');
        expect(parseOpenAIConfirmationResponse('{"replyType":"unclear"}')).toBe('unclear');
        expect(parseOpenAIConfirmationResponse('not-json')).toBe(null);
        expect(parseOpenAIConfirmationResponse('{"replyType":"maybe"}')).toBe(null);
    });

    test('internal phrases: run it → confirm; cancel → cancel; lets run it → unclear', () => {
        expect(
            searchMessageForUserConfirmationInternal('run it').replyType
        ).toBe('confirm');
        expect(
            searchMessageForUserConfirmationInternal('cancel').replyType
        ).toBe('cancel');
        expect(
            searchMessageForUserConfirmationInternal('lets run it').replyType
        ).toBe('unclear');
    });

    test('openai mode: mocked confirm', async () => {
        CLOUDPILOT_AI_CONFIG.aiEnabled = true;
        CLOUDPILOT_AI_CONFIG.userConfirmationSearch = 'openai';
        OpenAIClient.getOpenAIClient.mockReturnValue({});
        OpenAIClient.createOpenAiChatCompletion.mockResolvedValue({
            success: true,
            data: '{"replyType":"confirm"}',
            usage: null
        });

        const result = await searchMessageForUserConfirmation(
            "let's run it",
            waitingScanS3State
        );

        expect(result.replyType).toBe('confirm');
        expect(result.reply).toBe('confirm');
        expect(result.replySource).toBe('openai');
        expect(OpenAIClient.createOpenAiChatCompletion).toHaveBeenCalled();
    });

    test('openai mode: mocked cancel', async () => {
        CLOUDPILOT_AI_CONFIG.aiEnabled = true;
        CLOUDPILOT_AI_CONFIG.userConfirmationSearch = 'openai';
        OpenAIClient.getOpenAIClient.mockReturnValue({});
        OpenAIClient.createOpenAiChatCompletion.mockResolvedValue({
            success: true,
            data: '{"replyType":"cancel"}',
            usage: null
        });

        const result = await searchMessageForUserConfirmation(
            "don't run it",
            waitingScanS3State
        );

        expect(result.replyType).toBe('cancel');
        expect(result.reply).toBe('cancel');
    });

    test('openai mode: mocked unclear', async () => {
        CLOUDPILOT_AI_CONFIG.aiEnabled = true;
        CLOUDPILOT_AI_CONFIG.userConfirmationSearch = 'openai';
        OpenAIClient.getOpenAIClient.mockReturnValue({});
        OpenAIClient.createOpenAiChatCompletion.mockResolvedValue({
            success: true,
            data: '{"replyType":"unclear"}',
            usage: null
        });

        const result = await searchMessageForUserConfirmation(
            'what will it do?',
            waitingScanS3State
        );

        expect(result.replyType).toBe('unclear');
        expect(result.reply).toBe(null);
    });

    test('openai invalid JSON → unclear (no phrase fallback)', async () => {
        CLOUDPILOT_AI_CONFIG.aiEnabled = true;
        CLOUDPILOT_AI_CONFIG.userConfirmationSearch = 'openai';
        OpenAIClient.getOpenAIClient.mockReturnValue({});
        OpenAIClient.createOpenAiChatCompletion.mockResolvedValue({
            success: true,
            data: 'not valid json',
            usage: null
        });

        const result = await searchMessageForUserConfirmation(
            'run it',
            waitingScanS3State
        );

        expect(result.replyType).toBe('unclear');
        expect(result.fallbackReason).toBe('invalid_json');
    });

    test('AI disabled forces internal even when openai configured', async () => {
        CLOUDPILOT_AI_CONFIG.aiEnabled = false;
        CLOUDPILOT_AI_CONFIG.userConfirmationSearch = 'openai';

        const result = await searchMessageForUserConfirmation(
            'run it',
            waitingScanS3State
        );

        expect(result.replyType).toBe('confirm');
        expect(result.replySource).toBe('internal');
        expect(OpenAIClient.createOpenAiChatCompletion).not.toHaveBeenCalled();
    });

    test('skips when not waiting_on_confirmation', async () => {
        const result = await searchMessageForUserConfirmation('run it', {
            pendingAction: 'scan_s3',
            status: 'waiting_on_fields',
            missing: ['region'],
            collected: {}
        });

        expect(result).toBe(null);
    });
});

describe('decideNextStep waiting_on_confirmation', () => {
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

    test('unclear → confirmation_unclear (not general_chat)', () => {
        const decision = MasterDecision.decideNextStep({
            understanding: {
                reply: null,
                replyType: 'unclear',
                action: 'general_chat',
                values: {},
                openRequestEffectResult: {
                    affectsOpenRequest: false,
                    openRequestEffect: { type: null, values: {} }
                }
            },
            requestState: waitingScanS3State
        });

        expect(decision.response.type).toBe(RESPONSE_TYPE.CONFIRMATION_UNCLEAR);
        expect(decision.response.type).not.toBe(RESPONSE_TYPE.GENERAL_CHAT);
        expect(decision.request.status).toBe('waiting_on_confirmation');
    });

    test('lets run it without confirm replyType stays unclear not general_chat', () => {
        const decision = MasterDecision.decideNextStep({
            understanding: {
                reply: null,
                replyType: 'unclear',
                action: 'general_chat',
                values: {},
                rawMessage: 'lets run it'
            },
            requestState: waitingScanS3State
        });

        expect(decision.response.type).toBe(RESPONSE_TYPE.CONFIRMATION_UNCLEAR);
        expect(decision.chatType).not.toBe('generalChatResponding');
    });
});

describe('buildConfirmationResult mapping', () => {
    test('maps replyType to reply contract', () => {
        expect(buildConfirmationResult('confirm', 'openai').reply).toBe('confirm');
        expect(buildConfirmationResult('cancel', 'openai').reply).toBe('cancel');
        expect(buildConfirmationResult('unclear', 'openai').reply).toBe(null);
    });
});
