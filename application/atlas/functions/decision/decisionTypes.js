/*
FUNCTIONS A: Decision layer constants
    1) Function A1: CHAT_TYPE
    2) Function A2: RESPONSE_TYPE
*/

const CHAT_TYPE = {
    GENERAL_CHAT_RESPONDING: 'generalChatResponding',
    CLOUD_PILOT_RESPONDING: 'cloudPilotResponding'
};

const RESPONSE_TYPE = {
    ASK_FOR_MISSING_FIELDS: 'ask_for_missing_fields',
    AWAITING_EXECUTION_MODE: 'awaiting_execution_mode',
    AWAITING_CONFIRMATION: 'awaiting_confirmation',
    EXECUTION_INSTRUCTIONS: 'execution_instructions',
    EXECUTION_CLI: 'execution_cli',
    EXECUTION_PR: 'execution_pr',
    EXECUTION_STARTED: 'execution_started',
    REQUEST_COMPLETED: 'request_completed',
    REQUEST_FAILED: 'request_failed',
    REQUEST_CANCELLED: 'request_cancelled',
    LIST_OPEN_REQUESTS: 'list_open_requests',
    FOCUS_REQUEST: 'focus_request',
    REQUEST_STATUS: 'request_status',
    AMBIGUOUS_ACTION: 'ambiguous_action',
    WORKFLOW_RUNNING: 'workflow_running',
    GENERAL_CHAT: 'general_chat',
    IMMEDIATE_EXECUTION: 'immediate_execution'
};

const EXECUTION_MODE_REPLIES = ['instructions', 'cli', 'pr', 'automatic'];

module.exports = {
    CHAT_TYPE,
    RESPONSE_TYPE,
    EXECUTION_MODE_REPLIES
};
