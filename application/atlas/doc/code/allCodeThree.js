// @ts-nocheck
/**
 * Active CloudPilot / Atlas pipeline (reference snapshot).
 * Real DB + real chat; STEP 6 execution not wired yet (mock planned).
 * Excludes: orphaned modules, action handlers, navigator adapters, commented-out blocks.
 * For reference only — not a runnable module (multiple module.exports).
 * Updated: 2026-06-13
 *
 * Pipeline:
 *   STEP 1 Normalize → STEP 2 Load request → STEP 3 Understand → STEP 4 Decide
 *   → STEP 5 Apply → STEP 7 Build response (STEP 6 executeRequest planned)
 *
 * Excluded files:
 *   workflowConversationFunctions.js, focusedWorkflowFunctions.js,
 *   conversationStateFunctions.js, functions/functions.js (legacy helpers),
 *   ec2/* handlers, aws/inventory handlers, navigatorResponseFunctions.js
 */


// ================================================================================
// FILE: application/atlas/routes/messageRoutes.js
// ================================================================================

const express = require('express');
const messageRouter = express.Router();
const messages = require('../logic/messages');
const middlewares = require('../../functions/middlewareFunctions');

/*
FUNCTIONS A: All Functions Related to Messages with an API (ChatGPT API right now)
    1) Function B1: Post Message — intent → guardrails → action → ChatGPT (no Atlas execution)
    2) Function B2: Delete Message
    3) Function B3: Edit Message
    4) Function A1: Say Hello — OpenAI smoke test

FUNCTIONS C: All Functions Related to getting Messages
    1) Function C1: Get all Group Messages
    2) Function C2: Get all Conversation Messages
*/

//FUNCTIONS A: All Functions Related to Messages with an API (ChatGPT API right now)
//Route B1: Post Message
/* 
Still need
policy: {
    allowed: false, //NOT DONE
    message: null, //NOT DONE
    reasonNotAllowed: null // e.g. "OUT_OF_SCOPE", "DESTRUCTIVE_ACTION" //NOT DONE
},
*/
messageRouter.post('/message', function (req, res) {
    messages.postMessage(req, res);
});

//Route B2: Delete Message
messageRouter.post('/message/delete', function (req, res) {
    messages.deleteMessage(req, res);
});

//Route B3: Edit Message
messageRouter.post('/message/edit', function (req, res) {
    messages.editMessage(req, res);
});

//Route A1: Say Hello — POST /message/hello
messageRouter.post('/message/hello', function (req, res) {
    messages.postMessageHello(req, res);
});

//FUNCTIONS C: All Functions Related to getting Messages
//Route C1: Get all Group Messages
messageRouter.get('/messages/group/:group_id', middlewares.verifyUser, (req, res) => {
    messages.getGroupMessages(req, res);
});

//Route C2: Get all Conversation Messages
messageRouter.get('/messages/conversation/:conversation_id', middlewares.verifyUser, (req, res) => {
    messages.getConversationMessages(req, res);
});

module.exports = messageRouter;

// ================================================================================
// FILE: application/atlas/logic/messages.js
// ================================================================================

const db = require('../../functions/conn');
const Message = require('../../functions/classes/Message');
const Group = require('../../functions/classes/Group');
const Notification = require('../../functions/classes/Notification');
const messageFunctions = require('../../functions/messageFunctions');
const cloudPilotMessageFunctions = require('../functions/cloudPilotMessageFunctions');
const Functions = require('../../functions/functions');
const openAIFunctions = require('../functions/chat/openAI/openAIFunctions');
const actionState = require('../state/ActionState');
const { CHAT_CONFIG, OPENAI_SAFE_DEFAULTS } = require('../functions/config/chatGPTconfig');

/*
FUNCTIONS A: All Functions Related to Messages with an API (ChatGPT API right now)
    1) Function A1: Post Message 
    2) Function A2: Delete Message
    3) Function A3: Edit Message
    4) Function A4: Say Hello

FUNCTIONS B: All Functions Related to getting Messages
    1) Function B1: Get all Group Messages
    2) Function B2: Get all Conversation Messages
*/


//FUNCTIONS A: Messages + external API (ChatGPT)
//Function B1: Post Message
async function postMessage(req, res) {
    const masterSite = req.body.masterSite || 'kite';
    const messageType = req.body.messageType || 'text';
    const messageFrom = req.body.messageFrom || req.body.postFrom || req.body.username;
    const messageTo = req.body.messageTo || req.body.postTo || 'chat';
    const groupID = Number(req.body.groupID || 0);
    const conversationID = Number(req.body.conversationID || 0);
    const messageCaption = req.body.messageCaption || req.body.message || req.body.postCaption;
    const cloudKey = req.body.cloudKey || 'no_cloud_key';
    const cloudBucket = req.body.cloudBucket || 'no_cloud_bucket';
    const storageType = req.body.storageType || 'local';
    
    var headerMessage = "New Message";
    Functions.addHeader(headerMessage);

    var messageOutcome = {
        data: {},
        message: "",
        success: false,
        statusCode: 500,
        errors: [],
        currentUser: messageFrom
    };

    //STEP 1: Build Message this is basically the JSON for a message
    var currentUserMessage = messageFunctions.buildNewMessage(req);
    console.log("STEP 1: Build Message ")
    console.log(currentUserMessage)

    //STEP 2: Send user message to be stored in the database
    //console.log("STEP 2: Send user message to be stored in the database");
    var currentUserMessageOutcome = await Message.createMessageText(currentUserMessage);

    //Step 2A: Add current user message to JSON output
    messageOutcome.data.currentUserMessage = currentUserMessageOutcome.newMessage;
    
    if (currentUserMessageOutcome.outcome != 200) {
        messageOutcome.message = "Failed to save user message";
        messageOutcome.statusCode = 500;
        messageOutcome.success = false;
    }


    //STEP 3: CloudPilot processing
    let cloudPilotResult = null;
    //console.log(" ");
    //console.log("STEP 4: CloudPilot checking user message and sending to OPENAI API");

    try {
        cloudPilotResult = await cloudPilotMessageFunctions.processMessage(messageCaption, conversationID, {
            masterSite: masterSite,
            requestedByUserName: messageFrom
        });
        //console.log("CloudPilot Result:");
        //console.log("___________________");
        //console.log(cloudPilotResult);
        //console.log("___________________");
    } catch (err) {
        console.error("CloudPilot error:", err);
    }

    //STEP 6: Save CloudPilot message to database
    console.log("STEP 6: Save CloudPilot message to database");

    var cloudPilotMessageOutcome = null;
    const cloudPilotReplyText =
        cloudPilotResult && cloudPilotResult.cloudPilotMessage
            ? String(cloudPilotResult.cloudPilotMessage).trim()
            : '';

    if (cloudPilotReplyText) {
        var cloudPilotMessage = messageFunctions.buildCloudPilotMessage(req, cloudPilotReplyText);
        cloudPilotMessageOutcome = await Message.createMessageText(cloudPilotMessage);

        if (cloudPilotMessageOutcome.outcome == 200) {
            console.log("STEP 6 SUCCESS: CloudPilot message saved");
        } else {
            console.log("STEP 6 FAILED: Could not save CloudPilot message");
        }
    }
    
    //Step 6A: Add CloudPilot message to JSON output when saved
    if (cloudPilotMessageOutcome && cloudPilotMessageOutcome.newMessage) {
        messageOutcome.data.CloudPilotResponseMessage = cloudPilotMessageOutcome.newMessage;
    }

    //Step 6B: Add Cloud Pilot action status to response
    if (cloudPilotResult && cloudPilotResult.cloudPilot) {
        messageOutcome.data.CloudPilotActionStatus = cloudPilotResult.cloudPilot;
    }

    //Step 6C: Add formatted Atlas data to response
    messageOutcome.data.atlasResponse = null;
    if (cloudPilotResult && cloudPilotResult.atlasResponse) {
        messageOutcome.data.atlasResponse = cloudPilotResult.atlasResponse;
    }

    //Step 6D: HTTP success when user message saved and CloudPilot chat turn completed
    const userMessageSaved = currentUserMessageOutcome.outcome == 200;
    const cloudPilotTurnCompleted = Boolean(cloudPilotResult && cloudPilotReplyText);

    if (userMessageSaved && cloudPilotTurnCompleted) {
        messageOutcome.success = true;
        messageOutcome.statusCode = 200;
        messageOutcome.errors = [];

        if (cloudPilotResult && cloudPilotResult.error) {
            messageOutcome.errors = [cloudPilotResult.error];
        }
    } else if (userMessageSaved && cloudPilotResult && cloudPilotResult.success == true) {
        messageOutcome.success = true;
        messageOutcome.statusCode = 200;
        messageOutcome.errors = [];
    } else {
        messageOutcome.errors = [];

        if (cloudPilotResult && cloudPilotResult.error) {
            messageOutcome.errors = [cloudPilotResult.error];
        }
    }

    //STEP 7: Return Response
    Functions.addFooter();
    res.json(messageOutcome);
}


//Function B2: Delete Message
async function deleteMessage(req, res) {
    //STEP 1: Read delete request fields
    console.log('STEP 1: Read delete request fields');
    const messageID = req.body.messageID;
    const currentUser = req.body.currentUser || req.body.messageFrom;

    var deleteMessageOutcome = {
        data: [],
        success: false,
        message: "",
        statusCode: 200,
        errors: [],
        currentUser: currentUser
    };

    //STEP 2: Delete the message
    console.log('STEP 2: Delete the message');
    var deleteOutcome = await Message.deleteMessage(messageID, currentUser);

    //STEP 3: Delete message outcome
    console.log('STEP 3: Delete message outcome');
    if (deleteOutcome.success) {
        deleteMessageOutcome.data.push({ messageID: messageID, currentUser: currentUser });
        deleteMessageOutcome.success = true;
        deleteMessageOutcome.message = "Successfully deleted message " + messageID;
    } else {
        deleteMessageOutcome.message = deleteOutcome.message || "Could not delete message " + messageID;
        deleteMessageOutcome.statusCode = 400;
    }

    res.json(deleteMessageOutcome);
}

//Function B3: Edit Message
async function editMessage(req, res) {
    //STEP 1: Read edit request fields
    console.log('STEP 1: Read edit request fields');
    const currentUser = req.body.currentUser || req.body.messageFrom;
    const messageID = req.body.messageID;
    const newMessageCaption = req.body.newMessageCaption || req.body.messageCaption;

    var editMessageOutcome = {
        data: [],
        success: false,
        message: "",
        statusCode: 200,
        errors: [],
        currentUser: currentUser
    };

    //STEP 2: Check if message exists
    console.log('STEP 2: Check if message exists');
    const messageExistsOutcome = await messageFunctions.checkMessageExists(messageID);

    //STEP 3: Update caption
    console.log('STEP 3: Update caption');
    if (messageExistsOutcome.messageExists) {
        const updateOutcome = await Message.updateMessageCaption(messageID, newMessageCaption, currentUser);
        if (updateOutcome.success) {
            editMessageOutcome.data.push({ messageID: messageID, newMessageCaption: newMessageCaption });
            editMessageOutcome.success = true;
            editMessageOutcome.message = "Message updated!";
        } else {
            editMessageOutcome.message = updateOutcome.message;
            editMessageOutcome.statusCode = 400;
        }
    } else {
        editMessageOutcome.message = "Message not found";
        editMessageOutcome.statusCode = 404;
    }

    //STEP 4: Edit message outcome
    console.log('STEP 4: Edit message outcome');
    res.json(editMessageOutcome);
}

//Function A4: Say Hello
async function postMessageHello(req, res) {
    console.log('postMessageHello: incoming body keys', req.body && Object.keys(req.body));
    const raw = req.body && (req.body.message ?? req.body.messageCaption);
    const userText = raw == null ? '' : typeof raw === 'string' ? raw : String(raw);

    //STEP 1: Validate user message
    console.log('STEP 1: Validate user message');
    const text = typeof userText === 'string' ? userText.trim() : '';
    if (!text) {
        return res.status(400).json({
            success: false,
            data: null,
            message: 'message is required'
        });
    }

    const maxIn = OPENAI_SAFE_DEFAULTS.MAX_USER_INPUT_CHARS;
    if (text.length > maxIn) {
        return res.status(502).json({
            success: false,
            data: null,
            message: 'message too long (max ' + maxIn + ' characters)'
        });
    }

    //STEP 2: Get OpenAI client and config
    console.log('STEP 2: Get OpenAI client and config');
    const client = openAIFunctions.getOpenAIClient();
    if (!client) {
        console.warn('[postMessageHello] OPENAI_API_KEY is not set');
        return res.status(502).json({
            success: false,
            data: null,
            message: 'OPENAI_API_KEY is not configured'
        });
    }

    const config = CHAT_CONFIG.LOW;
    console.log('[postMessageHello] model=%s max_tokens=%s temperature=%s', config.model, config.max_tokens, config.temperature);

    //STEP 3: Call ChatGPT
    console.log('STEP 3: Call ChatGPT');
    const completion = await openAIFunctions.createOpenAiChatCompletion(client, {
        model: config.model,
        messages: [
            {
                role: 'system',
                content: 'You are CloudPilot. Respond in under 5 words. Be concise.'
            },
            {
                role: 'user',
                content: text
            }
        ],
        max_tokens: config.max_tokens,
        temperature: config.temperature
    });

    if (completion.success) {
        if (completion.usage) {
            console.log(
                '[postMessageHello] usage prompt=%s completion=%s total=%s',
                completion.usage.prompt_tokens,
                completion.usage.completion_tokens,
                completion.usage.total_tokens
            );
        }
        console.log('STEP 4: New hello outcome');
        console.log('postMessageHello: result success=true');
        return res.json({
            success: true,
            data: completion.data
        });
    }

    console.log('STEP 4: Something went wrong with hello ChatGPT');
    console.log('postMessageHello: result success=false');
    return res.status(502).json({
        success: false,
        data: null,
        message: completion.message || 'ChatGPT request failed',
        error: completion.error
    });
}


//FUNCTIONS B: Get Messages
//Function B1: Get all Group Messages
async function getGroupMessages(req, res) {
    //STEP 1: Read group id and current user
   //console.log('STEP 1: Read group id and current user');
    const groupID = req.params.group_id;
    const currentUser = req.currentUser || req.body?.currentUser;

    var headerMessage = "Get all Group Messages for Group: " + groupID;
    //Functions.addHeader(headerMessage);

    //STEP 2: Get all group messages
    //console.log('STEP 2: Get all group messages');
    var messagesOutcome = await Message.getGroupMessages(groupID);
    var messages = messagesOutcome.messages || [];

    var messagesResponse = {
        data: messages,
        message: "Group messages",
        success: messagesOutcome.success,
        statusCode: 200,
        errors: [],
        currentUser: currentUser
    };

    //STEP 3: Group messages outcome
    //console.log('STEP 3: Group messages outcome');
    //Functions.addFooter();
    res.json(messagesResponse);
}

//Function B2: Get all Conversation Messages
async function getConversationMessages(req, res) {
    //STEP 1: Read conversation id and current user
    //console.log('STEP 1: Read conversation id and current user');
    const conversationID = req.params.conversation_id;
    const currentUser = req.currentUser || req.body?.currentUser;

    var headerMessage = "HEADER: Get all Conversation Messages for: " + conversationID;
    //Functions.addHeader(headerMessage);

    //STEP 2: Get all conversation messages
    //console.log('STEP 2: Get all conversation messages');
    var messagesOutcome = await Message.getConversationMessages(conversationID);
    var messages = messagesOutcome.messages || [];

    var messagesResponse = {
        data: messages,
        message: "Conversation messages",
        success: messagesOutcome.success,
        statusCode: 200,
        errors: [],
        currentUser: currentUser
    };

    //STEP 3: Conversation messages outcome
    //console.log('STEP 3: Conversation messages outcome');
    //Functions.addFooter();
    res.json(messagesResponse);
}

module.exports = { postMessageHello, postMessage, deleteMessage, editMessage, getGroupMessages, getConversationMessages };

// ================================================================================
// FILE: application/atlas/functions/config/chatGPTconfig.js
// ================================================================================

/**
 * Model presets — confirm ids + pricing at https://openai.com/api/pricing/
 * Org-level: set usage limits / budgets in the OpenAI dashboard (not in this repo).
 */
const CHAT_CONFIG = {
    LOW: {
        model: 'gpt-4o-mini',
        max_tokens: 30,
        temperature: 0.2
    },
    MEDIUM: {
        model: 'gpt-4o-mini',
        max_tokens: 150,
        temperature: 0.4
    },
    HIGH: {
        model: 'gpt-4o',
        max_tokens: 500,
        temperature: 0.7
    }
};

/**
 * Bill-safety defaults (prompt cost grows with input length; completion with max_tokens).
 * Override via env if you need more headroom for a specific deployment.
 */
const OPENAI_SAFE_DEFAULTS = {
    /** Max characters sent as the user message (after trim) — blocks huge pasted payloads. */
    MAX_USER_INPUT_CHARS: Number(process.env.OPENAI_MAX_USER_INPUT_CHARS) || 2000,
    /** Hard ceiling on max_tokens passed to the API from createOpenAiChatCompletion (defense in depth). */
    MAX_COMPLETION_TOKENS_CEILING: Number(process.env.OPENAI_MAX_COMPLETION_TOKENS_CEILING) || 512
};

module.exports = { CHAT_CONFIG, OPENAI_SAFE_DEFAULTS };

// ================================================================================
// FILE: application/atlas/state/ActionState.js
// ================================================================================

/*
EXAMPLE STATE
{
  pendingAction: "scan_ec2",
  missing: [],
  asked: {},
  collected: {
    region: "us-west-2",
    instanceId: "i-123"
  }
}

TEST: manually set state
actionState.setPendingAction(conversationID, "scan_ec2", ["region"]);

TEST
actionState.setRegion(conversationID, "us-east-1");
console.log("TEST: Updated state after region");
actionState.print(conversationID);

*/

class ActionState {
  constructor() {
    this.store = new Map();
  }

  // STEP 1: Ensure state exists
  getState(conversationId) {
    if (!this.store.has(conversationId)) {
      this.store.set(conversationId, {
        pendingAction: null,
        status: null,
        executionMode: null,
        workflowId: null,
        collected: {},
        missing: [],
        asked: {}
      });
    }

    const state = this.store.get(conversationId);

    if (!state.asked) {
      state.asked = {};
    }

    if (state.executionMode === undefined) {
      state.executionMode = null;
    }

    return state;
  }

  // STEP 2: Start a new action
  setPendingAction(conversationId, action, missingFields = []) {
    const state = this.getState(conversationId);

    state.pendingAction = action;
    state.status = "pending";
    state.executionMode = null;
    state.workflowId = null;
    state.missing = [...missingFields];
    state.collected = {};
    state.asked = {};
  }

  // STEP 2B: Load open action from database row into memory (after server restart)
  loadActionFromDatabase(conversationId, dbAction) {
    const state = this.getState(conversationId);

    state.pendingAction = dbAction.actionType;
    state.status = dbAction.status;
    state.executionMode = dbAction.executionMode || null;
    state.workflowId = dbAction.workflowId || null;
    state.collected = { ...(dbAction.collected || {}) };
    state.missing = [...(dbAction.missing || [])];
    state.asked = { ...(dbAction.asked || {}) };
  }

  // STEP 3: Get current action status (FIXED: consistent naming)
  getActionStatus(conversationId) {
    const state = this.getState(conversationId);

    return {
      pendingAction: state.pendingAction,
      status: state.status,
      executionMode: state.executionMode,
      workflowId: state.workflowId || null,
      missing: state.missing,
      collected: state.collected,
      asked: state.asked
    };
  }

  // STEP 3.25: Set workflow lifecycle status
  setStatus(conversationId, status) {
    const state = this.getState(conversationId);

    state.status = status;
  }

  // STEP 3.3: Set execution mode (instructions, cli, pr, automatic)
  setExecutionMode(conversationId, executionMode) {
    const state = this.getState(conversationId);

    state.executionMode = executionMode;
  }

  // STEP 3.4: Link in-memory state to persisted workflow row
  setWorkflowId(conversationId, workflowId) {
    const state = this.getState(conversationId);

    state.workflowId = workflowId;
  }

  // STEP 3.5: Mark missing field as already asked
  markAsked(conversationId, field) {
    const state = this.getState(conversationId);

    state.asked[field] = true;
  }

  // STEP 4: Set region (specific helper)
  setRegion(conversationId, region) {
    const state = this.getState(conversationId);

    state.collected.region = region;
    state.missing = state.missing.filter(field => field !== "region");
  }

  // STEP 5: Generic field setter
  setField(conversationId, field, value) {
    const state = this.getState(conversationId);

    state.collected[field] = value;
    state.missing = state.missing.filter(f => f !== field);
  }

  // STEP 6: Check if ready to execute
  isReady(conversationId) {
    const state = this.getState(conversationId);
    return state.pendingAction && state.missing.length === 0;
  }

  // STEP 7: Clear state after completion
  clear(conversationId) {
    this.store.delete(conversationId);
  }

  // STEP 8: Debug helper
  print(conversationId) {
    const state = this.getState(conversationId);
    console.log("STATE:", JSON.stringify(state, null, 2));
  }
}

module.exports = new ActionState();



/*
//EXAMPLE
{
  pendingAction: "scan_ec2",
  missing: [],
  collected: {
    region: "us-west-2",
    instanceId: "i-123"
  }
}


*/

/*
class ActionState {
    constructor() {
      this.store = new Map();
    }
  
    // STEP 1: Ensure state exists
    getState(conversationId) {
      if (!this.store.has(conversationId)) {
        this.store.set(conversationId, {
          pendingAction: null,
          collected: {},
          missing: []
        });
      }
  
      return this.store.get(conversationId);
    }
  
    // STEP 2: Start a new action
    setPendingAction(conversationId, action, missingFields = []) {
      const state = this.getState(conversationId);
  
      state.pendingAction = action;
      state.missing = [...missingFields];
      state.collected = {};
    }
  
    // STEP 3: Get current action status
    getActionStatus(conversationId) {
      const state = this.getState(conversationId);
  
      return {
        action: state.pendingAction,
        missing: state.missing,
        collected: state.collected
      };
    }
  
    // STEP 4: Set region (your main use case)
    setRegion(conversationId, region) {
      const state = this.getState(conversationId);
  
      state.collected.region = region;
  
      state.missing = state.missing.filter(field => field !== "region");
    }
  
    // STEP 5: Generic field setter (useful later)
    setField(conversationId, field, value) {
      const state = this.getState(conversationId);
  
      state.collected[field] = value;
  
      state.missing = state.missing.filter(f => f !== field);
    }
  
    // STEP 6: Check if ready to execute
    isReady(conversationId) {
      const state = this.getState(conversationId);
      return state.pendingAction && state.missing.length === 0;
    }
  
    // STEP 7: Clear state after completion
    clear(conversationId) {
      this.store.delete(conversationId);
    }
  
    // STEP 8: Debug helper (you'll use this a LOT)
    print(conversationId) {
      const state = this.getState(conversationId);
      console.log("STATE:", JSON.stringify(state, null, 2));
    }
  }
  
  module.exports = new ActionState();
  */

// ================================================================================
// FILE: application/atlas/functions/actionStatusFunctions.js
// ================================================================================

/*
FUNCTIONS A: User-friendly action status (P2B)
    1) Function A1: initialStatusForNewAction
    2) Function A2: statusWhenFieldsComplete
    3) Function A3: isWaitingOnConfirmation
    4) Function A4: isWaitingOnExecutionMode
    5) Function A5: isCollectingFields
    6) Function A6: isTerminalStatus
    7) Function A7: shouldUpdateStatusWhenFieldsComplete
*/


const STATUS = {
    WAITING_ON_FIELDS: 'waiting_on_fields',
    WAITING_ON_EXECUTION_MODE: 'waiting_on_execution_mode',
    WAITING_ON_CONFIRMATION: 'waiting_on_confirmation',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
    // Legacy — treat like new values when reading old rows
    PENDING: 'pending',
    READY: 'ready'
};

//Function A1: Status when a new action row is created
function initialStatusForNewAction(requiredFields) {
    const missing = Array.isArray(requiredFields) ? requiredFields : [];

    if (missing.length > 0) {
        return STATUS.WAITING_ON_FIELDS;
    }

    return STATUS.WAITING_ON_CONFIRMATION;
}

//Function A2: Status after all required fields are collected
function statusWhenFieldsComplete(actionSupportsExecutionModes, executionMode) {
    if (actionSupportsExecutionModes && !executionMode) {
        return STATUS.WAITING_ON_EXECUTION_MODE;
    }

    return STATUS.WAITING_ON_CONFIRMATION;
}

//Function A3: User can confirm execution (yes)
function isWaitingOnConfirmation(status) {
    return (
        status === STATUS.WAITING_ON_CONFIRMATION ||
        status === STATUS.READY
    );
}

//Function A4: User must pick execution mode 1–4
function isWaitingOnExecutionMode(status) {
    return (
        status === STATUS.WAITING_ON_EXECUTION_MODE
    );
}

//Function A5: User still owes field values
function isCollectingFields(status) {
    return (
        status === STATUS.WAITING_ON_FIELDS ||
        status === STATUS.PENDING ||
        status == null ||
        status === ''
    );
}

//Function A6: Action row is closed or finished running
function isTerminalStatus(status) {
    return (
        status === STATUS.COMPLETED ||
        status === STATUS.FAILED ||
        status === STATUS.CANCELLED
    );
}

//Function A7: Should we write status now that fields are complete?
function shouldUpdateStatusWhenFieldsComplete(currentStatus, actionSupportsExecutionModes, executionMode) {
    const targetStatus = statusWhenFieldsComplete(actionSupportsExecutionModes, executionMode);

    if (currentStatus === targetStatus) {
        return false;
    }

    if (isCollectingFields(currentStatus) || currentStatus === STATUS.READY) {
        return true;
    }

    if (
        isWaitingOnExecutionMode(currentStatus) &&
        targetStatus === STATUS.WAITING_ON_CONFIRMATION
    ) {
        return true;
    }

    return false;
}

module.exports = {
    STATUS,
    initialStatusForNewAction,
    statusWhenFieldsComplete,
    isWaitingOnConfirmation,
    isWaitingOnExecutionMode,
    isCollectingFields,
    isTerminalStatus,
    shouldUpdateStatusWhenFieldsComplete
};

// ================================================================================
// FILE: application/atlas/functions/classes/Actions.js
// ================================================================================

const db = require('../../../functions/conn');
const { initialStatusForNewAction } = require('../actionStatusFunctions');

/*
METHODS A: CREATE WORKFLOW RELATED
    1) Method A1: createAction

METHODS B: GET WORKFLOW RELATED
    1) Method B1: getAction
    2) Method B2: getOpenActionForConversation
    3) Method B3: getAllOpenActions
    4) Method B4: getActionsByConversation
    5) Method B5: getActionsByOrganization
    6) Method B6: getActionsByUser
    7) Method B7: getMissingActionInfo

METHODS C: UPDATE WORKFLOW RELATED
    1) Method C1: updateAction
    2) Method C2: setStatus
    3) Method C3: setExecutionMode
    4) Method C4: setField
    5) Method C5: markAsked

METHODS D: CLOSE WORKFLOW RELATED (no DELETE)
    1) Method D1: finishAction
    2) Method D2: cancelAction

Doc: application/atlas/doc/current_development.md
Phase 1: one is_open = 1 row per conversation_id (enforced in createAction).
*/

class Actions {

    constructor(workflowId) {
        this.workflowId = workflowId;
    }

    //METHODS A: CREATE WORKFLOW RELATED
    //Method A1: Insert a new workflow row
    static async createAction({
        organization,
        conversationId,
        requestedByUserName,
        actionType,
        requiredFields,
        actionName,
        displayName,
        actionNotes,
        priority
    }) {
        const connection = db.getConnection();

        var outcome = {
            success: false,
            workflowId: null,
            action: null,
            errors: []
        };

        try {
            const openCheck = await runQuery(
                connection,
                'SELECT id FROM cloudpilot_requests WHERE conversation_id = ? AND is_open = 1 LIMIT 1',
                [Number(conversationId)]
            );

            if (openCheck && openCheck.length > 0) {
                outcome.errors.push({
                    code: 'open_workflow_exists',
                    message: 'This conversation already has an open workflow.',
                    existingWorkflowId: openCheck[0].id
                });
                return outcome;
            }

            const actionId = await resolveActionIdByType(
                connection,
                String(actionType || '').trim()
            );

            if (!actionId) {
                outcome.errors.push({
                    code: 'action_type_not_found',
                    message:
                        'Action type not found in cloudpilot_actions. Seed the registry table first.',
                    actionType: String(actionType || '').trim()
                });
                return outcome;
            }

            const missingFields = Array.isArray(requiredFields) ? requiredFields.slice() : [];
            const collected = {};
            const asked = {};
            const initialStatus = initialStatusForNewAction(missingFields);
            const resolvedDisplayName =
                displayName != null && String(displayName).trim() !== ''
                    ? String(displayName).trim()
                    : actionName != null && String(actionName).trim() !== ''
                      ? String(actionName).trim()
                      : null;

            const insertResults = await runQuery(
                connection,
                `INSERT INTO cloudpilot_requests (
                    organization,
                    conversation_id,
                    requested_by_user,
                    action_id,
                    action_name,
                    display_name,
                    action_notes,
                    status,
                    priority,
                    is_open,
                    collected,
                    missing,
                    asked
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
                [
                    String(organization || 'Cloud Pilot').trim(),
                    Number(conversationId),
                    String(requestedByUserName || '').trim(),
                    actionId,
                    actionName || null,
                    resolvedDisplayName,
                    actionNotes || null,
                    initialStatus,
                    priority || 'normal',
                    stringifyJsonColumn(collected),
                    stringifyJsonColumn(missingFields),
                    stringifyJsonColumn(asked)
                ]
            );

            const workflowId = insertResults.insertId;
            const loaded = await Actions.getAction(workflowId);

            outcome.success = loaded.success;
            outcome.workflowId = workflowId;
            outcome.action = loaded.action || null;

            return outcome;

        } catch (err) {
            console.log('Actions.createAction failed', err);
            outcome.errors.push(err);
            return outcome;
        }
    }

    //METHODS B: GET WORKFLOW RELATED
    //Method B1: Get single workflow by id
    static async getAction(workflowId) {
        const connection = db.getConnection();

        try {
            const rows = await runQuery(
                connection,
                REQUEST_SELECT + ' WHERE r.id = ? LIMIT 1',
                [Number(workflowId)]
            );

            if (!rows || rows.length === 0) {
                return { success: false, action: null, errors: [] };
            }

            return {
                success: true,
                action: mapRowToAction(rows[0]),
                errors: []
            };

        } catch (err) {
            console.log('Actions.getAction failed', err);
            return { success: false, action: null, errors: [err] };
        }
    }

    //Method B2: Get open workflow for a conversation (Phase 1: 0 or 1 row)
    static async getOpenActionForConversation(conversationId) {
        const connection = db.getConnection();

        try {
            const rows = await runQuery(
                connection,
                REQUEST_SELECT +
                    ' WHERE r.conversation_id = ? AND r.is_open = 1 LIMIT 1',
                [Number(conversationId)]
            );

            if (!rows || rows.length === 0) {
                return { success: true, action: null, errors: [] };
            }

            return {
                success: true,
                action: mapRowToAction(rows[0]),
                errors: []
            };

        } catch (err) {
            console.log('Actions.getOpenActionForConversation failed', err);
            return { success: false, action: null, errors: [err] };
        }
    }

    //Method B3: Get all open workflows for a conversation
    static async getAllOpenActions(conversationId) {
        const connection = db.getConnection();

        try {
            const rows = await runQuery(
                connection,
                REQUEST_SELECT +
                    ' WHERE r.conversation_id = ? AND r.is_open = 1 ORDER BY r.id DESC',
                [Number(conversationId)]
            );

            return {
                success: true,
                actions: (rows || []).map(mapRowToAction),
                errors: []
            };

        } catch (err) {
            console.log('Actions.getAllOpenActions failed', err);
            return { success: false, actions: [], errors: [err] };
        }
    }

    //Method B4: Get workflows for a conversation (open and/or history)
    static async getActionsByConversation(conversationId, options) {
        const connection = db.getConnection();
        const opts = options || {};

        const conditions = ['r.conversation_id = ?'];
        const params = [Number(conversationId)];

        if (opts.isOpen === true) {
            conditions.push('r.is_open = 1');
        } else if (opts.isOpen === false) {
            conditions.push('r.is_open = 0');
        }

        if (opts.status) {
            conditions.push('r.status = ?');
            params.push(String(opts.status));
        }

        if (opts.actionType) {
            conditions.push('a.action_type = ?');
            params.push(String(opts.actionType));
        }

        let queryString =
            REQUEST_SELECT + ' WHERE ' + conditions.join(' AND ') + ' ORDER BY r.id DESC';

        const limit = Number(opts.limit);
        if (limit > 0) {
            queryString += ' LIMIT ?';
            params.push(limit);
        }

        try {
            const rows = await runQuery(connection, queryString, params);

            return {
                success: true,
                actions: (rows || []).map(mapRowToAction),
                errors: []
            };

        } catch (err) {
            console.log('Actions.getActionsByConversation failed', err);
            return { success: false, actions: [], errors: [err] };
        }
    }

    //Method B5: Get workflows for an organization
    static async getActionsByOrganization(organization, options) {
        const connection = db.getConnection();
        const opts = options || {};

        const conditions = ['r.organization = ?'];
        const params = [String(organization || '').trim()];

        if (opts.isOpen === true) {
            conditions.push('r.is_open = 1');
        } else if (opts.isOpen === false) {
            conditions.push('r.is_open = 0');
        }

        if (opts.status) {
            conditions.push('r.status = ?');
            params.push(String(opts.status));
        }

        if (opts.requestedByUserName) {
            conditions.push('r.requested_by_user = ?');
            params.push(String(opts.requestedByUserName));
        }

        let queryString =
            REQUEST_SELECT + ' WHERE ' + conditions.join(' AND ') + ' ORDER BY r.id DESC';

        const limit = Number(opts.limit);
        if (limit > 0) {
            queryString += ' LIMIT ?';
            params.push(limit);
        }

        try {
            const rows = await runQuery(connection, queryString, params);

            return {
                success: true,
                actions: (rows || []).map(mapRowToAction),
                errors: []
            };

        } catch (err) {
            console.log('Actions.getActionsByOrganization failed', err);
            return { success: false, actions: [], errors: [err] };
        }
    }

    //Method B6: Get workflows by user (requested_by_user_name)
    static async getActionsByUser(requestedByUserName, options) {
        const connection = db.getConnection();
        const opts = options || {};

        const conditions = ['r.requested_by_user = ?'];
        const params = [String(requestedByUserName || '').trim()];

        if (opts.organization != null) {
            conditions.push('r.organization = ?');
            params.push(String(opts.organization).trim());
        }

        if (opts.isOpen === true) {
            conditions.push('r.is_open = 1');
        } else if (opts.isOpen === false) {
            conditions.push('r.is_open = 0');
        }

        if (opts.status) {
            conditions.push('r.status = ?');
            params.push(String(opts.status));
        }

        let queryString =
            REQUEST_SELECT + ' WHERE ' + conditions.join(' AND ') + ' ORDER BY r.id DESC';

        const limit = Number(opts.limit);
        if (limit > 0) {
            queryString += ' LIMIT ?';
            params.push(limit);
        }

        try {
            const rows = await runQuery(connection, queryString, params);

            return {
                success: true,
                actions: (rows || []).map(mapRowToAction),
                errors: []
            };

        } catch (err) {
            console.log('Actions.getActionsByUser failed', err);
            return { success: false, actions: [], errors: [err] };
        }
    }

    //Method B7: Get missing action info (human-readable summary)
    static async getMissingActionInfo(conversationId) {
        const openResult = await Actions.getAllOpenActions(conversationId);

        if (!openResult.success) {
            return {
                success: false,
                message: '',
                actions: [],
                errors: openResult.errors
            };
        }

        if (!openResult.actions || openResult.actions.length === 0) {
            return {
                success: true,
                message: 'You have no open actions waiting.',
                actions: [],
                errors: []
            };
        }

        const lines = ['Open Actions', ''];

        openResult.actions.forEach((action, index) => {
            const label = action.actionName || action.actionType || 'Action';
            const missingList =
                action.missing && action.missing.length > 0
                    ? action.missing.join(', ')
                    : 'confirmation or execution';

            lines.push((index + 1) + '. ' + label);
            lines.push('   Missing: ' + missingList);
            lines.push('');
        });

        return {
            success: true,
            message: lines.join('\n').trim(),
            actions: openResult.actions,
            errors: []
        };
    }

    //METHODS C: UPDATE WORKFLOW RELATED
    //Method C1: Update workflow (allowed columns only)
    static async updateAction(workflowId, updates) {
        const connection = db.getConnection();
        const patch = updates || {};

        const setParts = [];
        const params = [];

        for (const key of Object.keys(patch)) {
            const column = ALLOWED_UPDATE_COLUMNS[key];
            if (!column) {
                continue;
            }

            let value = patch[key];

            if (column === 'collected' || column === 'missing' || column === 'asked') {
                value = stringifyJsonColumn(value);
            }

            setParts.push(column + ' = ?');
            params.push(value);
        }

        var outcome = {
            success: false,
            action: null,
            errors: []
        };

        if (setParts.length === 0) {
            outcome.errors.push({
                code: 'no_updates',
                message: 'No valid fields to update.'
            });
            return outcome;
        }

        params.push(Number(workflowId));

        try {
            await runQuery(
                connection,
                'UPDATE cloudpilot_requests SET ' + setParts.join(', ') + ' WHERE id = ?',
                params
            );

            const loaded = await Actions.getAction(workflowId);
            outcome.success = loaded.success;
            outcome.action = loaded.action;

            return outcome;

        } catch (err) {
            console.log('Actions.updateAction failed', err);
            outcome.errors.push(err);
            return outcome;
        }
    }

    //Method C2: Set workflow status
    static async setStatus(workflowId, status) {
        return Actions.updateAction(workflowId, { status: status });
    }

    //Method C3: Set execution mode (instructions, cli, pr, automatic)
    static async setExecutionMode(workflowId, executionMode) {
        return Actions.updateAction(workflowId, { execution_mode: executionMode });
    }

    //Method C4: Set collected field (updates collected + missing)
    static async setField(workflowId, fieldName, fieldValue) {
        const current = await Actions.getAction(workflowId);

        if (!current.success || !current.action) {
            return {
                success: false,
                action: null,
                errors: [{ code: 'workflow_not_found', message: 'Workflow not found.' }]
            };
        }

        const collected = { ...(current.action.collected || {}) };
        collected[fieldName] = fieldValue;

        const missing = (current.action.missing || []).filter(
            (name) => name !== fieldName
        );

        return Actions.updateAction(workflowId, {
            collected: collected,
            missing: missing
        });
    }

    //Method C5: Mark field as already asked
    static async markAsked(workflowId, fieldName) {
        const current = await Actions.getAction(workflowId);

        if (!current.success || !current.action) {
            return {
                success: false,
                action: null,
                errors: [{ code: 'workflow_not_found', message: 'Workflow not found.' }]
            };
        }

        const asked = { ...(current.action.asked || {}) };
        asked[fieldName] = true;

        return Actions.updateAction(workflowId, { asked: asked });
    }

    //METHODS D: CLOSE WORKFLOW RELATED (no DELETE)
    //Method D1: Finish workflow (keep row, is_open = 0)
    static async finishAction(workflowId, status, outcomeCode) {
        const connection = db.getConnection();

        var outcome = {
            success: false,
            action: null,
            errors: []
        };

        try {
            await runQuery(
                connection,
                `UPDATE cloudpilot_requests
                 SET is_open = 0,
                     status = ?,
                     outcome_code = ?,
                     completed_at = NOW()
                 WHERE id = ?`,
                [
                    String(status || 'completed'),
                    outcomeCode || null,
                    Number(workflowId)
                ]
            );

            const loaded = await Actions.getAction(workflowId);
            outcome.success = loaded.success;
            outcome.action = loaded.action;

            return outcome;

        } catch (err) {
            console.log('Actions.finishAction failed', err);
            outcome.errors.push(err);
            return outcome;
        }
    }

    //Method D2: Cancel workflow
    static async cancelAction(workflowId) {
        return Actions.finishAction(workflowId, 'cancelled', 'cancelled_by_user');
    }
}

//FUNCTIONS B: Workflow DB helpers (file-local — not atlas/functions.js AWS extractors)
const REQUEST_SELECT =
    'SELECT r.*, a.action_type FROM cloudpilot_requests r INNER JOIN cloudpilot_actions a ON a.id = r.action_id';

const ALLOWED_UPDATE_COLUMNS = {
    status: 'status',
    execution_mode: 'execution_mode',
    collected: 'collected',
    missing: 'missing',
    asked: 'asked',
    priority: 'priority',
    action_name: 'action_name',
    display_name: 'display_name',
    action_notes: 'action_notes',
    outcome_code: 'outcome_code'
};

//Function B1: Parse JSON column from MySQL
function parseJsonColumn(value, defaultValue) {
    if (value == null) {
        return defaultValue;
    }
    if (typeof value === 'object') {
        return value;
    }
    try {
        return JSON.parse(value);
    } catch (err) {
        return defaultValue;
    }
}

//Function B2: Stringify value for JSON column insert/update
function stringifyJsonColumn(value) {
    if (value == null) {
        return null;
    }
    return JSON.stringify(value);
}

//Function B3: Map database row to action object
function mapRowToAction(row) {
    if (!row) {
        return null;
    }

    return {
        workflowId: row.id,
        actionId: row.action_id,
        organization: row.organization,
        conversationId: row.conversation_id,
        requestedByUserName: row.requested_by_user,
        actionType: row.action_type,
        actionName: row.action_name,
        displayName: row.display_name,
        actionNotes: row.action_notes,
        status: row.status,
        outcomeCode: row.outcome_code,
        priority: row.priority,
        executionMode: row.execution_mode,
        isOpen: row.is_open === 1,
        collected: parseJsonColumn(row.collected, {}),
        missing: parseJsonColumn(row.missing, []),
        asked: parseJsonColumn(row.asked, {}),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        completedAt: row.completed_at
    };
}

//Function B4: Resolve cloudpilot_actions.id from action_type
async function resolveActionIdByType(connection, actionType) {
    if (!actionType) {
        return null;
    }

    const rows = await runQuery(
        connection,
        'SELECT id FROM cloudpilot_actions WHERE action_type = ? LIMIT 1',
        [actionType]
    );

    if (!rows || rows.length === 0) {
        return null;
    }

    return rows[0].id;
}

//Function B5: Promise wrapper for connection.query
function runQuery(connection, queryString, params) {
    return new Promise(function (resolve, reject) {
        connection.query(queryString, params, function (err, results) {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
}

module.exports = Actions;

// ================================================================================
// FILE: application/atlas/functions/actions/actionStateFunctions.js
// ================================================================================

const actionState = require('../../state/ActionState');
const Actions = require('../classes/Actions');

/*
FUNCTIONS A: Action state — database is source of truth (Phase 1D)
    1) Function A1: getUsersActionState
    2) Function A2: loadUsersOpenAction
    3) Function A3: startNewUsersAction
    4) Function A4: setUsersActionField
    5) Function A5: setUsersActionStatus
    6) Function A6: setUsersActionExecutionMode
    7) Function A7: useDatabaseActionState

FUNCTIONS B: Helpers
    1) Function B1: actionStateIsEmpty
    2) Function B2: mapActionToState
    3) Function B3: emptyActionState
    4) Function B4: closeOpenActionBeforeStartingNew
*/

//FUNCTIONS B: Helpers
//Function B3: Empty action state (no open row)
function emptyActionState() {
    return {
        pendingAction: null,
        status: null,
        executionMode: null,
        workflowId: null,
        missing: [],
        collected: {},
        asked: {}
    };
}

//Function B2: Turn a database action row into orchestration shape
function mapActionToState(dbAction) {
    if (!dbAction) {
        return null;
    }

    return {
        pendingAction: dbAction.actionType,
        status: dbAction.status,
        executionMode: dbAction.executionMode || null,
        workflowId: dbAction.workflowId,
        collected: { ...(dbAction.collected || {}) },
        missing: [...(dbAction.missing || [])],
        asked: { ...(dbAction.asked || {}) }
    };
}

//Function B1: Does state have no active action?
function actionStateIsEmpty(state) {
    if (!state) {
        return true;
    }

    return !state.pendingAction;
}

//Function A7: Are we saving and loading actions from the database?
function useDatabaseActionState() {
    const backend = String(process.env.CLOUDPILOT_STATE_BACKEND || 'mysql')
        .trim()
        .toLowerCase();

    return backend !== 'memory';
}

//FUNCTIONS A: Action state — database is source of truth
//Function A1: Read this user's open action from the database (or memory in tests)
async function getUsersActionState(conversationID) {
    if (!useDatabaseActionState()) {
        return actionState.getActionStatus(conversationID);
    }

    const openResult = await Actions.getOpenActionForConversation(conversationID);

    if (!openResult.success) {
        console.log('Failed to read open action from database');
        console.log(openResult.errors);
        return emptyActionState();
    }

    if (!openResult.action) {
        return emptyActionState();
    }

    return mapActionToState(openResult.action);
}

//Function A2: Load open action at start of message (database mode — use getUsersActionState in processMessage)
async function loadUsersOpenAction(conversationID) {
    if (!useDatabaseActionState()) {
        return { loaded: false, reason: 'memory_only_mode' };
    }

    const state = await getUsersActionState(conversationID);

    if (!state.pendingAction) {
        return { loaded: false, reason: 'no_open_action' };
    }

    return {
        loaded: true,
        actionId: state.workflowId
    };
}

//Function B4: Close any open row before starting a different action (Phase 1 — one open per conversation)
async function closeOpenActionBeforeStartingNew(conversationID) {
    const openResult = await Actions.getOpenActionForConversation(conversationID);

    if (!openResult.success || !openResult.action) {
        return;
    }

    await Actions.cancelAction(openResult.action.workflowId);

    console.log(
        'Closed open action before starting new — actionId:',
        openResult.action.workflowId,
        'actionType:',
        openResult.action.actionType
    );
}

//Function A3: Start a new action row in the database
async function startNewUsersAction(conversationID, processMessageContext, actionDefinition) {
    if (!useDatabaseActionState()) {
        actionState.setPendingAction(
            conversationID,
            actionDefinition.type,
            actionDefinition.requiredFields || []
        );

        const createActionOutcome = await Actions.createAction({
            organization: processMessageContext.masterSite,
            conversationId: conversationID,
            requestedByUserName: processMessageContext.requestedByUserName,
            actionType: actionDefinition.type,
            requiredFields: actionDefinition.requiredFields || [],
            actionName: actionDefinition.actionLabel || null,
            displayName: actionDefinition.actionLabel || null
        });

        if (createActionOutcome.success) {
            actionState.setWorkflowId(conversationID, createActionOutcome.workflowId);
        }

        return {
            success: createActionOutcome.success,
            state: actionState.getActionStatus(conversationID),
            errors: createActionOutcome.errors
        };
    }

    await closeOpenActionBeforeStartingNew(conversationID);

    const createActionOutcome = await Actions.createAction({
        organization: processMessageContext.masterSite,
        conversationId: conversationID,
        requestedByUserName: processMessageContext.requestedByUserName,
        actionType: actionDefinition.type,
        requiredFields: actionDefinition.requiredFields || [],
        actionName: actionDefinition.actionLabel || null,
        displayName: actionDefinition.actionLabel || null
    });

    if (!createActionOutcome.success) {
        console.log('Failed to create action in database');
        console.log(createActionOutcome.errors);

        return {
            success: false,
            state: await getUsersActionState(conversationID),
            errors: createActionOutcome.errors
        };
    }

    console.log('New action in database — actionId:', createActionOutcome.workflowId);

    return {
        success: true,
        state: mapActionToState(createActionOutcome.action),
        errors: []
    };
}

//Function A4: Save one collected field on the open action
async function setUsersActionField(conversationID, fieldName, fieldValue) {
    if (!useDatabaseActionState()) {
        actionState.setField(conversationID, fieldName, fieldValue);
        return actionState.getActionStatus(conversationID);
    }

    const openResult = await Actions.getOpenActionForConversation(conversationID);

    if (!openResult.success || !openResult.action) {
        return emptyActionState();
    }

    const updateResult = await Actions.setField(
        openResult.action.workflowId,
        fieldName,
        fieldValue
    );

    if (!updateResult.success || !updateResult.action) {
        return await getUsersActionState(conversationID);
    }

    return mapActionToState(updateResult.action);
}

//Function A5: Save status on the open action
async function setUsersActionStatus(conversationID, status) {
    if (!useDatabaseActionState()) {
        actionState.setStatus(conversationID, status);
        return actionState.getActionStatus(conversationID);
    }

    const openResult = await Actions.getOpenActionForConversation(conversationID);

    if (!openResult.success || !openResult.action) {
        return emptyActionState();
    }

    const updateResult = await Actions.setStatus(openResult.action.workflowId, status);

    if (!updateResult.success || !updateResult.action) {
        return await getUsersActionState(conversationID);
    }

    return mapActionToState(updateResult.action);
}

//Function A6: Save execution mode on the open action
async function setUsersActionExecutionMode(conversationID, executionMode) {
    if (!useDatabaseActionState()) {
        actionState.setExecutionMode(conversationID, executionMode);
        return actionState.getActionStatus(conversationID);
    }

    const openResult = await Actions.getOpenActionForConversation(conversationID);

    if (!openResult.success || !openResult.action) {
        return emptyActionState();
    }

    const updateResult = await Actions.setExecutionMode(
        openResult.action.workflowId,
        executionMode
    );

    if (!updateResult.success || !updateResult.action) {
        return await getUsersActionState(conversationID);
    }

    return mapActionToState(updateResult.action);
}

//Function A8: Debug — print current action state
async function printUsersActionState(conversationID, messageVar) {
    console.log(' ');
    console.log('_____________________________________');
    console.log(messageVar);

    const state = await getUsersActionState(conversationID);

    console.log('ACTION STATE:', JSON.stringify(state, null, 2));
    console.log('_____________________________________');
    console.log(' ');
}

module.exports = {
    getUsersActionState,
    loadUsersOpenAction,
    startNewUsersAction,
    setUsersActionField,
    setUsersActionStatus,
    setUsersActionExecutionMode,
    useDatabaseActionState,
    actionStateIsEmpty,
    mapActionToState,
    emptyActionState,
    closeOpenActionBeforeStartingNew,
    printUsersActionState
};

// ================================================================================
// FILE: application/atlas/functions/decision/decisionTypes.js
// ================================================================================

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

// ================================================================================
// FILE: application/atlas/functions/decision/decideNextStep.js
// ================================================================================

const actionRegistry = require('../actions/actionRegistry');
const ActionStatusFunctions = require('../actionStatusFunctions');
const { CHAT_TYPE, RESPONSE_TYPE, EXECUTION_MODE_REPLIES } = require('./decisionTypes');

/*
FUNCTIONS A: Decision layer — target request state + response type (no DB, no chat, no Atlas)
    1) Function A1: decideNextStep

FUNCTIONS B: Helpers
    1) Function B1: normalizeRequestState
    2) Function B2: buildRequestFromState
    3) Function B3: shouldStartNewRequest
    4) Function B4: hasApplicableValues
    5) Function B5: mergeValuesIntoRequest
    6) Function B6: isReadyForExecutionMode
    7) Function B7: buildNewRequestDecision
    8) Function B8: buildFieldsMergedDecision
    9) Function B9: handleExecutionModeSelection
    10) Function B10: resolveRequestChat
    11) Function B11: shouldStartImmediateExecution
    12) Function B12: shouldStartExecutionOnConfirm
    13) Function B13: buildExecutionStartedDecision
*/

//Function A1: Given understanding + loaded request state, return chatType, target request, and response type
function decideNextStep({ understanding, requestState }) {
    const state = normalizeRequestState(requestState);
    const u = understanding || {};

    if (u.ambiguous) {
        return cloudpilotDecision(buildRequestFromState(state), RESPONSE_TYPE.AMBIGUOUS_ACTION);
    }

    if (u.conversation === 'list_open') {
        return cloudpilotDecision(buildRequestFromState(state), RESPONSE_TYPE.LIST_OPEN_REQUESTS);
    }

    if (u.conversation === 'focus_switch') {
        return cloudpilotDecision(buildRequestFromState(state), RESPONSE_TYPE.FOCUS_REQUEST);
    }

    if (u.conversation === 'status') {
        return cloudpilotDecision(buildRequestFromState(state), RESPONSE_TYPE.REQUEST_STATUS);
    }

    if (state.pendingAction && state.status === ActionStatusFunctions.STATUS.RUNNING) {
        return cloudpilotDecision(buildRequestFromState(state), RESPONSE_TYPE.WORKFLOW_RUNNING);
    }

    if (u.reply === 'cancel' && state.pendingAction) {
        return {
            chatType: CHAT_TYPE.CLOUD_PILOT_RESPONDING,
            request: null,
            response: { type: RESPONSE_TYPE.REQUEST_CANCELLED },
            closeRequest: true
        };
    }

    if (
        state.pendingAction &&
        state.status === ActionStatusFunctions.STATUS.FAILED &&
        u.reply === 'confirm'
    ) {
        return cloudpilotDecision(buildRequestFromState(state), RESPONSE_TYPE.REQUEST_FAILED);
    }

    if (state.pendingAction && EXECUTION_MODE_REPLIES.includes(u.reply) && isReadyForExecutionMode(state)) {
        return handleExecutionModeSelection(state, u.reply);
    }

    if (shouldStartExecutionOnConfirm(state, u.reply)) {
        return buildExecutionStartedDecision(state);
    }

    if (shouldStartImmediateExecution(state, u)) {
        return {
            chatType: CHAT_TYPE.CLOUD_PILOT_RESPONDING,
            request: null,
            response: { type: RESPONSE_TYPE.IMMEDIATE_EXECUTION },
            execute: { action: 'inventory_aws' }
        };
    }

    if (u.action && u.action !== 'general_chat' && shouldStartNewRequest(state, u.action)) {
        return buildNewRequestDecision(u);
    }

    if (state.pendingAction && u.action && u.action === state.pendingAction) {
        return resolveRequestChat(state);
    }

    if (state.pendingAction && hasApplicableValues(state, u.values)) {
        return buildFieldsMergedDecision(state, u.values);
    }

    if (state.pendingAction) {
        return resolveRequestChat(state);
    }

    return {
        chatType: CHAT_TYPE.GENERAL_CHAT_RESPONDING,
        request: null,
        response: { type: RESPONSE_TYPE.GENERAL_CHAT }
    };
}

//Function B1: Normalize loaded request state into a consistent shape
function normalizeRequestState(requestState) {
    const state = requestState || {};

    return {
        pendingAction: state.pendingAction || null,
        status: state.status || null,
        executionMode: state.executionMode || null,
        workflowId: state.workflowId || null,
        missing: Array.isArray(state.missing) ? state.missing.slice() : [],
        collected: { ...(state.collected || {}) },
        asked: { ...(state.asked || {}) }
    };
}

//Function B2: Map loaded state to decision request target
function buildRequestFromState(state) {
    const missing = state.missing || [];

    return {
        action: state.pendingAction,
        collected: { ...(state.collected || {}) },
        missing: missing.slice(),
        ready: missing.length === 0,
        status: state.status,
        executionMode: state.executionMode || null
    };
}

//Function B3: Should we start or replace the active request with a new action?
function shouldStartNewRequest(state, action) {
    const pendingAction = state.pendingAction;

    if (!pendingAction) {
        return true;
    }

    if (pendingAction !== action) {
        return true;
    }

    if (state.status === ActionStatusFunctions.STATUS.COMPLETED) {
        return true;
    }

    if (state.status === ActionStatusFunctions.STATUS.FAILED) {
        return true;
    }

    return false;
}

//Function B4: Do extracted values apply to the open request?
function hasApplicableValues(state, values) {
    if (!values || typeof values !== 'object') {
        return false;
    }

    const missing = state.missing || [];
    const actionDefinition = actionRegistry[state.pendingAction];
    const requiredFields = actionDefinition && Array.isArray(actionDefinition.requiredFields)
        ? actionDefinition.requiredFields
        : [];

    for (const fieldName of Object.keys(values)) {
        const fieldValue = values[fieldName];

        if (fieldValue == null || fieldValue === '') {
            continue;
        }

        if (missing.includes(fieldName) || requiredFields.includes(fieldName)) {
            return true;
        }
    }

    return false;
}

//Function B5: Merge understanding values into collected / missing
function mergeValuesIntoRequest(collected, requiredFields, values, defaults, currentMissing) {
    const newCollected = { ...(defaults || {}), ...(collected || {}) };
    const missingSet = new Set(
        Array.isArray(currentMissing) && currentMissing.length > 0
            ? currentMissing
            : requiredFields.filter((fieldName) => {
                const fieldValue = newCollected[fieldName];
                return fieldValue == null || fieldValue === '';
            })
    );

    if (values) {
        for (const fieldName of Object.keys(values)) {
            const fieldValue = values[fieldName];

            if (fieldValue == null || fieldValue === '') {
                continue;
            }

            if (requiredFields.includes(fieldName) || missingSet.has(fieldName)) {
                newCollected[fieldName] = fieldValue;
                missingSet.delete(fieldName);
            }
        }
    }

    const missing = requiredFields.filter((fieldName) => {
        const fieldValue = newCollected[fieldName];
        return fieldValue == null || fieldValue === '';
    });

    return { collected: newCollected, missing };
}

//Function B6: Is the user allowed to pick execution mode 1–4 right now?
function isReadyForExecutionMode(state) {
    const actionDefinition = actionRegistry[state.pendingAction];
    const supportsExecutionModes = actionRegistry.actionRequiresExecutionModeSelection(actionDefinition);

    if (!supportsExecutionModes) {
        return false;
    }

    if (ActionStatusFunctions.isWaitingOnExecutionMode(state.status)) {
        return true;
    }

    const ready = (state.missing || []).length === 0;

    return ready && !state.executionMode;
}

//Function B7: Target state for a brand-new workflow request
function buildNewRequestDecision(understanding) {
    const action = understanding.action;
    const actionDefinition = actionRegistry[action];
    const requiredFields = actionDefinition && Array.isArray(actionDefinition.requiredFields)
        ? actionDefinition.requiredFields
        : [];
    const defaults = actionDefinition && actionDefinition.defaults ? actionDefinition.defaults : {};
    const supportsExecutionModes = actionRegistry.actionRequiresExecutionModeSelection(actionDefinition);

    const merged = mergeValuesIntoRequest({}, requiredFields, understanding.values, defaults);
    const ready = merged.missing.length === 0;

    let status = ActionStatusFunctions.STATUS.WAITING_ON_FIELDS;

    if (ready) {
        status = ActionStatusFunctions.statusWhenFieldsComplete(supportsExecutionModes, null);
    }

    const request = {
        action,
        collected: merged.collected,
        missing: merged.missing,
        ready,
        status,
        executionMode: null
    };

    let responseType = RESPONSE_TYPE.ASK_FOR_MISSING_FIELDS;

    if (ready) {
        responseType = supportsExecutionModes
            ? RESPONSE_TYPE.AWAITING_EXECUTION_MODE
            : RESPONSE_TYPE.AWAITING_CONFIRMATION;
    }

    return cloudpilotDecision(request, responseType);
}

//Function B8: Target state after merging field values into an open request
function buildFieldsMergedDecision(state, values) {
    const actionDefinition = actionRegistry[state.pendingAction];
    const requiredFields = actionDefinition && Array.isArray(actionDefinition.requiredFields)
        ? actionDefinition.requiredFields
        : [];
    const supportsExecutionModes = actionRegistry.actionRequiresExecutionModeSelection(actionDefinition);

    const merged = mergeValuesIntoRequest(
        state.collected,
        requiredFields,
        values,
        null,
        state.missing
    );
    const ready = merged.missing.length === 0;

    let status = state.status;

    if (ready && ActionStatusFunctions.isCollectingFields(state.status)) {
        status = ActionStatusFunctions.statusWhenFieldsComplete(
            supportsExecutionModes,
            state.executionMode
        );
    }

    const request = {
        action: state.pendingAction,
        collected: merged.collected,
        missing: merged.missing,
        ready,
        status,
        executionMode: state.executionMode || null
    };

    let responseType = RESPONSE_TYPE.ASK_FOR_MISSING_FIELDS;

    if (ready) {
        if (ActionStatusFunctions.isWaitingOnExecutionMode(status)) {
            responseType = RESPONSE_TYPE.AWAITING_EXECUTION_MODE;
        } else if (ActionStatusFunctions.isWaitingOnConfirmation(status)) {
            responseType = RESPONSE_TYPE.AWAITING_CONFIRMATION;
        }
    }

    return cloudpilotDecision(request, responseType);
}

//Function B9: User picked execution mode — modes 1–3 close request; mode 4 awaits confirmation
function handleExecutionModeSelection(state, mode) {
    const request = buildRequestFromState(state);
    request.executionMode = mode;

    if (mode === 'automatic') {
        request.status = ActionStatusFunctions.STATUS.WAITING_ON_CONFIRMATION;

        return cloudpilotDecision(request, RESPONSE_TYPE.AWAITING_CONFIRMATION);
    }

    request.status = ActionStatusFunctions.STATUS.COMPLETED;
    request.ready = true;

    const responseTypeByMode = {
        instructions: RESPONSE_TYPE.EXECUTION_INSTRUCTIONS,
        cli: RESPONSE_TYPE.EXECUTION_CLI,
        pr: RESPONSE_TYPE.EXECUTION_PR
    };

    return {
        chatType: CHAT_TYPE.CLOUD_PILOT_RESPONDING,
        request,
        response: { type: responseTypeByMode[mode] },
        closeRequest: true
    };
}

//Function B10: Open request with no state change — derive chat response from current state
function resolveRequestChat(state) {
    const request = buildRequestFromState(state);
    const actionDefinition = actionRegistry[state.pendingAction];
    const supportsExecutionModes = actionRegistry.actionRequiresExecutionModeSelection(actionDefinition);
    const ready = (state.missing || []).length === 0;

    let responseType = RESPONSE_TYPE.ASK_FOR_MISSING_FIELDS;

    if (state.status === ActionStatusFunctions.STATUS.RUNNING) {
        responseType = RESPONSE_TYPE.WORKFLOW_RUNNING;
    } else if (state.status === ActionStatusFunctions.STATUS.FAILED) {
        responseType = RESPONSE_TYPE.REQUEST_FAILED;
    } else if (ready && supportsExecutionModes && !state.executionMode) {
        responseType = RESPONSE_TYPE.AWAITING_EXECUTION_MODE;
    } else if (ready && ActionStatusFunctions.isWaitingOnConfirmation(state.status)) {
        responseType = RESPONSE_TYPE.AWAITING_CONFIRMATION;
    } else if ((state.missing || []).length > 0) {
        responseType = RESPONSE_TYPE.ASK_FOR_MISSING_FIELDS;
    } else if (ready) {
        responseType = RESPONSE_TYPE.AWAITING_CONFIRMATION;
    }

    return cloudpilotDecision(request, responseType);
}

//Function B11: inventory_aws — immediate execution, no request row
function shouldStartImmediateExecution(state, understanding) {
    if (understanding.action !== 'inventory_aws') {
        return false;
    }

    const actionDefinition = actionRegistry.inventory_aws;

    if (!actionDefinition || actionDefinition.requiresWorkflow || !actionDefinition.requiresExecution) {
        return false;
    }

    if (!state.pendingAction) {
        return true;
    }

    return ActionStatusFunctions.isTerminalStatus(state.status);
}

//Function B12: User said yes — start execution when confirmation rules are met
function shouldStartExecutionOnConfirm(state, reply) {
    if (!state.pendingAction) {
        return false;
    }

    if (reply !== 'confirm') {
        return false;
    }

    if (!ActionStatusFunctions.isWaitingOnConfirmation(state.status)) {
        return false;
    }

    const actionDefinition = actionRegistry[state.pendingAction];
    const needsExecutionMode = actionRegistry.actionRequiresExecutionModeSelection(actionDefinition);

    if (needsExecutionMode) {
        if (state.executionMode === 'automatic') {
            return true;
        }

        return false;
    }

    return true;
}

//Function B13: Target state when user confirmed — run the open request
function buildExecutionStartedDecision(state) {
    const request = buildRequestFromState(state);
    request.status = ActionStatusFunctions.STATUS.RUNNING;

    return cloudpilotDecision(request, RESPONSE_TYPE.EXECUTION_STARTED);
}

function cloudpilotDecision(request, responseType) {
    return {
        chatType: CHAT_TYPE.CLOUD_PILOT_RESPONDING,
        request,
        response: { type: responseType }
    };
}

module.exports = { decideNextStep };

// ================================================================================
// FILE: application/atlas/functions/understanding/search/searchMessageForAction.js
// ================================================================================

const actionRegistry = require('../../actions/actionRegistry');

/*
FUNCTIONS A: Action detection from user message (rules / registry)
    1) Function A1: searchMessageForAction
*/

//Function A1: Find an action intent in the message
function searchMessageForAction(message) {
    const normalizedMessage = String(message || '').toLowerCase().trim();
    const matches = [];

    for (const action of Object.values(actionRegistry)) {
        if (typeof action.match === 'function' && action.match(normalizedMessage)) {
            matches.push(action.type);
        }
    }

    if (matches.length > 1) {
        return {
            action: null,
            ambiguous: true,
            candidates: matches.slice(),
            source: 'rules',
            confidence: 1.0
        };
    }

    if (matches.length === 1) {
        return {
            action: matches[0],
            ambiguous: false,
            candidates: [],
            source: 'rules',
            confidence: 1.0
        };
    }

    return {
        action: 'general_chat',
        ambiguous: false,
        candidates: [],
        source: 'rules',
        confidence: 1.0
    };
}

module.exports = { searchMessageForAction };

// ================================================================================
// FILE: application/atlas/functions/understanding/search/searchMessageForConversation.js
// ================================================================================

/*
FUNCTIONS A: Conversation intent extraction from user message (status / list / focus)
    1) Function A1: searchMessageForConversation
*/

const LIST_OPEN_PHRASES = [
    'show open actions',
    'show my open actions',
    'list open actions',
    'list my actions',
    'what am i waiting on',
    'what are my open actions',
    'open actions',
    'my open actions'
];

const STATUS_PHRASES = [
    'what is the status',
    'whats the status',
    "what's the status",
    'show status',
    'request status',
    'current status',
    'where are we',
    'what step are we on'
];

//Function A1: Find status, list, or focus conversation intents in the message
function searchMessageForConversation(message) {
    const text = String(message || '').toLowerCase().trim();

    if (!text) {
        return null;
    }

    for (let i = 0; i < LIST_OPEN_PHRASES.length; i++) {
        const phrase = LIST_OPEN_PHRASES[i];
        if (text === phrase || text.includes(phrase)) {
            return 'list_open';
        }
    }

    for (let i = 0; i < STATUS_PHRASES.length; i++) {
        const phrase = STATUS_PHRASES[i];
        if (text === phrase || text.includes(phrase)) {
            return 'status';
        }
    }

    if (/^(?:switch to|focus on|work on|use|select|run)\s*#?\d+$/i.test(text)) {
        return 'focus_switch';
    }

    if (/^(?:switch to|focus on|work on|use|select)\s+\S+/i.test(text)) {
        return 'focus_switch';
    }

    return null;
}

module.exports = { searchMessageForConversation };

// ================================================================================
// FILE: application/atlas/functions/understanding/search/searchMessageForInstanceId.js
// ================================================================================

/*
FUNCTIONS A: EC2 instance ID extraction from user message
    1) Function A1: searchMessageForInstanceId
*/

//Function A1: Find EC2 instance IDs in the message
function searchMessageForInstanceId(message) {
    const text = String(message || '');
    const matches = [];

    const regex = /\b(i-[0-9a-f]{8,17})\b/gi;
    let match;

    while ((match = regex.exec(text)) !== null) {
        matches.push(String(match[1]).toLowerCase());
    }

    if (matches.length === 0) {
        return {};
    }

    if (matches.length === 1) {
        return { instance_id: matches[0] };
    }

    return {
        primary_instance_id: matches[0],
        secondary_instance_id: matches[1]
    };
}

module.exports = { searchMessageForInstanceId };

// ================================================================================
// FILE: application/atlas/functions/understanding/search/searchMessageForInstanceType.js
// ================================================================================

/*
FUNCTIONS A: EC2 instance type extraction from user message
    1) Function A1: searchMessageForInstanceType
*/

//Function A1: Find an EC2 instance type in the message
function searchMessageForInstanceType(message) {
    const text = String(message || '');
    const match = text.match(/\b(t2|t3|m5|c5)\.(micro|small|medium|large)\b/i);

    if (!match) {
        return {};
    }

    return { instance_type: String(match[0]).toLowerCase() };
}

module.exports = { searchMessageForInstanceType };

// ================================================================================
// FILE: application/atlas/functions/understanding/search/searchMessageForName.js
// ================================================================================

/*
FUNCTIONS A: Instance name extraction from user message
    1) Function A1: searchMessageForName
*/

//Function A1: Find an instance name in the message
function searchMessageForName(message) {
    const s = String(message || '');
    let match = s.match(/\bname\s+it\s+([a-z0-9][a-z0-9._-]*)\b/i);

    if (match) {
        return { name: String(match[1]).trim() };
    }

    match = s.match(/\bcall\s+it\s+([a-z0-9][a-z0-9._-]*)\b/i);

    if (match) {
        return { name: String(match[1]).trim() };
    }

    const trimmed = s.trim();
    const lower = trimmed.toLowerCase();

    if (/^(hello|hi|hey|thanks|thank you|yes|no|ok)\s*$/i.test(lower)) {
        return {};
    }

    const afterLeadIn = trimmed.replace(/^(ok|yes|sure|thanks)[,.\s]+/i, '').trim();
    const candidate = afterLeadIn.length ? afterLeadIn : trimmed;

    if (/^i-[0-9a-f]/i.test(candidate)) {
        return {};
    }

    if (/^(t2|t3|m5|c5)\./i.test(candidate)) {
        return {};
    }

    if (
        /^[a-z0-9][a-z0-9._-]{1,62}$/i.test(candidate) &&
        (candidate.includes('-') || candidate.includes('_') || candidate.includes('.'))
    ) {
        return { name: candidate };
    }

    return {};
}

module.exports = { searchMessageForName };

// ================================================================================
// FILE: application/atlas/functions/understanding/search/searchMessageForRegion.js
// ================================================================================

/*
FUNCTIONS A: Region extraction from user message
    1) Function A1: searchMessageForRegion
*/

//Function A1: Find an AWS region in the message
function searchMessageForRegion(message) {
    const text = String(message || '');
    const match = text.match(/\b((?:us|eu|ap|sa|ca|me|af)-(?:gov-)?[a-z]+-\d)\b/i);

    if (!match) {
        return {};
    }

    return { region: String(match[1]).toLowerCase() };
}

module.exports = { searchMessageForRegion };

// ================================================================================
// FILE: application/atlas/functions/understanding/search/searchMessageForReply.js
// ================================================================================

/*
FUNCTIONS A: Reply extraction from user message (confirm / cancel / execution mode)
    1) Function A1: searchMessageForReply
*/

const EXECUTION_MODES = {
    '1': 'instructions',
    '2': 'cli',
    '3': 'pr',
    '4': 'automatic'
};

const CONFIRM_MESSAGES = [
    'yes',
    'confirm',
    'run it',
    'do it',
    'proceed',
    'execute'
];

const CANCEL_PHRASES = ['cancel', 'stop', 'never mind', 'nevermind', 'forget it', 'abort', 'quit'];

//Function A1: Find confirm, cancel, or execution mode in the message
function searchMessageForReply(message) {
    const normalized = String(message || '').toLowerCase().trim().replace(/[.!?]+$/g, '');

    if (!normalized) {
        return null;
    }

    if (Object.prototype.hasOwnProperty.call(EXECUTION_MODES, normalized)) {
        return EXECUTION_MODES[normalized];
    }

    for (let i = 0; i < CANCEL_PHRASES.length; i++) {
        const phrase = CANCEL_PHRASES[i];
        if (normalized === phrase || normalized.includes(phrase)) {
            return 'cancel';
        }
    }

    if (CONFIRM_MESSAGES.includes(normalized)) {
        return 'confirm';
    }

    return null;
}

module.exports = { searchMessageForReply };

// ================================================================================
// FILE: application/atlas/functions/understanding/search/searchMessageForStructuredFields.js
// ================================================================================

/*
FUNCTIONS A: Structured field extraction from user message
    1) Function A1: searchMessageForStructuredFields
*/

//Function A1: Find field: "value" pairs in the message
function searchMessageForStructuredFields(message) {
    const values = {};
    const text = String(message || '');
    const regex = /(\w+)\s*:\s*"([^"]+)"/g;

    let match;

    while ((match = regex.exec(text)) !== null) {
        values[match[1]] = match[2];
    }

    return values;
}

module.exports = { searchMessageForStructuredFields };

// ================================================================================
// FILE: application/atlas/functions/understanding/search/searchMessageForValues.js
// ================================================================================

const SearchMessageForRegionFunctions = require('./searchMessageForRegion');
const SearchMessageForStructuredFieldsFunctions = require('./searchMessageForStructuredFields');
const SearchMessageForInstanceIdFunctions = require('./searchMessageForInstanceId');
const SearchMessageForInstanceTypeFunctions = require('./searchMessageForInstanceType');
const SearchMessageForNameFunctions = require('./searchMessageForName');

/*
FUNCTIONS A: Structured field extraction from user message
    1) Function A1: searchMessageForValues
*/

//Function A1: Find all structured field values in the message
function searchMessageForValues(message) {
    const structured = SearchMessageForStructuredFieldsFunctions.searchMessageForStructuredFields(message);
    const values = { ...structured };

    const regionResult = SearchMessageForRegionFunctions.searchMessageForRegion(message);
    if (regionResult.region && values.region === undefined) {
        values.region = regionResult.region;
    }

    const instanceResult = SearchMessageForInstanceIdFunctions.searchMessageForInstanceId(message);
    const hasStructuredInstanceField =
        values.instance_id !== undefined ||
        values.primary_instance_id !== undefined ||
        values.secondary_instance_id !== undefined;

    for (const key of Object.keys(instanceResult)) {
        if (values[key] !== undefined) {
            continue;
        }

        if (key === 'instance_id' && hasStructuredInstanceField) {
            continue;
        }

        values[key] = instanceResult[key];
    }

    const typeResult = SearchMessageForInstanceTypeFunctions.searchMessageForInstanceType(message);
    if (typeResult.instance_type && values.instance_type === undefined) {
        values.instance_type = typeResult.instance_type;
    }

    const nameResult = SearchMessageForNameFunctions.searchMessageForName(message);
    if (nameResult.name && values.name === undefined) {
        values.name = nameResult.name;
    }

    return values;
}

module.exports = { searchMessageForValues };

// ================================================================================
// FILE: application/atlas/functions/understanding/understandMessage.js
// ================================================================================

const SearchMessageForActionFunctions = require('./search/searchMessageForAction');
const SearchMessageForValuesFunctions = require('./search/searchMessageForValues');
const SearchMessageForReplyFunctions = require('./search/searchMessageForReply');
const SearchMessageForConversationFunctions = require('./search/searchMessageForConversation');

/*
FUNCTIONS F: Message understanding — extract signals from a message (no DB, no chat text)
    1) Function F1: understandMessage
*/

//Function F1: Orchestrator entry — run all searches, merge into messageUnderstanding
async function understandMessage(message) {
    const values = SearchMessageForValuesFunctions.searchMessageForValues(message);
    const reply = SearchMessageForReplyFunctions.searchMessageForReply(message);
    const conversation = SearchMessageForConversationFunctions.searchMessageForConversation(message);
    const actionResult = SearchMessageForActionFunctions.searchMessageForAction(message);

    return {
        action: actionResult.action,
        values,
        reply,
        conversation,
        ambiguous: actionResult.ambiguous,
        candidates: actionResult.candidates.slice(),
        source: actionResult.source,
        confidence: actionResult.confidence
    };
}

// DECISION: Moved to decision/ — open-request guard skipped action detection (Slice 2)
// async function understandMessage(message, actionState) {
//     const context = buildUnderstandingContext(actionState);
//     const activeRequest = context.activeRequest || null;
//
//     const values = SearchMessageForValuesFunctions.searchMessageForValues(message);
//     const reply = SearchMessageForReplyFunctions.searchMessageForReply(message);
//     const conversation = SearchMessageForConversationFunctions.searchMessageForConversation(message);
//
//     const emptySignals = {
//         action: null,
//         values,
//         reply,
//         conversation,
//         ambiguous: false,
//         candidates: [],
//         source: 'rules',
//         confidence: 1.0
//     };
//
//     if (activeRequest) {
//         return emptySignals;
//     }
//
//     const actionResult = SearchMessageForActionFunctions.searchMessageForAction(message);
//
//     return {
//         action: actionResult.action,
//         values,
//         reply,
//         conversation,
//         ambiguous: actionResult.ambiguous,
//         candidates: actionResult.candidates.slice(),
//         source: actionResult.source,
//         confidence: actionResult.confidence
//     };
// }

// DECISION: Moved to decision/
// function buildUnderstandingContext(actionState) {
//     const state = actionState || {};
//
//     return {
//         activeRequest: state.pendingAction || null,
//         status: state.status || null,
//         missing: Array.isArray(state.missing) ? state.missing.slice() : [],
//         executionMode: state.executionMode || null
//     };
// }

module.exports = { understandMessage };

// ================================================================================
// FILE: application/atlas/functions/requests/requestHelpers.js
// ================================================================================

/*
FUNCTIONS A: Shared helpers for requests/ (STEP 5)
    1) Function A1: copyObject
    2) Function A2: copyStringArray
    3) Function A3: buildDbUpdatesFromTargetRequest
*/

//Function A1: Shallow copy of a plain object
function copyObject(source) {
    const copy = {};
    const keys = Object.keys(source || {});

    for (let i = 0; i < keys.length; i++) {
        const fieldName = keys[i];
        copy[fieldName] = source[fieldName];
    }

    return copy;
}

//Function A2: Copy an array of strings
function copyStringArray(source) {
    const copy = [];

    if (!Array.isArray(source)) {
        return copy;
    }

    for (let i = 0; i < source.length; i++) {
        copy.push(source[i]);
    }

    return copy;
}

//Function A3: Map decision.request fields to Actions.updateAction keys
function buildDbUpdatesFromTargetRequest(targetRequest) {
    const updates = {};

    if (targetRequest.collected) {
        updates.collected = copyObject(targetRequest.collected);
    }

    if (targetRequest.missing) {
        updates.missing = copyStringArray(targetRequest.missing);
    }

    if (targetRequest.status) {
        updates.status = targetRequest.status;
    }

    if (targetRequest.executionMode != null && targetRequest.executionMode !== '') {
        updates.execution_mode = targetRequest.executionMode;
    }

    return updates;
}

module.exports = {
    copyObject,
    copyStringArray,
    buildDbUpdatesFromTargetRequest
};

// ================================================================================
// FILE: application/atlas/functions/requests/startRequest.js
// ================================================================================

const actionRegistry = require('../actions/actionRegistry');
const Actions = require('../classes/Actions');
const ActionStateFunctions = require('../actions/actionStateFunctions');
const RequestHelpers = require('./requestHelpers');

/*
FUNCTIONS A: Create a new request row (STEP 5 — startRequest)
    1) Function A1: startRequest

FUNCTIONS B: Helpers
    1) Function B1: buildFailedOutcome
*/

//Function A1: Insert row and sync target state from decision.request
async function startRequest(decision, context) {
    const conversationID = context.conversationID;
    const processMessageContext = context.context || {};
    const targetRequest = decision.request;
    const actionType = targetRequest.action;
    const actionDefinition = actionRegistry[actionType];

    if (!actionDefinition) {
        return buildFailedOutcome('created', 'action_not_in_registry', null);
    }

    const requiredFields = [];
    const registryFields = actionDefinition.requiredFields || [];

    for (let i = 0; i < registryFields.length; i++) {
        requiredFields.push(registryFields[i]);
    }

    let displayName = null;

    if (actionDefinition.actionLabel) {
        displayName = actionDefinition.actionLabel;
    }

    const createOutcome = await Actions.createAction({
        organization: processMessageContext.masterSite,
        conversationId: conversationID,
        requestedByUserName: processMessageContext.requestedByUserName,
        actionType: actionType,
        requiredFields: requiredFields,
        actionName: displayName,
        displayName: displayName
    });

    if (!createOutcome.success) {
        console.log('startRequest: failed to create row');
        console.log(createOutcome.errors);

        return {
            success: false,
            action: 'created',
            reason: null,
            requestID: null,
            request: null,
            error: createOutcome.errors
        };
    }

    const workflowId = createOutcome.workflowId;
    let dbAction = createOutcome.action;
    const updates = RequestHelpers.buildDbUpdatesFromTargetRequest(targetRequest);

    if (Object.keys(updates).length > 0) {
        const updateOutcome = await Actions.updateAction(workflowId, updates);

        if (!updateOutcome.success) {
            console.log('startRequest: create OK but prefill update failed');
            console.log(updateOutcome.errors);

            return {
                success: false,
                action: 'created',
                reason: null,
                requestID: workflowId,
                request: ActionStateFunctions.mapActionToState(dbAction),
                error: updateOutcome.errors
            };
        }

        if (updateOutcome.action) {
            dbAction = updateOutcome.action;
        }
    }

    console.log('startRequest: new row — requestID:', workflowId, 'actionType:', actionType);

    return {
        success: true,
        action: 'created',
        reason: null,
        requestID: workflowId,
        request: ActionStateFunctions.mapActionToState(dbAction),
        error: null
    };
}

//Function B1: Standard failure outcome
function buildFailedOutcome(action, reason, error) {
    return {
        success: false,
        action: action,
        reason: reason,
        requestID: null,
        request: null,
        error: error
    };
}

module.exports = {
    startRequest
};

// ================================================================================
// FILE: application/atlas/functions/requests/updateRequest.js
// ================================================================================

const Actions = require('../classes/Actions');
const ActionStateFunctions = require('../actions/actionStateFunctions');
const RequestHelpers = require('./requestHelpers');

/*
FUNCTIONS A: Update the open request row (STEP 5 — updateRequest)
    1) Function A1: updateRequest
*/

//Function A1: Sync decision.request onto the open row
async function updateRequest(decision, context) {
    const requestState = context.requestState || ActionStateFunctions.emptyActionState();
    const workflowId = requestState.workflowId;
    const targetRequest = decision.request;

    if (!workflowId) {
        console.log('updateRequest: no workflowId on open request');

        return {
            success: false,
            action: 'updated',
            reason: null,
            requestID: null,
            request: requestState,
            error: [{ code: 'no_open_request_id', message: 'Open request has no workflowId.' }]
        };
    }

    const updates = RequestHelpers.buildDbUpdatesFromTargetRequest(targetRequest);
    const updateOutcome = await Actions.updateAction(workflowId, updates);

    if (!updateOutcome.success) {
        console.log('updateRequest: update failed');
        console.log(updateOutcome.errors);

        return {
            success: false,
            action: 'updated',
            reason: null,
            requestID: workflowId,
            request: requestState,
            error: updateOutcome.errors
        };
    }

    console.log('updateRequest: requestID:', workflowId, 'actionType:', targetRequest.action);

    return {
        success: true,
        action: 'updated',
        reason: null,
        requestID: workflowId,
        request: ActionStateFunctions.mapActionToState(updateOutcome.action),
        error: null
    };
}

module.exports = {
    updateRequest
};

// ================================================================================
// FILE: application/atlas/functions/requests/applyDecision.js
// ================================================================================

const ActionStateFunctions = require('../actions/actionStateFunctions');
const { RESPONSE_TYPE } = require('../decision/decisionTypes');
const StartRequestFunctions = require('./startRequest');
const UpdateRequestFunctions = require('./updateRequest');

/*
FUNCTIONS A: Apply STEP 4 decision to the database (STEP 5)
    1) Function A1: applyDecision

FUNCTIONS B: Helpers
    1) Function B1: buildSkipOutcome
    2) Function B2: resolveSkipReasonForNoRequest
    3) Function B3: requestTargetMatchesState
    4) Function B4: arraysMatchInOrder
*/

//Function A1: Route decision to start, update, or skip (D1 — finish/cancel in D2)
async function applyDecision(decision, context) {
    const requestState = context.requestState || ActionStateFunctions.emptyActionState();
    const conversationID = context.conversationID;
    const targetRequest = decision.request || null;

    // D2: finishRequest / cancelRequest — not wired yet
    if (decision.closeRequest === true) {
        return buildSkipOutcome(requestState, 'finish_cancel_deferred_d2');
    }

    if (decision.response && decision.response.type === RESPONSE_TYPE.REQUEST_CANCELLED) {
        return buildSkipOutcome(requestState, 'finish_cancel_deferred_d2');
    }

    if (decision.response && decision.response.type === RESPONSE_TYPE.IMMEDIATE_EXECUTION) {
        return buildSkipOutcome(requestState, 'immediate_execution_no_row');
    }

    if (!targetRequest || !targetRequest.action) {
        const reason = resolveSkipReasonForNoRequest(decision);
        return buildSkipOutcome(requestState, reason);
    }

    const hasOpenRequest = !ActionStateFunctions.actionStateIsEmpty(requestState);

    if (!hasOpenRequest) {
        return StartRequestFunctions.startRequest(decision, context);
    }

    if (targetRequest.action !== requestState.pendingAction) {
        await ActionStateFunctions.closeOpenActionBeforeStartingNew(conversationID);
        return StartRequestFunctions.startRequest(decision, context);
    }

    if (requestTargetMatchesState(targetRequest, requestState)) {
        return buildSkipOutcome(requestState, 'no_request_change');
    }

    return UpdateRequestFunctions.updateRequest(decision, context);
}

//Function B1: No DB write — return standard outcome with reason
function buildSkipOutcome(requestState, reason) {
    return {
        success: true,
        action: 'skipped',
        reason: reason,
        requestID: null,
        request: requestState,
        error: null
    };
}

//Function B2: Pick a skip reason when decision.request is empty
function resolveSkipReasonForNoRequest(decision) {
    if (!decision.response || !decision.response.type) {
        return 'general_chat_no_request';
    }

    const responseType = decision.response.type;

    if (responseType === RESPONSE_TYPE.GENERAL_CHAT) {
        return 'general_chat_no_request';
    }

    if (responseType === RESPONSE_TYPE.LIST_OPEN_REQUESTS) {
        return 'conversation_intent_only';
    }

    if (responseType === RESPONSE_TYPE.FOCUS_REQUEST) {
        return 'conversation_intent_only';
    }

    if (responseType === RESPONSE_TYPE.REQUEST_STATUS) {
        return 'conversation_intent_only';
    }

    if (responseType === RESPONSE_TYPE.AMBIGUOUS_ACTION) {
        return 'ambiguous_no_write';
    }

    return 'no_request_change';
}

//Function B3: Does decision.request match what is already loaded?
function requestTargetMatchesState(targetRequest, requestState) {
    if (targetRequest.action !== requestState.pendingAction) {
        return false;
    }

    if (targetRequest.status !== requestState.status) {
        return false;
    }

    const targetMode = targetRequest.executionMode || null;
    const stateMode = requestState.executionMode || null;

    if (targetMode !== stateMode) {
        return false;
    }

    const targetMissing = targetRequest.missing || [];
    const stateMissing = requestState.missing || [];

    if (!arraysMatchInOrder(targetMissing, stateMissing)) {
        return false;
    }

    const targetCollected = targetRequest.collected || {};
    const stateCollected = requestState.collected || {};
    const targetKeys = Object.keys(targetCollected);
    const stateKeys = Object.keys(stateCollected);

    if (targetKeys.length !== stateKeys.length) {
        return false;
    }

    for (let i = 0; i < targetKeys.length; i++) {
        const fieldName = targetKeys[i];

        if (targetCollected[fieldName] !== stateCollected[fieldName]) {
            return false;
        }
    }

    return true;
}

//Function B4: Same strings in the same order
function arraysMatchInOrder(left, right) {
    if (left.length !== right.length) {
        return false;
    }

    for (let i = 0; i < left.length; i++) {
        if (left[i] !== right[i]) {
            return false;
        }
    }

    return true;
}

module.exports = {
    applyDecision
};

// ================================================================================
// FILE: application/atlas/functions/responses/buildCloudPilotResponse.js
// ================================================================================

const actionRegistry = require('../actions/actionRegistry');
const CloudPilotChat = require('../chat/CloudPilotChat');
const { RESPONSE_TYPE } = require('../decision/decisionTypes');

/*
FUNCTIONS A: STEP 7 — CloudPilot chat text (assembly only)
    1) Function A1: buildCloudPilotResponse

FUNCTIONS B: Helpers
    1) Function B1: mapResponseTypeToActionEvent
    2) Function B2: buildChatHandlerPayload
    3) Function B3: copyObject
    4) Function B4: copyStringArray
    5) Function B5: isRequestReady
*/

//Function A1: Assemble CloudPilotChat input and return chat text
async function buildCloudPilotResponse(decision, context) {
    const requestState = getRequestStateFromContext(context);
    const requestOutcome = context.requestOutcome || {};
    const responseType = decision.response && decision.response.type ? decision.response.type : '';
    const actionEvent = mapResponseTypeToActionEvent(responseType, requestOutcome);
    const activeAction = requestState.pendingAction;
    const actionDefinition = actionRegistry[activeAction] || null;

    if (!actionDefinition) {
        return {
            success: false,
            cloudPilotMessage: '',
            chatType: decision.chatType,
            atlasResponse: null,
            error: 'no_action_definition_for_response'
        };
    }

    const chatPayload = buildChatHandlerPayload({
        conversationID: context.conversationID,
        currentUserMessage: context.currentUserMessage,
        actionEvent: actionEvent,
        actionDefinition: actionDefinition,
        requestState: requestState
    });

    const chatResult = await CloudPilotChat.handleCloudPilotChat(chatPayload);
    const cloudPilotMessage = chatResult.cloudPilotMessage || chatResult.message || '';

    return {
        success: Boolean(chatResult.success && cloudPilotMessage),
        cloudPilotMessage: cloudPilotMessage,
        chatType: decision.chatType,
        atlasResponse: chatResult.atlasResponse || null,
        error: chatResult.error || null
    };
}

//Function B1: TEMPORARY — map decision.response.type to CloudPilotChat actionEvent
function mapResponseTypeToActionEvent(responseType, requestOutcome) {
    /*
    TEMPORARY COMPATIBILITY LAYER
    DELETE AFTER CloudPilotChat USES decision.response.type DIRECTLY
    */
    const requestAction = requestOutcome && requestOutcome.action ? requestOutcome.action : '';

    if (responseType === RESPONSE_TYPE.ASK_FOR_MISSING_FIELDS) {
        if (requestAction === 'created') {
            return 'new_action';
        }

        if (requestAction === 'updated') {
            return 'missing_fields_given';
        }

        return 'workflow_in_progress';
    }

    if (responseType === RESPONSE_TYPE.AWAITING_CONFIRMATION) {
        return 'awaiting_confirmation';
    }

    if (responseType === RESPONSE_TYPE.AWAITING_EXECUTION_MODE) {
        return 'awaiting_execution_mode';
    }

    if (responseType === RESPONSE_TYPE.EXECUTION_STARTED) {
        return 'execution_started';
    }

    if (responseType === RESPONSE_TYPE.WORKFLOW_RUNNING) {
        return 'workflow_running';
    }

    if (responseType === RESPONSE_TYPE.REQUEST_FAILED) {
        return 'workflow_failed';
    }

    if (responseType === RESPONSE_TYPE.EXECUTION_INSTRUCTIONS) {
        return 'execution_instructions';
    }

    if (responseType === RESPONSE_TYPE.EXECUTION_CLI) {
        return 'execution_cli';
    }

    if (responseType === RESPONSE_TYPE.EXECUTION_PR) {
        return 'execution_pr';
    }

    return 'workflow_in_progress';
}

//Function B2: Shape passed into CloudPilotChat (presentation only)
function buildChatHandlerPayload(options) {
    const requestState = options.requestState || {};
    const missingFields = copyStringArray(requestState.missing || []);
    const collectedFields = copyObject(requestState.collected || {});
    const askedForFields = copyObject(requestState.asked || {});

    return {
        conversationID: options.conversationID,
        currentUserMessage: options.currentUserMessage,
        actionEvent: options.actionEvent,
        actionDefinition: options.actionDefinition,
        actionReady: isRequestReady(missingFields),
        actionState: {
            pendingAction: requestState.pendingAction,
            status: requestState.status,
            executionMode: requestState.executionMode || null,
            missingFields: missingFields,
            collectedFields: collectedFields,
            askedForFields: askedForFields
        }
    };
}

//Function B3: Shallow copy of a plain object
function copyObject(source) {
    const copy = {};
    const keys = Object.keys(source || {});

    for (let i = 0; i < keys.length; i++) {
        const fieldName = keys[i];
        copy[fieldName] = source[fieldName];
    }

    return copy;
}

//Function B4: Copy an array of strings
function copyStringArray(source) {
    const copy = [];

    if (!Array.isArray(source)) {
        return copy;
    }

    for (let i = 0; i < source.length; i++) {
        copy.push(source[i]);
    }

    return copy;
}

//Function B5: Are all required fields collected?
function isRequestReady(missingFields) {
    if (!Array.isArray(missingFields)) {
        return true;
    }

    return missingFields.length === 0;
}

function getRequestStateFromContext(context) {
    if (context.requestOutcome && context.requestOutcome.request) {
        return context.requestOutcome.request;
    }

    if (context.requestState) {
        return context.requestState;
    }

    return {};
}

module.exports = {
    buildCloudPilotResponse
};

// ================================================================================
// FILE: application/atlas/functions/responses/buildGeneralChatResponse.js
// ================================================================================

const openAIFunctions = require('../chat/openAI/openAIFunctions');
const { CHAT_TYPE } = require('../decision/decisionTypes');

/*
FUNCTIONS A: STEP 7 — general chat response (OpenAI)
    1) Function A1: buildGeneralChatResponse
*/

//Function A1: Return general chat text when decision routes to OpenAI
async function buildGeneralChatResponse(context) {
    const currentUserMessage = context.currentUserMessage || '';
    const openAIResult = await openAIFunctions.sendGeneralChat(currentUserMessage);

    if (!openAIResult.success) {
        return {
            success: false,
            cloudPilotMessage: '',
            chatType: CHAT_TYPE.GENERAL_CHAT_RESPONDING,
            atlasResponse: null,
            error: openAIResult.message || 'general_chat_failed'
        };
    }

    const cloudPilotMessage = openAIResult.data ? String(openAIResult.data).trim() : '';

    return {
        success: Boolean(cloudPilotMessage),
        cloudPilotMessage: cloudPilotMessage,
        chatType: CHAT_TYPE.GENERAL_CHAT_RESPONDING,
        atlasResponse: null,
        error: null
    };
}

module.exports = {
    buildGeneralChatResponse
};

// ================================================================================
// FILE: application/atlas/functions/responses/buildResponse.js
// ================================================================================

const { CHAT_TYPE } = require('../decision/decisionTypes');
const BuildCloudPilotResponseFunctions = require('./buildCloudPilotResponse');
const BuildGeneralChatResponseFunctions = require('./buildGeneralChatResponse');

/*
FUNCTIONS A: STEP 7 — build one chat response (words only; no DB, no Atlas)
    1) Function A1: buildResponse

STEP 7 words only. Do not decide or mutate request state here — STEP 4 and STEP 5 already did.
*/

//Function A1: Route decision to CloudPilot or general chat response
async function buildResponse(decision, context) {
    const emptyOutcome = {
        success: false,
        cloudPilotMessage: '',
        chatType: null,
        atlasResponse: null,
        error: null
    };

    if (!decision) {
        return emptyOutcome;
    }

    if (decision.chatType === CHAT_TYPE.GENERAL_CHAT_RESPONDING) {
        return BuildGeneralChatResponseFunctions.buildGeneralChatResponse(context);
    }

    if (decision.chatType === CHAT_TYPE.CLOUD_PILOT_RESPONDING) {
        return BuildCloudPilotResponseFunctions.buildCloudPilotResponse(decision, context);
    }

    return emptyOutcome;
}

module.exports = {
    buildResponse
};

// ================================================================================
// FILE: application/atlas/functions/chat/CloudPilotChat.js
// ================================================================================

const AtlasExecution = require('../classes/AtlasExecution');

//Function B3: Handle Cloud Pilot Chat
async function handleCloudPilotChat(payload) {

    console.log(" ");
    console.log("CLOUD_PILOT FUNCTION CALLED");
    console.log(JSON.stringify(payload, null, 2));
    console.log(" ");

    // STEP 1: New workflow started
    if (payload.actionEvent === "new_action") {

        return await cloudPilotRespondNewRequest(payload);
    }

    // STEP 2: User supplied new workflow fields
    if (payload.actionEvent === "missing_fields_given") {

        return await cloudPilotRespondMissingFieldsGiven(payload);
    }

    // STEP 3: Workflow is ready — ask how to perform the action (destructive tier)
    if (payload.actionEvent === "awaiting_execution_mode") {

        return await cloudPilotRespondAwaitingExecutionMode(payload);
    }

    // STEP 4: Workflow is now ready and waiting for confirmation
    if (payload.actionEvent === "awaiting_confirmation") {

        return await cloudPilotRespondAwaitingConfirmation(payload);
    }

    // STEP 5: User confirmed execution — Atlas runs in STEP 6 (executeRequest), not here
    if (payload.actionEvent === "execution_requested") {

        return await AtlasExecution.startNewAtlasExecution(payload);
    }

    // STEP 5D: Execution started — words only until STEP 6 is wired
    if (payload.actionEvent === "execution_started") {

        return cloudPilotRespondExecutionStarted(payload);
    }

    // STEP 5A: Workflow still collecting fields (repeat intent)
    if (payload.actionEvent === "workflow_in_progress") {

        return cloudPilotRespondWorkflowInProgress(payload);
    }

    // STEP 5B: Execution already running
    if (payload.actionEvent === "workflow_running") {

        return cloudPilotRespondWorkflowRunning(payload);
    }

    // STEP 5C: Previous execution failed
    if (payload.actionEvent === "workflow_failed") {

        return cloudPilotRespondWorkflowFailed(payload);
    }

    // STEP 6: Fallback
    if (payload.actionState && payload.actionState.pendingAction) {

        return cloudPilotRespondWorkflowInProgress(payload);
    }

    return {
        success: true,
        message:
            "I couldn't match that to the current workflow step. " +
            "Please continue with the open action or start a new one.",
        atlasResponse: null,
        error: "unknown_workflow_event"
    };
}

async function cloudPilotRespondNewRequest(payload) {
    const actionDefinition = payload.actionDefinition;

    const missingFields = payload.actionState.missingFields || [];

    const missingFieldsMessage = buildMissingFieldsMessage(actionDefinition, missingFields );

    return {
        success: true,
        message: actionDefinition.messages.started + " " + missingFieldsMessage,
        atlasResponse: null,
        error: null
    };
}

async function cloudPilotRespondMissingFieldsGiven(payload) {
    const actionDefinition = payload.actionDefinition;
    const missingFields = payload.actionState.missingFields || [];
    const collectedFields = payload.actionState.collectedFields || {};
    const collectedFieldNames = Object.keys(collectedFields);
    const latestField = collectedFieldNames[collectedFieldNames.length - 1];

    let acknowledgement = "Great, I updated the workflow.";

    if (latestField) {
        acknowledgement = "Great, I now have the " + latestField.replaceAll("_", " ") + ".";
    }

    // Still missing fields
    if (missingFields.length > 0) {
        const missingFieldsMessage = buildMissingFieldsMessage(actionDefinition, missingFields);

        acknowledgement += " " + missingFieldsMessage;
    }

    return {
        success: true,
        message: acknowledgement,
        atlasResponse: null,
        error: null
    };
}

async function cloudPilotRespondAwaitingExecutionMode(payload) {

    return {
        success: true,
        message:
            "Everything is ready.\n\n" +
            "How would you like me to perform this action?\n\n" +
            "1. Instructions\n" +
            "2. CLI Commands\n" +
            "3. Pull Request\n" +
            "4. Automatic",
        atlasResponse: null,
        error: null
    };
}

async function cloudPilotRespondAwaitingConfirmation(payload) {
    const actionDefinition = payload.actionDefinition;
    const readyMessage =
        actionDefinition.messages.ready ||
        "Everything is ready.";

    const executionMode = payload.actionState && payload.actionState.executionMode;

    let message = readyMessage + "\n\nWould you like me to execute this action?";

    if (executionMode) {
        message =
            readyMessage +
            "\n\nExecution mode: " +
            executionMode +
            "\n\nWould you like me to execute this action?";
    }

    return {
        success: true,
        message: message,
        atlasResponse: null,
        error: null
    };
}

async function cloudPilotRespondWorkflowInProgress(payload) {
    const actionDefinition = payload.actionDefinition;
    const actionLabel = actionDefinition.actionLabel || actionDefinition.type || "workflow";
    const missingFields = payload.actionState.missingFields || [];
    const missingFieldsMessage = buildMissingFieldsMessage(actionDefinition, missingFields);

    let message = "You already have a " + actionLabel + " workflow in progress.";

    if (missingFieldsMessage) {
        message += " " + missingFieldsMessage;
    } else {
        message += " Please continue where we left off.";
    }

    return {
        success: true,
        message: message,
        atlasResponse: null,
        error: null
    };
}

async function cloudPilotRespondWorkflowRunning(payload) {
    const actionDefinition = payload.actionDefinition;
    const actionLabel = actionDefinition.actionLabel || actionDefinition.type || "action";

    return {
        success: true,
        message:
            "Your " +
            actionLabel +
            " action is already running. I will let you know when it finishes.",
        atlasResponse: null,
        error: null
    };
}

async function cloudPilotRespondWorkflowFailed(payload) {
    const actionDefinition = payload.actionDefinition;
    const actionLabel = actionDefinition.actionLabel || actionDefinition.type || "action";
    const failedMessage =
        actionDefinition.messages && actionDefinition.messages.failed
            ? actionDefinition.messages.failed
            : "That action did not complete.";

    return {
        success: true,
        message:
            failedMessage +
            " Your " +
            actionLabel +
            " workflow did not finish. Say the action again if you want to start over.",
        atlasResponse: null,
        error: "workflow_failed"
    };
}

async function cloudPilotRespondExecutionStarted(payload) {
    const actionDefinition = payload.actionDefinition;
    const actionLabel = actionDefinition.actionLabel || actionDefinition.type || 'action';
    const collectedFields = payload.actionState && payload.actionState.collectedFields
        ? payload.actionState.collectedFields
        : {};
    let regionText = '';

    if (collectedFields.region) {
        regionText = ' in ' + String(collectedFields.region);
    }

    return {
        success: true,
        message:
            'Starting your ' +
            actionLabel +
            regionText +
            '. I will update you when it finishes.',
        atlasResponse: null,
        error: null
    };
}

function buildMissingFieldsMessage(actionDefinition, missingFields) {
    const questions = [];

    const registryMessages = actionDefinition.messages && actionDefinition.messages.missingFields ? actionDefinition.messages.missingFields : {};

    for (const fieldName of missingFields) {
        const question = registryMessages[fieldName];

        if (question) {
            questions.push(question);
        }
    }

    if (questions.length === 0) {
        return "";
    }

    return (
        questions.join(" ") +
        '\n\nPlease use this format:\nfield: "value"'
    );
}

module.exports = {
    handleCloudPilotChat
};

// ================================================================================
// FILE: application/atlas/functions/classes/AtlasExecution.js
// ================================================================================

const actionRegistry = require('../actions/actionRegistry');
const Actions = require('./Actions');

class AtlasExecution {
    static async startNewAtlasExecution(payload) {
        console.log("ATLAS EXECUTION STARTED");

        await syncOpenActionStatus(payload.conversationID, "running");

        const activeAction =
            payload.actionState.pendingAction ||
            payload.userRequest;

        const actionDefinition = actionRegistry[activeAction];

        if (!actionDefinition) {
            await finishOpenActionInDatabase(payload.conversationID, "failed", "action_not_found");

            return {
                success: false,
                cloudPilotMessage: "I could not find the requested Atlas action.",
                atlasResponse: null,
                error: "action_not_found"
            };
        }

        if (typeof actionDefinition.executionFunction !== "function") {
            await finishOpenActionInDatabase(payload.conversationID, "failed", "execution_function_missing");

            return {
                success: false,
                cloudPilotMessage: "This Atlas action is not executable yet.",
                atlasResponse: null,
                error: "execution_function_missing"
            };
        }

        const executionContext = {
            userMessage: payload.currentUserMessage,
            action: actionDefinition,
            state: {
                pendingAction: activeAction,
                status: "running",
                executionMode: payload.actionState.executionMode || null,
                missing: payload.actionState.missingFields || [],
                collected: payload.actionState.collectedFields || {}
            },
            conversationID: payload.conversationID
        };

        try {
            const executionResult =
                await actionDefinition.executionFunction(executionContext);

            if (executionResult.success) {
                await finishOpenActionInDatabase(payload.conversationID, "completed", "success");
            } else {
                const failOutcomeCode =
                    executionResult.error != null && String(executionResult.error).trim() !== ""
                        ? String(executionResult.error)
                        : "execution_failed";

                await finishOpenActionInDatabase(payload.conversationID, "failed", failOutcomeCode);
            }

            return executionResult;

        } catch (error) {
            await finishOpenActionInDatabase(payload.conversationID, "failed", "execution_exception");

            return {
                success: false,
                cloudPilotMessage:
                    "Something unexpected went wrong while running that action. Please try again in a moment.",
                atlasResponse: null,
                error: "execution_exception"
            };
        }
    }

    static async checkAtlasExecutionStatus(executionID) {
        console.log("COMING SOON: checkAtlasExecutionStatus");

        return {
            success: true,
            status: "coming_soon",
            executionID: executionID
        };
    }

    static async closeAtlasExecution(payload) {
        console.log("ATLAS EXECUTION COMPLETED");

        await finishOpenActionInDatabase(payload.conversationID, "completed", "success");

        return {
            success: true,
            message: "Execution completed successfully.",
            atlasResponse: {
                status: "completed"
            },
            error: null
        };
    }
}

//FUNCTIONS B: Open action row in database
//Function B1: Update open row status while run is in progress
async function syncOpenActionStatus(conversationID, status) {
    const openResult = await Actions.getOpenActionForConversation(conversationID);

    if (!openResult.success || !openResult.action) {
        return;
    }

    await Actions.updateAction(openResult.action.workflowId, {
        status: status
    });
}

//Function B2: Close open row and log final database state
async function finishOpenActionInDatabase(conversationID, status, outcomeCode) {
    const openResult = await Actions.getOpenActionForConversation(conversationID);

    if (!openResult.success || !openResult.action) {
        console.log("DATABASE ACTION: No open row to finish for conversation", conversationID);
        return;
    }

    const finishResult = await Actions.finishAction(
        openResult.action.workflowId,
        status,
        outcomeCode
    );

    console.log(" ");
    console.log("DATABASE ACTION ROW (after user confirmed / run finished):");
    console.log(JSON.stringify(finishResult.action, null, 2));
    console.log(" ");
}

module.exports = AtlasExecution;

// ================================================================================
// FILE: application/atlas/functions/actions/actionRegistry.js
// ================================================================================

/*
===============================================================================
CANONICAL STATIC ACTION DEFINITIONS
===============================================================================

This file is the central registry for CloudPilot action definitions.

Each action definition describes static orchestration metadata:
- identity
- policy
- actionTier (general_chat | informational | destructive)
- intent detection
- workflow requirements
- executionModes (destructive actions only)
- execution handler
- defaults
- user-facing system messages

This is NOT runtime workflow state.
This is NOT Atlas execution output.

All actions should follow the same stable structure so orchestration, prompts,
and frontend-safe action payloads can rely on consistent naming.
*/

const actionRegistry = {

    //SERVICE: General Chat
    general_chat: {
        //Identity
        type: 'general_chat',
        actionLabel: 'General Chat',

        //Policy
        allowed: true,

        //Orchestration
        actionTier: 'general_chat',
        requiresWorkflow: false,
        requiresExecution: false,

        //Intent Detection
        match: () => false,

        //Fields Required Before Ready
        requiredFields: [],

        //Optional Defaults
        defaults: {},

        //Execution
        executionFunction: null,

        //User-Facing System Messages
        messages: {
            started: '',
            missingFields: {},
            ready: '',
            executing: '',
            success: '',
            failed: ''
        }
    },

    //SERVICE: AWS
    //Action: Inventory AWS Resources
    //TO DO: Maybe later add regions, resource types
    inventory_aws: {
        //Identity
        type: 'inventory_aws',
        actionLabel: 'Inventory AWS Resources',

        //Policy
        allowed: true,

        //Orchestration
        actionTier: 'informational',
        requiresWorkflow: false,
        requiresExecution: true,

        //Intent Detection
        match: (text) =>
            text.includes('show me all my aws resources') ||
            text.includes('show my aws resources'),

        //Fields Required Before Ready
        requiredFields: [],

        //Optional Defaults
        defaults: {},

        //Execution
        executionFunction: null /* handler excluded — STEP 6 not wired */,

        //User-Facing System Messages
        messages: {
            started: 'Preparing AWS inventory.',
            missingFields: {},
            ready: 'Everything is ready for AWS inventory.',
            executing: 'Gathering AWS resources.',
            success: 'Great, I found your AWS resources and added them to your dashboard.',
            failed: 'AWS inventory failed.'
        }
    },

    //SERVICE: EC2
    //Action: Scan EC2
    scan_ec2: {
        //Identity
        type: 'scan_ec2',
        actionLabel: 'Scan EC2',

        //Policy
        allowed: true,

        //Orchestration
        actionTier: 'informational',
        requiresWorkflow: true,
        requiresExecution: false,

        //Intent Detection
        match: (text) =>
            text.includes('scan') &&
            text.includes('ec2'),

        //Fields Required Before Ready
        requiredFields: [
            'region'
        ],

        //Optional Defaults
        defaults: {},

        //Execution
        executionFunction: null /* handler excluded — STEP 6 not wired */,

        //User-Facing System Messages
        messages: {
            started: 'Preparing EC2 scan.',
            missingFields: {
                region: 'Which AWS region should I use?'
            },
            ready: 'Everything is ready for the EC2 scan.',
            executing: 'Running EC2 scan.',
            success: 'EC2 scan completed.',
            failed: 'EC2 scan failed.'
        }
    },

    //SERVICE: EC2
    //Action: Toggle EC2
    toggle_ec2: {
        //Identity
        type: 'toggle_ec2',
        actionLabel: 'Toggle EC2',

        //Policy
        allowed: true,

        //Orchestration
        actionTier: 'destructive',
        requiresWorkflow: true,
        requiresExecution: false,

        //Execution mode selection (destructive tier only)
        executionModes: [
            'instructions',
            'cli',
            'pr',
            'automatic'
        ],

        //Intent Detection
        match: (text) =>
            text.includes('toggle') ||
            text.includes('switch'),

        //Fields Required Before Ready
        requiredFields: [
            'region',
            'primary_instance_id',
            'secondary_instance_id'
        ],

        //Optional Defaults
        defaults: {},

        //Execution
        executionFunction: null /* handler excluded — STEP 6 not wired */,

        //User-Facing System Messages
        messages: {
            started: 'Confirm before changing EC2 instances.',
            missingFields: {
                region: 'Which AWS region should I use?',
                primary_instance_id: 'What is the primary EC2 instance ID to stop (e.g. i-0abc123)?',
                secondary_instance_id: 'What is the secondary EC2 instance ID to start (e.g. i-0xyz987)?'
            },
            ready: 'Everything is ready for the EC2 toggle.',
            executing: 'Toggling EC2 instances. This may take a few minutes.',
            success: 'EC2 toggle completed.',
            failed: 'EC2 toggle failed.'
        }
    },

    //SERVICE: EC2
    //Action: Create EC2
    create_ec2: {
        //Identity
        type: 'create_ec2',
        actionLabel: 'Create EC2',

        //Policy
        allowed: true,

        //Orchestration
        actionTier: 'destructive',
        requiresWorkflow: true,
        requiresExecution: false,

        //Execution mode selection (destructive tier only)
        executionModes: [
            'instructions',
            'cli',
            'pr',
            'automatic'
        ],

        //Intent Detection
        match: (text) =>
            text.includes('create') &&
            (text.includes('ec2') || text.includes('instance')),

        //Fields Required Before Ready
        requiredFields: [
            'name',
            'region',
            'instance_type'
        ],

        //Optional Defaults
        defaults: {
            tags: {
                'managed-by': 'cloudpilot',
                'cloudpilot-managed': 'true',
                'environment': 'demo',
                'cloudpilot-role': 'secondary'
            }
        },

        //Execution
        executionFunction: null /* handler excluded — STEP 6 not wired */,

        //User-Facing System Messages
        messages: {
            started: 'Preparing EC2 create.',
            missingFields: {
                name: 'What should I name this EC2 instance?',
                region: 'Which AWS region should I use?',
                instance_type: 'What EC2 instance type would you like?'
            },
            ready: 'Everything is ready for the EC2 create.',
            executing: 'Creating EC2 instance.',
            success: 'EC2 instance created.',
            failed: 'EC2 create failed.'
        }
    },

    //SERVICE: EC2
    //Action: Delete EC2
    delete_ec2: {
        //Identity
        type: 'delete_ec2',
        actionLabel: 'Delete EC2',

        //Policy
        allowed: true,

        //Orchestration
        actionTier: 'destructive',
        requiresWorkflow: true,
        requiresExecution: false,

        //Execution mode selection (destructive tier only)
        executionModes: [
            'instructions',
            'cli',
            'pr',
            'automatic'
        ],

        //Intent Detection
        match: (text) =>
            text.includes('delete') &&
            (text.includes('ec2') || text.includes('instance')),

        //Fields Required Before Ready
        requiredFields: [
            'region',
            'instance_id'
        ],

        //Optional Defaults
        defaults: {},

        //Execution
        executionFunction: null /* handler excluded — STEP 6 not wired */,

        //User-Facing System Messages
        messages: {
            started: 'Preparing EC2 delete.',
            missingFields: {
                region: 'Which AWS region is the instance in?',
                instance_id: 'What is the EC2 instance ID to delete (e.g. i-0abc123)?'
            },
            ready: 'Everything is ready for the EC2 delete.',
            executing: 'Terminating EC2 instance.',
            success: 'EC2 instance termination requested.',
            failed: 'EC2 delete failed.'
        }
    }
};

function actionRequiresExecutionModeSelection(actionDefinition) {
    return Boolean(
        actionDefinition &&
        Array.isArray(actionDefinition.executionModes) &&
        actionDefinition.executionModes.length > 0
    );
}

module.exports = actionRegistry;

Object.defineProperty(module.exports, 'actionRequiresExecutionModeSelection', {
    value: actionRequiresExecutionModeSelection,
    enumerable: false
});

// ================================================================================
// FILE: application/atlas/functions/chat/openAI/openAIFunctions.js
// ================================================================================

const OpenAI = require('openai');
const { CHAT_CONFIG, OPENAI_SAFE_DEFAULTS } = require('../../config/chatGPTconfig');

/*
FUNCTIONS A: ChatGPT / OpenAI only (no intent logic — use ../logic + ./cloudPilotMessageFunctions for that)

    1) Function A1: Get OpenAI Client
    2) Function A2: Normalize User Message For Model
    3) Function A3: Create OpenAI Chat Completion
    4) Function A4: Send Chat With Action
    5) Function A5: Send General Chat
    6) Function A6: Send general chat during active workflow
*/

let openaiClient = null;

const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS) || 10000;

//FUNCTIONS A: ChatGPT / OpenAI
//Function A1: Get OpenAI Client
/** Lazy singleton OpenAI client; returns null if OPENAI_API_KEY is unset. */
function getOpenAIClient() {
    if (!process.env.OPENAI_API_KEY) {
        return null;
    }
    if (!openaiClient) {
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            timeout: OPENAI_TIMEOUT_MS
        });
    }
    return openaiClient;
}

//Function A2: Normalize User Message For Model
/** @returns {{ ok: true, text: string, message: '' } | { ok: false, text: '', message: string }}} */
function normalizeUserMessageForModel(raw) {
    const text = typeof raw === 'string' ? raw.trim() : '';
    if (!text) {
        return { ok: false, text: '', message: 'message is required' };
    }
    return { ok: true, text, message: '' };
}

/**
 * @param {import('openai').OpenAI} client
 * @param {{ model: string, messages: Array<{ role: string, content: string }>, max_tokens: number, temperature: number }} params
 * @returns {Promise<{ success: true, data: string|null, usage: object|null } | { success: false, message: string, data: null, error?: string }>}
 */
//Function A3: Create OpenAI Chat Completion
async function createOpenAiChatCompletion(client, params) {
    if (!client) {
        return { success: false, message: 'OpenAI client is missing', data: null };
    }

    const { model, messages, temperature } = params;
    const ceiling = OPENAI_SAFE_DEFAULTS.MAX_COMPLETION_TOKENS_CEILING;
    const requested = Number(params.max_tokens);
    const max_tokens = Number.isFinite(requested) && requested > 0
        ? Math.min(requested, ceiling)
        : Math.min(64, ceiling);

    try {
        const response = await client.chat.completions.create({
            model,
            messages,
            max_tokens,
            temperature
        });

        const choice = response.choices && response.choices[0] && response.choices[0].message;
        const data = choice && choice.content != null ? choice.content : null;

        return {
            success: true,
            data,
            usage: response.usage || null
        };
    } catch (error) {
        console.error('[createOpenAiChatCompletion] ChatGPT error:', error.message || error);
        return {
            success: false,
            message: 'ChatGPT request failed',
            data: null,
            error: error.message || String(error)
        };
    }
}

/**
 * One completion: system rules + serialized action + user text.
 * @returns {Promise<{ success: boolean, data?: string|null, message?: string, error?: string, usage?: object|null }>}
 */
//Function A4: Send Chat With Action
async function sendChatWithAction(userMessage, action) {
    const norm = normalizeUserMessageForModel(userMessage);
    if (!norm.ok) {
        return { success: false, message: norm.message, data: null };
    }

    const text = norm.text;
    const maxIn = OPENAI_SAFE_DEFAULTS.MAX_USER_INPUT_CHARS;
    if (text.length > maxIn) {
        return {
            success: false,
            message: 'message too long (max ' + maxIn + ' characters)',
            data: null
        };
    }

    const client = getOpenAIClient();
    if (!client) {
        console.warn('[sendChatWithAction] OPENAI_API_KEY is not set');
        return { success: false, message: 'OPENAI_API_KEY is not configured', data: null };
    }

    const config = CHAT_CONFIG.LOW;
    const systemPrompt =
        'You are CloudPilot.\n\n' +
        'RULES:\n' +
        '- Help with AWS EC2 when the user is asking about it; otherwise reply briefly and naturally.\n' +
        '- Keep responses under 10 words unless you need one short question (e.g. region or confirmation).\n' +
        '- Do not say you executed anything; nothing runs on AWS yet.\n' +
        '- If action.type is scan_ec2, ask which region if missing.\n' +
        '- If action.type is toggle_ec2, ask for confirmation before acting.\n\n' +
        'ACTION:\n' +
        JSON.stringify(action);

    console.log('[sendChatWithAction] model=%s max_tokens=20 temperature=%s', config.model, config.temperature);

    const result = await createOpenAiChatCompletion(client, {
        model: config.model,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text }
        ],
        max_tokens: 20,
        temperature: config.temperature
    });

    if (result.success && result.usage) {
        console.log(
            '[sendChatWithAction] usage prompt=%s completion=%s total=%s',
            result.usage.prompt_tokens,
            result.usage.completion_tokens,
            result.usage.total_tokens
        );
    }

    return result;
}

/**
 * General conversation (unknown intent / type none). Same outcome shape as sendChatWithAction.
 * @returns {Promise<{ success: boolean, data?: string|null, message?: string, error?: string, usage?: object|null }>}
 */
//Function A5: Send General Chat
async function sendGeneralChat(userMessage) {
    const norm = normalizeUserMessageForModel(userMessage);
    if (!norm.ok) {
        return { success: false, message: norm.message, data: null };
    }

    const text = norm.text;
    const maxIn = OPENAI_SAFE_DEFAULTS.MAX_USER_INPUT_CHARS;
    if (text.length > maxIn) {
        return {
            success: false,
            message: 'message too long (max ' + maxIn + ' characters)',
            data: null
        };
    }

    const client = getOpenAIClient();
    if (!client) {
        console.warn('[sendGeneralChat] OPENAI_API_KEY is not set');
        return { success: false, message: 'OPENAI_API_KEY is not configured', data: null };
    }

    const config = CHAT_CONFIG.LOW;
    console.log('[sendGeneralChat] model=%s max_tokens=%s temperature=%s', config.model, config.max_tokens, config.temperature);

    const result = await createOpenAiChatCompletion(client, {
        model: config.model,
            messages: [
                {
                    role: 'system',
                    content:
                        'You are CloudPilot, an AWS infrastructure assistant.\n\n' +
                        'Prioritize:\n' +
                        '- AWS terminology\n' +
                        '- operationally useful answers\n' +
                        '- exact AWS resource names\n' +
                        '- exact AWS region identifiers when relevant\n\n' +
                        'Keep responses brief, practical, and natural.\n' +
                        'Keep responses under 15 words unless a short follow-up question is needed.\n' +
                        'Do not claim AWS actions were executed.'
                },
                { role: 'user', content: text }
            ],
        max_tokens: config.max_tokens,
        temperature: config.temperature
    });

    if (result.success && result.usage) {
        console.log(
            '[sendGeneralChat] usage prompt=%s completion=%s total=%s',
            result.usage.prompt_tokens,
            result.usage.completion_tokens,
            result.usage.total_tokens
        );
    }

    return result;
}

/**
 * General chat while a CloudPilot workflow is waiting on fields (same outcome shape as sendGeneralChat).
 * @param {string} userMessage
 * @param {{ pendingAction: string|null, missing: string[], collected: object }} workflowContext
 */
//Function A6: Send general chat during active workflow
async function sendGeneralChatDuringWorkflow(userMessage, workflowContext) {
    const norm = normalizeUserMessageForModel(userMessage);
    if (!norm.ok) {
        return { success: false, message: norm.message, data: null };
    }

    const text = norm.text;
    const maxIn = OPENAI_SAFE_DEFAULTS.MAX_USER_INPUT_CHARS;
    if (text.length > maxIn) {
        return {
            success: false,
            message: 'message too long (max ' + maxIn + ' characters)',
            data: null
        };
    }

    const client = getOpenAIClient();
    if (!client) {
        console.warn('[sendGeneralChatDuringWorkflow] OPENAI_API_KEY is not set');
        return { success: false, message: 'OPENAI_API_KEY is not configured', data: null };
    }

    const config = CHAT_CONFIG.LOW;
    const pending = String(workflowContext && workflowContext.pendingAction ? workflowContext.pendingAction : '');
    const missingList = workflowContext && Array.isArray(workflowContext.missing) ? workflowContext.missing : [];
    const missingStr = missingList.length ? missingList.join(', ') : 'none';
    const collectedStr = JSON.stringify((workflowContext && workflowContext.collected) ? workflowContext.collected : {});

    const systemPrompt =
        'You are CloudPilot.\n' +
        'The user has an active workflow.\n' +
        'pendingAction: ' + pending + '\n' +
        'Collected: ' + collectedStr + '\n' +
        'Still missing fields: ' + missingStr + '.\n\n' +
        'Answer the user message helpfully and briefly (AWS-aware when relevant).\n' +
        'If they greet you, greet back in one short phrase then continue.\n' +
        'Do not say the workflow was cancelled or that AWS changes were applied.\n' +
        'Do not repeat the same slot question the app already asked; missing fields are listed after your reply.\n' +
        'Do not contradict the checklist after your reply (field ids still listed are still missing).\n' +
        'Stay under about 60 words.';

    const maxTokens = Math.min(120, OPENAI_SAFE_DEFAULTS.MAX_COMPLETION_TOKENS_CEILING);

    const result = await createOpenAiChatCompletion(client, {
        model: config.model,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text }
        ],
        max_tokens: maxTokens,
        temperature: config.temperature
    });

    if (result.success && result.usage) {
        console.log(
            '[sendGeneralChatDuringWorkflow] usage prompt=%s completion=%s total=%s',
            result.usage.prompt_tokens,
            result.usage.completion_tokens,
            result.usage.total_tokens
        );
    }

    return result;
}

module.exports = {
    getOpenAIClient,
    normalizeUserMessageForModel,
    createOpenAiChatCompletion,
    sendChatWithAction,
    sendGeneralChat,
    sendGeneralChatDuringWorkflow
};

// ================================================================================
// FILE: application/atlas/functions/cloudPilotMessageFunctions.js
// ================================================================================

const openAIFunctions = require('./chat/openAI/openAIFunctions');
const actionRegistry = require('./actions/actionRegistry');
const ActionStateFunctions = require('./actions/actionStateFunctions');
const UnderstandingFunctions = require('./understanding/understandMessage');
const DecisionFunctions = require('./decision/decideNextStep');
const RequestFunctions = require('./requests/applyDecision');
const ResponseFunctions = require('./responses/buildResponse');

/*
FUNCTIONS A: CloudPilot (Atlas) — intent → decide → ChatGPT
    1) Function A1: Process Message (pipeline)

FUNCTIONS B: Request Detection / Action Lookup
    1) Function B1: Detect User Request
    2) Function B2: Get Action Definition

FUNCTIONS C: Chat Handlers
    1) Function C1: Handle General Chat
    2) Function C2: Handle CloudPilot Chat (imported from ./chat/CloudPilotChat)

FUNCTIONS D: Helpers
    1) Function D1: Clone Action Status
    2) Function D2: Should Start New Action
    3) Function D3: Get Current User Message
    4) Function D4: Print State
*/

/*
System Layer: activeAction
Registry Layer: actionDefinition
Execution Layer: execution (done by atlas)

//Sync Data (maybe old)
//processMessageOutcome.cloudPilot.actionStatus = cloneActionStatus(currentActionState, null, false);

*/

//FUNCTIONS A: CloudPilot (Atlas) — intent → decide → ChatGPT
//Function A1: Process Message (pipeline)
async function processMessage(rawUserMessage, conversationID, context) {
    const processMessageContext = normalizeProcessMessageContext(context);
    var currentUserMessage = null;
    var currentActionState = null;
    var activeAction = null;

    var processMessageOutcome = {
        success: false, 
        cloudPilotMessage: "",
        cloudPilot: { 
            userRequest: null, // e.g. "scan_ec2", "toggle_ec2", "general_chat"
            //Later Add Policy

            actionStatus: {
                type: null, // What action the user asked for ("scan_ec2", "toggle_ec2") null if it is just general_chat
                ready: false,

                missingFields: [],
                collectedFields: {},
                askedForFields: {},
                executionMode: null
            },
            atlasExecution: {
                status: "idle", // "idle" | "running" | "completed" | "failed"
                actionId: null, // Atlas execution ID
                startedAt: null,
                completedAt: null,
                error: null
            }
        },
        atlasResponse: null, //This is the response we get from Atlas after an AWS interaction
        error: null 
    };

    //STEP 1: Normalize user message
    const currentUserMessageOutcome = getCurrentUserMessage(rawUserMessage);

    if (!currentUserMessageOutcome.success) {
        processMessageOutcome.success = false;
        processMessageOutcome.error = currentUserMessageOutcome.error;

        return processMessageOutcome;         
    }

    currentUserMessage = currentUserMessageOutcome.currentUserMessage;

    console.log(currentUserMessage);

    //STEP 2: Load active requests
    currentActionState = await ActionStateFunctions.getUsersActionState(conversationID);
    activeAction = currentActionState.pendingAction;

    await ActionStateFunctions.printUsersActionState(conversationID, "INITIAL STATE:");


    //STEP 3: Understand the user message
    const messageUnderstanding = await UnderstandingFunctions.understandMessage(currentUserMessage);

    console.log("STEP 3: MESSAGE UNDERSTANDING:");
    console.log(JSON.stringify(messageUnderstanding, null, 2));
    console.log(" ");


    //STEP 4: Decision
    const decision = DecisionFunctions.decideNextStep({
        understanding: messageUnderstanding,
        requestState: currentActionState
    });

    console.log("STEP 4: DECISION:");
    console.log(JSON.stringify(decision, null, 2));
    console.log(" ");


    //STEP 5: Request update
    const requestOutcome = await RequestFunctions.applyDecision(decision, {
        conversationID: conversationID,
        context: processMessageContext,
        requestState: currentActionState
    });

    console.log("STEP 5: REQUEST UPDATE:");
    console.log(JSON.stringify(requestOutcome, null, 2));
    console.log(" ");

    if (requestOutcome.request) {
        currentActionState = requestOutcome.request;
        activeAction = currentActionState.pendingAction;
    }

    if (requestOutcome.success) {
        processMessageOutcome.success = true;
    }

    await ActionStateFunctions.printUsersActionState(conversationID, "FINAL STATE:");

    //STEP 7: Build response (words only — no DB, no Atlas)
    const responseOutcome = await ResponseFunctions.buildResponse(decision, {
        conversationID: conversationID,
        currentUserMessage: currentUserMessage,
        requestOutcome: requestOutcome,
        requestState: currentActionState,
        context: processMessageContext
    });

    console.log("STEP 7: RESPONSE:");
    console.log(JSON.stringify(responseOutcome, null, 2));
    console.log(" ");

    if (responseOutcome.cloudPilotMessage) {
        processMessageOutcome.cloudPilotMessage = responseOutcome.cloudPilotMessage;
        processMessageOutcome.success = true;
    }

    if (responseOutcome.atlasResponse) {
        processMessageOutcome.atlasResponse = responseOutcome.atlasResponse;
    }

    if (responseOutcome.error) {
        processMessageOutcome.error = responseOutcome.error;
    }

    if (activeAction) {
        processMessageOutcome.cloudPilot.userRequest = activeAction;
    }

    const actionReady = !currentActionState.missing || currentActionState.missing.length === 0;
    processMessageOutcome.cloudPilot.actionStatus = cloneActionStatus(
        currentActionState,
        activeAction,
        actionReady
    );


    return processMessageOutcome;

}


function getActionDefinition(intent) {
    const action = actionRegistry[intent];

    if (action) {
        const copy = { ...action };
        delete copy.match;
        delete copy.executionFunction;
        delete copy.defaults;
        return copy; 
    }

    return {
        type: 'none',
        allowed: false,
        requiresExecution: false,
        messages: {
            started: 'I can only help with EC2 right now.',
            missingFields: {},
            ready: '',
            executing: '',
            success: '',
            failed: ''
        },
    };
}

//FUNCTIONS D: Helpers
//Function D1: Clone Action Status
function cloneActionStatus(state, activeAction, ready) {
    return {
        type: activeAction,
        ready: Boolean(ready),
        executionMode: state.executionMode || null,
        missingFields: [...(state.missing || [])],
        collectedFields: { ...(state.collected || {}) },
        askedForFields: { ...(state.asked || {}) }
    };
}

//Function D3: Get Current User Message
function getCurrentUserMessage(rawUserMessage) {
    const normalizedMessageOutcome = openAIFunctions.normalizeUserMessageForModel(rawUserMessage);

    if (!normalizedMessageOutcome.ok) {
        console.log("STEP 1: Normalize message outcome failed");

        return {
            success: false,
            currentUserMessage: null,
            error: normalizedMessageOutcome.message
        };
    }

    const currentUserMessage = normalizedMessageOutcome.text;

    console.log("STEP 1: Normalize message outcome OK");
    console.log("Current user message (text): " + currentUserMessage);

    return {
        success: true,
        currentUserMessage: currentUserMessage,
        error: null
    };
}

//Function D4: Normalize processMessage context (masterSite, user)
function normalizeProcessMessageContext(context) {
    const raw = context || {};

    return {
        masterSite: raw.masterSite || 'Cloud Pilot',
        requestedByUserName: String(raw.requestedByUserName || raw.messageFrom || '').trim()
    };
}

module.exports = { processMessage, getActionDefinition };
