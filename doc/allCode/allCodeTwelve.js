// @ts-nocheck
/**
 * Aggregated copy of all JavaScript under api/application/atlas/.
 * For reference only - not a runnable module (multiple module.exports).
 * Updated: 2026-05-18
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
const openAIFunctions = require('../functions/openAI/openAIFunctions');
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
    //console.log("STEP 1: Build Message ")

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
        cloudPilotResult = await cloudPilotMessageFunctions.processMessage(messageCaption, conversationID);
        //console.log("CloudPilot Result:");
        //console.log("___________________");
        //console.log(cloudPilotResult);
        //console.log("___________________");
    } catch (err) {
        console.error("CloudPilot error:", err);
    }

    
    //STEP 4: Save CloudPilot message to database
    console.log("STEP 5: Save CloudPilot message to database");

    if (cloudPilotResult && cloudPilotResult.success == true) {

        //STEP 5: Build CloudPilot message
        var cloudPilotMessage = messageFunctions.buildCloudPilotMessage(req, cloudPilotResult.cloudPilotMessage);
        var cloudPilotMessageOutcome = await Message.createMessageText(cloudPilotMessage);

        if (cloudPilotMessageOutcome.outcome == 200) {
            console.log("STEP 5 SUCCESS: CloudPilot message saved");
        } else {
            console.log("STEP 5 FAILED: Could not save CloudPilot message");
        }
    }
    
    //Step 4A: Add current user message to JSON output
    messageOutcome.data.CloudPilotResponseMessage = cloudPilotMessageOutcome.newMessage;

    //Step 4B: Add Cloud Pilot action status to response
    messageOutcome.data.CloudPilotActionStatus = cloudPilotResult.cloudPilot;

    //Step 4C: Add formatted Atlas data to response
    messageOutcome.data.atlasResponse = null;
    if (cloudPilotResult && cloudPilotResult.atlasResponse) {
        messageOutcome.data.atlasResponse = cloudPilotResult.atlasResponse;
    }

    //Step 4D: Set final API success metadata from CloudPilot processing outcome
    if (cloudPilotResult && cloudPilotResult.success == true) {
        messageOutcome.success = true;
        messageOutcome.statusCode = 200;
        messageOutcome.errors = [];
    } else {
        messageOutcome.errors = [];
        
        if (cloudPilotResult && cloudPilotResult.error) {
            messageOutcome.errors = [cloudPilotResult.error];
        }
    }

    
    //STEP 5: Return Response
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
        collected: {},
        missing: [],
        asked: {}
      });
    }

    const state = this.store.get(conversationId);

    if (!state.asked) {
      state.asked = {};
    }

    return state;
  }

  // STEP 2: Start a new action
  setPendingAction(conversationId, action, missingFields = []) {
    const state = this.getState(conversationId);

    state.pendingAction = action;
    state.status = "pending";
    state.missing = [...missingFields];
    state.collected = {};
    state.asked = {};
  }

  // STEP 3: Get current action status (FIXED: consistent naming)
  getActionStatus(conversationId) {
    const state = this.getState(conversationId);

    return {
      pendingAction: state.pendingAction,
      status: state.status,
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
// FILE: application/atlas/state/conversationStateFunctions.js
// ================================================================================

/*
FUNCTIONS C: Conversation State (MVP)

Lightweight per-conversation state for CloudPilot multi-step flows.

NOTES:
- In-memory only (single Node process). Resets on restart.
- TODO: Replace Map with DB/Redis when you need multi-process + durable workflows.

FUNCTIONS A: Internal state helpers
	1) Function A1: nowMs
	2) Function A2: defaultConversationState
	3) Function A3: cloneDefaultState
	4) Function A4: isStaleState

FUNCTIONS B: Conversation key
	1) Function B1: Normalize conversation key

FUNCTIONS C: State storage API
	1) Function C1: Get State
	2) Function C2: Save State
	3) Function C3: Clear State

FUNCTIONS D: User message helpers
	1) Function D1: Detect cancel message

*/

//WHAT IS THIS WHAT A MESS MAYBE CLEAN

// TODO: Replace in-memory Map with DB/Redis for multi-process + durable workflows.
const stateStore = new Map();

const STATE_TTL_MS = Number(process.env.CLOUDPILOT_STATE_TTL_MS) || 30 * 60 * 1000;
const MAX_SLOT_ATTEMPTS = Number(process.env.CLOUDPILOT_STATE_MAX_SLOT_ATTEMPTS) || 8;

//FUNCTIONS A: Internal state helpers
//Function A1: nowMs
function nowMs() {
    return Date.now();
}

//Function A2: defaultConversationState
function defaultConversationState() {
    return {
        pendingAction: null,
        collected: {},
        missing: [],
        slotAttempts: 0,
        updatedAt: 0
    };
}

//Function A3: cloneDefaultState
function cloneDefaultState() {
    const base = defaultConversationState();
    return {
        pendingAction: base.pendingAction,
        collected: { ...base.collected },
        missing: base.missing.slice(),
        slotAttempts: base.slotAttempts,
        updatedAt: base.updatedAt
    };
}

//Function A4: isStaleState
function isStaleState(state) {
    if (!state || !state.updatedAt) {
        return false;
    }
    return nowMs() - state.updatedAt > STATE_TTL_MS;
}

//FUNCTIONS B: Conversation key
//Function B1: Normalize conversation key
function normalizeConversationKey(conversationID) {
    const id = Number(conversationID || 0);
    if (!Number.isFinite(id) || id <= 0) {
        return null;
    }
    return String(id);
}

//FUNCTIONS C: State storage API
//Function C1: Get State
function getConversationState(conversationID) {
    const key = normalizeConversationKey(conversationID);
    if (!key) {
        return cloneDefaultState();
    }

    const existing = stateStore.get(key);
    if (!existing) {
        return cloneDefaultState();
    }

    if (isStaleState(existing)) {
        console.log('conversationState: stale state cleared (conversationID=' + key + ')');
        stateStore.delete(key);
        return cloneDefaultState();
    }

    return {
        pendingAction: existing.pendingAction,
        collected: { ...(existing.collected || {}) },
        missing: Array.isArray(existing.missing) ? existing.missing.slice() : [],
        slotAttempts: Number.isFinite(existing.slotAttempts) ? existing.slotAttempts : 0,
        updatedAt: existing.updatedAt || 0
    };
}

//Function C2: Save State
function saveConversationState(conversationID, state) {
    const key = normalizeConversationKey(conversationID);
    if (!key) {
        return;
    }

    const next = {
        pendingAction: state && state.pendingAction != null ? state.pendingAction : null,
        collected: { ...(state && state.collected ? state.collected : {}) },
        missing: Array.isArray(state && state.missing) ? state.missing.slice() : [],
        slotAttempts: Number.isFinite(state && state.slotAttempts) ? state.slotAttempts : 0,
        updatedAt: nowMs()
    };

    stateStore.set(key, next);
}

//Function C3: Clear State
function clearConversationState(conversationID) {
    const key = normalizeConversationKey(conversationID);
    if (!key) {
        return;
    }
    stateStore.delete(key);
}

//FUNCTIONS D: User message helpers
//Function D1: Detect cancel message
function isCancelMessage(userText) {
    const t = String(userText || '').trim().toLowerCase();
    if (!t) {
        return false;
    }

    const cancelPhrases = ['cancel', 'stop', 'never mind', 'nevermind', 'forget it', 'abort', 'quit'];
    return cancelPhrases.some((p) => t === p || t.includes(p));
}

module.exports = {
    // STATE_TTL_MS, // Unused externally — only referenced internally by isStaleState()
    MAX_SLOT_ATTEMPTS,
    normalizeConversationKey,
    getConversationState,
    saveConversationState,
    clearConversationState,
    isCancelMessage
};


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
// FILE: application/atlas/functions/actions/actionRegistry.js
// ================================================================================

const scanEC2Handler = require('./ec2/scanEC2/scanEC2Handler');
const toggleEC2Handler = require('./ec2/toggleEC2/toggleEC2Handler');
const createEC2Handler = require('./ec2/createEC2/createEC2Handler');

/*
===============================================================================
CANONICAL STATIC ACTION DEFINITIONS
===============================================================================

This file is the central registry for CloudPilot action definitions.

Each action definition describes static orchestration metadata:
- identity
- policy
- intent detection
- workflow requirements
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

    //SERVICE: EC2
    //Action: Scan EC2
    scan_ec2: {
        //Identity
        type: 'scan_ec2',
        actionLabel: 'Scan EC2',

        //Policy
        allowed: true,

        //Orchestration
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
        executionFunction: scanEC2Handler,

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
        requiresWorkflow: true,
        requiresExecution: false,

        //Intent Detection
        match: (text) =>
            text.includes('toggle') ||
            text.includes('switch'),

        //Fields Required Before Ready
        requiredFields: [
            'region'
        ],

        //Optional Defaults
        defaults: {},

        //Execution
        executionFunction: toggleEC2Handler,

        //User-Facing System Messages
        messages: {
            started: 'Confirm before changing EC2 instances.',
            missingFields: {
                region: 'Which AWS region should I use?'
            },
            ready: 'Everything is ready for the EC2 update.',
            executing: 'Updating EC2 instance state.',
            success: 'EC2 instance state updated.',
            failed: 'EC2 instance state update failed.'
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
        requiresWorkflow: true,
        requiresExecution: false,

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
                'environment': 'demo',
                'cloudpilot-role': 'secondary'
            }
        },

        //Execution
        executionFunction: createEC2Handler,

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
    }
};

module.exports = actionRegistry;


// ================================================================================
// FILE: application/atlas/functions/actions/ec2/atlasEC2Functions.js
// ================================================================================

/*
//GOAL: This is where we call atlas. Atlas interacts and performs AWS Actions
FUNCTIONS A: Atlas Scanner Functions
    1) Function A1: Scan EC2
    2) Function A2: Create EC2
*/

const ATLAS_BASE_URL = process.env.ATLAS_BASE_URL || "http://127.0.0.1:8000";

//FUNCTIONS A: Atlas Scanner
//Function A1: Scan EC2
async function scanEC2(region) {

    const response = await fetch(ATLAS_BASE_URL + "/scan/ec2", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            scan_type: "full",
            team: "cloud-pilot",
            region: region,
            rules: []
        })
    });

    if (!response.ok) {
        throw new Error("Atlas EC2 scan failed with status " + response.status);
    }

    return await response.json();
}

//Function A2: Create EC2 (Atlas /ec2/create)
async function createEC2(requestBody) {
    // TEMP: skip HTTP to Atlas (no AWS create yet)
    // const response = await fetch(ATLAS_BASE_URL + "/ec2/create", {
    //     method: "POST",
    //     headers: {
    //         "Content-Type": "application/json"
    //     },
    //     body: JSON.stringify(requestBody)
    // });
    //
    // if (!response.ok) {
    //     throw new Error("Atlas EC2 create failed with status " + response.status);
    // }
    //
    // return await response.json();

    console.log("TEMP (createEC2): requestBody:", JSON.stringify(requestBody, null, 2));
    return {
        success: false,
        data: {},
        message: "TEMP: Atlas EC2 create not called",
        errors: ["temp_atlas_skipped"]
    };
}

module.exports = { scanEC2, createEC2 };


// ================================================================================
// FILE: application/atlas/functions/actions/ec2/scanEC2/atlasEC2Formatter.js
// ================================================================================


/*
//GOAL: Take raw data from atlas and format it so it is easier to display
FUNCTIONS A: Atlas Data Formatting Functions
    1) Function A1: Format Atlas EC2 Output
*/

//FUNCTIONS A: Atlas Data Formatting
//Function A1: Format Atlas EC2 Output
function formatAtlasEC2Output(atlasResponse) {

    //STEP 1: Safety checks
    const atlasData = atlasResponse?.data || {};

    const instances = atlasData.instances || [];
    const findings = atlasData.findings || [];

    //STEP 2: Build summary
    const summary = {
        resourcesScanned: atlasData.resourcesScanned || 0,
        findingCount: atlasData.findingCount || 0,
        scanType: atlasData.scanType || null,
        region: atlasData.region || null
    };

    //STEP 3: Simplify instances
    const formattedInstances = instances.map((instance) => {

        return {
            instanceID: instance.instance_id || null,
            name: instance.name || null,
            state: instance.state || null,
            instanceType: instance.instance_type || null,
            avgCPU: instance.avg_cpu || null,
            region: instance.region || null,

            role: instance.tags?.["cloudpilot-role"] || null,

            environmentName:
                instance.tags?.["elasticbeanstalk:environment-name"] || null
        };
    });

    //STEP 4: Simplify findings
    const formattedFindings = findings.map((finding) => {

        return {
            findingID: finding.id || null,

            service: finding.service || null,
            provider: finding.provider || null,
            region: finding.region || null,

            resourceID: finding.resource?.id || null,
            resourceName: finding.resource?.name || null,
            resourceType: finding.resource?.instance_type || null,

            issueCode: finding.issue?.code || null,
            title: finding.issue?.title || null,
            description: finding.issue?.description || null,

            severity: finding.issue?.severity || null,
            confidence: finding.issue?.confidence || null,
            category: finding.issue?.category || null,

            status: finding.status || null,
            priority: finding.priority || null,

            avgCPU: finding.metrics?.avg_cpu || null,

            recommendationAction:
                finding.recommendation?.action || null,

            recommendation:
                finding.recommendation?.description || null,

            risk:
                finding.recommendation?.risk || null,

            remediationAvailable:
                finding.remediation?.available || false,

            estimatedMonthlySavings:
                finding.cost?.estimated_monthly_savings || 0,

            currency:
                finding.cost?.currency || "USD",

            summary:
                finding.summary || null,

            ruleID:
                finding.metadata?.rule_id || null
        };
    });

    //STEP 5: Final formatted output
    return {
        summary,
        instances: formattedInstances,
        findings: formattedFindings
    };
}

module.exports = {
    formatAtlasEC2Output
};


// ================================================================================
// FILE: application/atlas/functions/actions/ec2/scanEC2/atlasEC2MessageBuilder.js
// ================================================================================

/*
//GOAL: This is where we create messages for the user. We could ask Open AI to do this but we just do them ourselves here. 

FUNCTIONS A: Atlas Message Builder Functions
    1) Function A1: Build EC2 Scan Message
*/

//FUNCTIONS A: Atlas Message Builder
//Function A1: Build EC2 Scan Message
function buildEC2ScanMessage(formattedAtlas) {
    var summary = {};
    var findings = [];

    if (formattedAtlas && formattedAtlas.summary) {
        summary = formattedAtlas.summary;
    }

    if (formattedAtlas && Array.isArray(formattedAtlas.findings)) {
        findings = formattedAtlas.findings;
    }

    var region = summary.region || "the selected region";
    var findingCount = findings.length;

    if (findingCount === 0) {
        return "EC2 scan completed for " + region + ". No findings detected.";
    }

    if (findingCount === 1) {
        var finding = findings[0] || {};
        var resourceName = finding.resourceName || finding.resourceID || "one resource";
        var title = finding.title || "an infrastructure finding";

        return "I found 1 EC2 finding in " + region + ". " + resourceName + " has " + String(title).toLowerCase() + ".";
    }

    var firstFinding = findings[0] || {};
    var firstFindingTitle = firstFinding.title || "infrastructure findings";

    return "I found " + findingCount + " EC2 findings in " + region + ", including " + String(firstFindingTitle).toLowerCase() + ".";
}

module.exports = {
    buildEC2ScanMessage
};


// ================================================================================
// FILE: application/atlas/functions/actions/ec2/scanEC2/scanEC2Handler.js
// ================================================================================

const atlasEC2Functions = require('../atlasEC2Functions');
const atlasEC2Formatter = require('./atlasEC2Formatter');
const atlasEC2MessageBuilder = require('./atlasEC2MessageBuilder');

async function scanEC2Handler(context) {

    try {

        const region =
            context.state.collected.region;

        let atlasResponseFormatted = null;

        const atlasResponseRaw =
            await atlasEC2Functions.scanEC2(region);

        console.log("_____________________________________");
        console.log("RAW Atlas Response:");
        console.log(JSON.stringify(atlasResponseRaw, null, 2));
        console.log("_____________________________________");

        if (
            atlasResponseRaw?.success === true &&
            atlasResponseRaw?.data
        ) {

            atlasResponseFormatted =
                atlasEC2Formatter.formatAtlasEC2Output(
                    atlasResponseRaw
                );
        }

        console.log("_____________________________________");
        console.log("Atlas Response:");
        console.log(atlasResponseFormatted);
        console.log("_____________________________________");

        return {
            success: true,
            cloudPilotMessage:
                atlasEC2MessageBuilder.buildEC2ScanMessage(
                    atlasResponseFormatted
                ),
            error: null,
            atlasResponse: atlasResponseFormatted
        };

    } catch (error) {

        console.log("Atlas Error:");
        console.log(error);

        return {
            success: false,
            cloudPilotMessage:
                "I could not complete the EC2 scan.",
            error: error.message,
            atlasResponse: null
        };
    }
}

module.exports = scanEC2Handler;


// ================================================================================
// FILE: application/atlas/functions/actions/ec2/toggleEC2/toggleEC2Handler.js
// ================================================================================

const openAIFunctions = require('../../../openAI/openAIFunctions');

async function toggleEC2Handler(context) {
    const chatResult = await openAIFunctions.sendChatWithAction(context.userMessage, context.action);

    if (!chatResult.success) {
        return {
            success: false,
            cloudPilotMessage: chatResult.message || 'ChatGPT request failed',
            error: chatResult.error || null,
            atlasResponse: null
        };
    }

    const cloudPilotMessage =
        (chatResult.data != null && chatResult.data !== '')
            ? chatResult.data
            : (chatResult.message || '');

    return {
        success: true,
        cloudPilotMessage: cloudPilotMessage,
        error: null,
        atlasResponse: null
    };
}

module.exports = toggleEC2Handler;


// ================================================================================
// FILE: application/atlas/functions/actions/ec2/createEC2/createEC2Handler.js
// ================================================================================

const atlasEC2Functions = require('../atlasEC2Functions');

function buildTagsFromDefaults(defaults) {
    const raw = defaults && defaults.tags;
    if (!raw || typeof raw !== "object") {
        return {};
    }
    return { ...raw };
}

async function createEC2Handler(context) {

    try {

        const collected = context.state.collected;
        const action = context.action;

        const name = collected.name;
        const region = collected.region;
        const instance_type = collected.instance_type;

        if (!name || !region || !instance_type) {
            return {
                success: false,
                cloudPilotMessage: "I am missing name, region, or instance type to create the instance.",
                error: "missing_collected_fields",
                atlasResponse: null
            };
        }

        const defaults = (action && action.defaults) ? action.defaults : {};
        const tags = buildTagsFromDefaults(defaults);

        const requestBody = {
            name: String(name).trim(),
            region: String(region).trim(),
            instance_type: String(instance_type).trim(),
            tags: tags
        };

        console.log("_____________________________________");
        console.log("Create EC2 request body:");
        console.log(JSON.stringify(requestBody, null, 2));
        console.log("_____________________________________");

        const atlasResponseRaw = await atlasEC2Functions.createEC2(requestBody);

        console.log("_____________________________________");
        console.log("RAW Atlas Create Response:");
        console.log(JSON.stringify(atlasResponseRaw, null, 2));
        console.log("_____________________________________");

        if (atlasResponseRaw && atlasResponseRaw.success === true && atlasResponseRaw.data && atlasResponseRaw.data.instance_id) {
            const instanceId = atlasResponseRaw.data.instance_id;
            const regionOut = atlasResponseRaw.data.region || String(region).trim();
            return {
                success: true,
                cloudPilotMessage: "Created EC2 instance " + instanceId + " in " + regionOut + ".",
                error: null,
                atlasResponse: atlasResponseRaw.data
            };
        }

        const errMsg = atlasResponseRaw && atlasResponseRaw.message ? String(atlasResponseRaw.message) : "Atlas did not create the instance.";
        const errCode = atlasResponseRaw && atlasResponseRaw.errors && atlasResponseRaw.errors[0] ? String(atlasResponseRaw.errors[0]) : "";

        return {
            success: false,
            cloudPilotMessage: "I could not create the EC2 instance.",
            error: errCode || errMsg,
            atlasResponse: null
        };

    } catch (error) {

        console.log("Atlas Create Error:");
        console.log(error);

        return {
            success: false,
            cloudPilotMessage: "I could not create the EC2 instance.",
            error: error.message,
            atlasResponse: null
        };
    }
}

module.exports = createEC2Handler;


// ================================================================================
// FILE: application/atlas/functions/functions.js
// ================================================================================

/*
FUNCTIONS A: AWS Helper Functions 
	1) Function A1: Extract AWS region from user text
	2) Function A2: Extract EC2 instance type from user text
	3) Function A3: Extract instance name from user text (MVP phrases)
	4) Function A4: fieldExtractors map (field name → extractor)
	5) Function A5: Extract structured workflow fields from user message
	6) Function A6: Determine request readiness
	7) Function A7: Determine workflow event

*/

//FUNCTIONS A: AWS Helper Functions
//Function A1: Extract AWS region from user text
function extractAwsRegion(userText) {
    const s = String(userText || '');
    const match = s.match(/\b((?:us|eu|ap|sa|ca|me|af)-(?:gov-)?[a-z]+-\d)\b/i);
    if (!match) {
        return null;
    }
    return String(match[1]).toLowerCase();
}

//Function A2: Extract EC2 instance type from user text
function extractInstanceType(text) {
    const match = text.match(/\b(t2|t3|m5|c5)\.(micro|small|medium|large)\b/i);
    if (!match) {
        return null;
    }
    return String(match[0]).toLowerCase();
}

//Function A3: Extract instance name from user text (MVP phrases)
function extractName(text) {
    const s = String(text || '');
    let match = s.match(/\bname\s+it\s+([a-z0-9][a-z0-9._-]*)\b/i);
    if (match) {
        return String(match[1]).trim();
    }
    match = s.match(/\bcall\s+it\s+([a-z0-9][a-z0-9._-]*)\b/i);
    if (match) {
        return String(match[1]).trim();
    }
    const trimmed = s.trim();
    const lower = trimmed.toLowerCase();
    if (/^(hello|hi|hey|thanks|thank you|yes|no|ok)\s*$/i.test(lower)) {
        return null;
    }
    const afterLeadIn = trimmed.replace(/^(ok|yes|sure|thanks)[,.\s]+/i, '').trim();
    const candidate = afterLeadIn.length ? afterLeadIn : trimmed;
    if (/^[a-z0-9][a-z0-9._-]{1,62}$/i.test(candidate) && (candidate.includes('-') || candidate.includes('_') || candidate.includes('.'))) {
        return candidate;
    }
    return null;
}

//Function A4: fieldExtractors map (field name → extractor)
const fieldExtractors = {
    region: extractAwsRegion,
    instance_type: extractInstanceType,
    name: extractName
};

//Function A5: Extract structured workflow fields from user message
function extractStructuredFields(message) {
    const extractedFields = {};
    const text = String(message || '');
    const regex = /(\w+)\s*:\s*"([^"]+)"/g;

    let match;

    while ((match = regex.exec(text)) !== null) {
        const missingFieldName = match[1];
        const structuredFieldValue = match[2];

        // Last duplicate match wins
        extractedFields[missingFieldName] = structuredFieldValue;
    }

    return extractedFields;
}

//Function A6: Determine request readiness
function determineRequestReadiness(activeRequestedAction, currentStateData) {

    // No active request exists
    if (!activeRequestedAction) {
        console.log("STEP 6A: No active request");
        return false;
    }

    // Request still missing fields
    if (currentStateData.missing.length > 0) {
        console.log("STEP 6B: Request still missing fields");
        return false;
    }

    // Request already completed
    if (currentStateData.status === "completed") {
        console.log("STEP 6C: Request already completed");
        return false;
    }

    // Request already failed
    if (currentStateData.status === "failed") {
        console.log("STEP 6D: Request already failed");
        return false;
    }

    console.log("STEP 6E: Request is READY");

    return true;
}

//Function A7: Determine workflow event
function determineActionEvent(actionEventData) {

    if (actionEventData.actionTransitionedToReady) {
        return "awaiting_confirmation";
    }

    if (actionEventData.newActionStarted) {
        return "new_action";
    }

    if (actionEventData.fieldsUpdated) {
        return "missing_fields_given";
    }

    return null;
}

function userConfirmedAction(userMessage) {
    const normalizedMessage = String(userMessage || '').toLowerCase().trim().replace(/[.!?]+$/g, '');
    const confirmationMessages = [
        "yes",
        "confirm",
        "run it",
        "do it",
        "proceed",
        "execute"
    ];

    return confirmationMessages.includes(normalizedMessage);
}

function shouldStartExecution(executionDecisionData) {
    return Boolean(
        executionDecisionData.activeAction &&
        executionDecisionData.actionState &&
        executionDecisionData.actionState.status === "ready" &&
        userConfirmedAction(executionDecisionData.currentUserMessage)
    );
}

fieldExtractors.extractStructuredFields = extractStructuredFields;
fieldExtractors.determineRequestReadiness = determineRequestReadiness;
fieldExtractors.determineActionEvent = determineActionEvent;
fieldExtractors.userConfirmedAction = userConfirmedAction;
fieldExtractors.shouldStartExecution = shouldStartExecution;

module.exports = fieldExtractors;


// ================================================================================
// FILE: application/atlas/functions/openAI/openAIFunctions.js
// ================================================================================

const OpenAI = require('openai');
const { CHAT_CONFIG, OPENAI_SAFE_DEFAULTS } = require('../config/chatGPTconfig');

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
// FILE: application/atlas/functions/classes/AtlasExecution.js
// ================================================================================

const actionState = require('../../state/ActionState');

class AtlasExecution {
    static async startNewAtlasExecution(payload) {
        console.log("ATLAS EXECUTION STARTED");

        actionState.setStatus(payload.conversationID, "running");

        await new Promise(resolve => setTimeout(resolve, 3000));

        return await AtlasExecution.closeAtlasExecution(payload);
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

        actionState.setStatus(payload.conversationID, "completed");
        actionState.clear(payload.conversationID);

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

module.exports = AtlasExecution;


// ================================================================================
// FILE: application/atlas/functions/cloudPilotMessageFunctions.js
// ================================================================================

const openAIFunctions = require('./openAI/openAIFunctions');
const actionState = require('../state/ActionState');
const actionRegistry = require('./actions/actionRegistry');
const Functions = require('./functions');
const AtlasExecution = require('./classes/AtlasExecution');

/*
FUNCTIONS A: CloudPilot (Atlas) — intent → decide → ChatGPT
    1) Function A1: Process Message (pipeline)

//FUNCTIONS B: Process User Messages
    2) Function B1: Detect Intent
    3) Function B2: Decide Action
    4) Function B5: Workflow prompt for missing field
    5) Function B6: General chat during active workflow (ChatGPT + continuation)
*/

/*
System Layer: activeAction
Registry Layer: actionDefinition
Execution Layer: execution (done by atlas)
*/
//FUNCTIONS A: CloudPilot (Atlas) — intent → decide → ChatGPT
//Function A1: Process Message (pipeline)
async function processMessage(rawUserMessage, conversationID) {
    var currentActionState = actionState.getActionStatus(conversationID);
    var activeAction = currentActionState.pendingAction;
    let actionEvent = null;
    let cloudPilotShouldRespond = false; //Other is we send to Open AI
    let actionTransitionedToReady = false;
    let actionPendingConfirmation = false;
    let newActionStarted = false;
    let fieldsUpdated = false;

    //console.log("_______________processMessage______________________")

    //Create outcome
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
                askedForFields: {}
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

    //Sync Data
    processMessageOutcome.cloudPilot.actionStatus = cloneActionStatus(currentActionState, null, false);

    printState(conversationID, "INITIAL STATE:");
 
    //STEP 1: Normalize user message
    const currentUserMessageOutcome = getCurrentUserMessage(rawUserMessage);

    //Handle Error from normalizing user message
    if (!currentUserMessageOutcome.success) {
        processMessageOutcome.success = false;
        processMessageOutcome.error = currentUserMessageOutcome.error;

        return processMessageOutcome;         
    }

    const currentUserMessage = currentUserMessageOutcome.currentUserMessage;

    //STEP 2: Detect user request
    const userRequest = detectUserRequest(currentUserMessage); //available: general_chat, scan_ec2, toggle_ec2, create_ec2
    processMessageOutcome.cloudPilot.userRequest = userRequest;
    processMessageOutcome.cloudPilot.actionStatus.type = userRequest === "general_chat" ? null : userRequest;

    console.log("STEP 2: USER REQUEST:", userRequest);
    console.log(" ");
    

    //STEP 3: Check if user is requesting an action not just general chat
    const actionDefinition = getActionDefinition(userRequest);
    console.log("STEP 3: ACTION- Full from Action Registry ");
    console.log(actionDefinition)
    console.log(" ");
    
    
    //STEP 4: Start or replace active request
    if (actionDefinition.requiresWorkflow) {
        cloudPilotShouldRespond = true;

        // Start a new requested action when there is no matching active request.
        const shouldStartNewActionNow = shouldStartNewAction(activeAction, actionDefinition, currentActionState);
        
        if (shouldStartNewActionNow) {
            console.log("STEP 4: Starting active request");
            console.log(" ");

            actionState.setPendingAction(conversationID, actionDefinition.type, actionDefinition.requiredFields || []);
            newActionStarted = true;
        }

        // Refresh active request state
        currentActionState = actionState.getActionStatus(conversationID);
        activeAction = currentActionState.pendingAction;
        //processMessageOutcome.cloudPilot.state = cloneOperationState(currentStateData);
    } else {
        console.log("STEP 4: NOT Starting active request just chattin dude");
    }

    const hadMissingFieldsBefore = activeAction && currentActionState.missing.length > 0;


    //STEP 5: Extract structured workflow fields from the user message.
    if (activeAction && currentActionState.missing.length > 0) {
        const extractedFields = Functions.extractStructuredFields(currentUserMessage);
        const missingFields = currentActionState.missing.slice();

        for (const missingFieldName of missingFields) {

            const structuredFieldValue = extractedFields[missingFieldName];

            if (!structuredFieldValue) {
                continue;
            }

            console.log("STEP 5: Found field:", missingFieldName, structuredFieldValue);

            actionState.setField(conversationID, missingFieldName, structuredFieldValue);
            fieldsUpdated = true;

            // Refresh state after updating workflow fields
            currentActionState = actionState.getActionStatus(conversationID);
            activeAction = currentActionState.pendingAction;
        }

    } else {
        console.log("STEP 5: Nothing pending so we did not look for any updated information");
    }

    //STEP 6: Gather information for request and see if it is just became ready or was ready
    const actionReady = Functions.determineRequestReadiness(activeAction, currentActionState);

    //Step 6A: Update request status to READY now user just has to confirm
    if (actionReady && currentActionState.status !== "ready") {
        console.log("Step 6A: Updating request status to READY");

        actionState.setStatus(conversationID, "ready");

        // Refresh state after updating request status
        currentActionState = actionState.getActionStatus(conversationID);

        activeAction = currentActionState.pendingAction;
    }

    //Step 6B: Check if the ready JUST happened 
    if (hadMissingFieldsBefore && actionReady) {
        console.log("Step 6B: Requested Action transitioned to READY");

        actionTransitionedToReady = true;
    }
    
    //Step 6C: CloudPilot should respond when request just became ready
    if (actionTransitionedToReady) {
        console.log("Step 6C: CloudPilot should respond");

        cloudPilotShouldRespond = true;
    }

    //Step 6D: Check if action is pending confirmation
    actionPendingConfirmation = activeAction && currentActionState.status === "ready" && !actionTransitionedToReady;

    if (actionPendingConfirmation) {
        console.log("Step 6D: Action pending confirmation");
    }

    //Step 6E: Determine workflow event
    actionEvent = Functions.determineActionEvent({
        actionDefinition: actionDefinition,
        activeAction: activeAction,
        actionState: currentActionState,
        hadMissingFieldsBefore: hadMissingFieldsBefore,
        actionTransitionedToReady: actionTransitionedToReady,
        newActionStarted: newActionStarted,
        fieldsUpdated: fieldsUpdated
    });

    if (actionEvent) {
        console.log("Step 6E: Workflow event detected:", actionEvent);

        cloudPilotShouldRespond = true;
    }

    //STEP 7: Execution lifecycle
    if (actionPendingConfirmation) {
        console.log("Step 7A: Action awaiting execution confirmation");

        const userConfirmedExecution = Functions.shouldStartExecution({activeAction: activeAction, actionState: currentActionState, currentUserMessage: currentUserMessage });

        if (userConfirmedExecution) {
            console.log("Step 7B: User confirmed execution");
            actionEvent = "execution_requested";

            cloudPilotShouldRespond = true;
        }
    }

    const activeActionDefinition = getActionDefinition(activeAction || userRequest);

    const chatPayload = {
        conversationID,
        currentUserMessage,
        userRequest,

        actionEvent,
    
        // Static action registry definition
        actionDefinition: activeActionDefinition,
    
        // Whether the workflow is currently executable
        actionReady,
    
        // Persisted workflow state
        actionState: {
            pendingAction: activeAction,
            status: currentActionState.status,
            missingFields: [...(currentActionState.missing || [])],
            collectedFields: { ...(currentActionState.collected || {}) },
            askedForFields: { ...(currentActionState.asked || {}) }
        }
    };

    let refreshedActionReady = actionReady;

    //STEP 8: Chat response routing
    if (cloudPilotShouldRespond) {
        const result = await handleCloudPilotChat(chatPayload);

        processMessageOutcome.success = result.success;
        processMessageOutcome.cloudPilotMessage = result.message;
        processMessageOutcome.atlasResponse = result.atlasResponse || null;
        processMessageOutcome.error = result.error || null;

        currentActionState = actionState.getActionStatus(conversationID);
        activeAction = currentActionState.pendingAction;
        refreshedActionReady = Functions.determineRequestReadiness(activeAction, currentActionState);

        console.log("Step 8: CLOUD_PILOT selected");
    } else {

        console.log("Step 8: OPEN_AI selected");
        console.log("OPEN_AI PAYLOAD:");
        console.log(JSON.stringify(chatPayload, null, 2));

        processMessageOutcome.success = true;
        processMessageOutcome.cloudPilotMessage = "OPEN_AI is responding";
    }

    //TO DO: Move requestStatus syncing to the end of processMessage after all state changes run.
    //Also maybe set all manually one by one this is confusing
    processMessageOutcome.cloudPilot.actionStatus = cloneActionStatus(currentActionState, activeAction, refreshedActionReady);
    
    //STATE TEMP
    printState(conversationID, "FINAL STATE:");
    //STATE TEMP
    //console.log("_______________processMessage______________________")    
    console.log("FINAL END OF FUNCTION: processMessageOutcome ")
    console.log(processMessageOutcome)
    console.log(" processMessageOutcome ")

    console.log(" ");
  

    return processMessageOutcome;

}

//FUNCTIONS B: Process User Messages
//Function B1: Detect User Request
function detectUserRequest(userMessage) {
    const normalizedMessage = String(userMessage || '').toLowerCase().trim();

    // TEMP: remove when done debugging intent / registry
    const availableActionTypes = Object.keys(actionRegistry);
    console.log(" ")
    console.log("Step 2A: Available Actions from ActionRegistry");
    console.log("[" + availableActionTypes.join(", ") + "]");
    console.log(" ")

    
    for (const action of Object.values(actionRegistry)) {

        if ( typeof action.match === 'function' && action.match(normalizedMessage)) {
            return action.type;
        }
    }

    return 'general_chat';
}

//Function B2: Get Action Definition
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

//Function B3: Handle General Chat
async function handleGeneralChat(payload) {

    console.log(" ");
    console.log("OPEN_AI FUNCTION CALLED");
    console.log(JSON.stringify(payload, null, 2));
    console.log(" ");

    return {
        success: true,
        message: "OPEN_AI_RESPONSE"
    };
}

//NEW 
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

    // STEP 3: Workflow is now ready and waiting for confirmation
    if (payload.actionEvent === "awaiting_confirmation") {

        return await cloudPilotRespondAwaitingConfirmation(payload);
    }

    // STEP 4: User confirmed execution
    if (payload.actionEvent === "execution_requested") {

        return await AtlasExecution.startNewAtlasExecution(payload);
    }

    // STEP 5: Fallback
    return {
        success: false,
        message: "Unknown CloudPilot workflow event.",
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

async function cloudPilotRespondAwaitingConfirmation(payload) {
    const actionDefinition = payload.actionDefinition;
    const readyMessage =
        actionDefinition.messages.ready ||
        "Everything is ready.";

    return {
        success: true,
        message: readyMessage + "\n\nWould you like me to execute this action?",
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

function cloneActionStatus(state, activeAction, ready) {
    return {
        type: activeAction,
        ready: Boolean(ready),
        missingFields: [...(state.missing || [])],
        collectedFields: { ...(state.collected || {}) },
        askedForFields: { ...(state.asked || {}) }
    };
}

function shouldStartNewAction(activeAction, actionDefinition, actionState) {
    // No active request exists yet
    const noActionActive = !activeAction;

    // User asked for a different requested action than the active one
    const actionChanged = activeAction !== actionDefinition.type;

    // Previous active request already completed
    const previousActionCompleted = actionState.status === "completed";

    // Previous active request already failed
    const previousActionFailed = actionState.status === "failed";

    return noActionActive || actionChanged || previousActionCompleted || previousActionFailed;
}

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

function printState(conversationID, messageVar) {
    console.log(" ")
    console.log("_____________________________________")
    console.log(messageVar);
    actionState.print(conversationID);        
    console.log("_____________________________________")
    console.log(" ");
}


module.exports = { processMessage, detectUserRequest, getActionDefinition };

//GOAL
/*
async function processMessage(rawUserMessage, conversationID) {

    const currentUserMessage =
        normalizeMessage(rawUserMessage);

    const userRequest =
        detectUserRequest(currentUserMessage);

    const workflowResult =
        workflowEngine({
            conversationID,
            currentUserMessage,
            userRequest
        });

    const response =
        await responseLayer(workflowResult);

    return response;
}

function workflowEngine(payload) {

    // load state

    // determine workflow changes

    // extract fields

    // determine readiness

    // determine transition

    return {
        workflowTransition,
        requestReady,
        requestState,
        workflowDefinition
    };
}
    */


//FINAL
/*
const cloudPilotFINAL = {

    cloudPilot: {

        userRequest: null, // e.g. "scan_ec2", "toggle_ec2", "general_chat"

        requestStatus: {
            requestedAction: null, // What action the user asked for ("scan_ec2", "toggle_ec2") null if it is just general_chat
            ready: false,

            missingFields: [],
            collectedFields: {},
            askedForFields: {}
        },
        
        policy: {
            allowed: false, //NOT DONE
            message: null, //NOT DONE
            reasonNotAllowed: null // e.g. "OUT_OF_SCOPE", "DESTRUCTIVE_ACTION" //NOT DONE
        },

        atlasExecution: {
            status: "idle", // "idle" | "running" | "completed" | "failed"
            actionId: null, // Atlas execution ID
            startedAt: null,
            completedAt: null,
            error: null
        }
    }
}
    */


//APPENDIX

    /*
    function logCloudPilotMessage(message) {
    console.log("CLOUD PILOT MESSAGE: " + (message || ""));
}


    //STEP 8: Chat response routing
    if (cloudPilotShouldRespond) {
        const result = await handleCloudPilotChat(chatPayload);

        processMessageOutcome.success = result.success;
        processMessageOutcome.cloudPilotMessage = result.message;
        processMessageOutcome.atlasResponse = result.atlasResponse || null;
        processMessageOutcome.error = result.error || null;
        processMessageOutcome.cloudPilot.state = cloneOperationState(actionState.getActionStatus(conversationID));

        console.log("STEP 7: CLOUD_PILOT selected");

    } else {

        const result = await handleGeneralChat(chatPayload);

        processMessageOutcome.success = result.success;
        processMessageOutcome.cloudPilotMessage = result.message;
        processMessageOutcome.atlasResponse = result.atlasResponse || null;
        processMessageOutcome.error = result.error || null;

        console.log("STEP 7: OPEN_AI selected");
    }

  */

    /*
    function cloneOperationState(state) {
    return {
        pendingAction: state.pendingAction,
        missing: [...(state.missing || [])],
        collected: { ...(state.collected || {}) },
        asked: { ...(state.asked || {}) }
    };
}
     */


    /*
    async function handleCloudPilotChatOLD(payload) {

    console.log(" ");
    console.log("CLOUD_PILOT FUNCTION CALLED");
    console.log(JSON.stringify(payload, null, 2));
    console.log(" ");

    //STEP 1: Get the full action definition
    //NOTE: We use actionRegistry directly here because getActionDefinition()
    //removes internal fields like executionFunction/defaults.
    const activeAction = payload.actionState && payload.actionState.pendingAction;
    const actionDefinition = actionRegistry[activeAction];

    //STEP 2: Make sure the requested action exists
    if (!actionDefinition) {
        const response = {
            success: false,
            message: "I could not find that CloudPilot action.",
            atlasResponse: null,
            error: "missing_action_definition"
        };

        logCloudPilotMessage(response.message);
        return response;
    }

    //STEP 3: If the request has all required fields, execute the handler
    if (payload.actionReady === true) {

        //STEP 3A: Make sure this action has an executable handler
        if (typeof actionDefinition.executionFunction !== 'function') {
            actionState.setStatus(payload.conversationID, "failed");

            const response = {
                success: false,
                message: "That CloudPilot action is not executable yet.",
                atlasResponse: null,
                error: "missing_action_handler"
            };

            logCloudPilotMessage(response.message);
            return response;
        }

        //STEP 3B: Mark workflow as running before the handler starts
        actionState.setStatus(payload.conversationID, "running");

        let result;

        try {
            //STEP 3C: Execute the action using the registry-defined handler
            result = await actionDefinition.executionFunction({
                userMessage: payload.currentUserMessage,
                action: actionDefinition,
                state: {
                    pendingAction: activeAction,
                    status: "running",
                    missing: payload.actionState.missingFields || [],
                    collected: payload.actionState.collectedFields || {}
                },
                conversationID: payload.conversationID
            });
        } catch (error) {
            //STEP 3D: Handler threw before returning a normal result
            actionState.setStatus(payload.conversationID, "failed");

            const response = {
                success: false,
                message: actionDefinition.messages.failed || "That CloudPilot action failed.",
                atlasResponse: null,
                error: error.message || String(error)
            };

            logCloudPilotMessage(response.message);
            return response;
        }

        //STEP 3E: Handler finished, so set final workflow status
        if (result.success) {
            actionState.setStatus(payload.conversationID, "completed");
        } else {
            actionState.setStatus(payload.conversationID, "failed");
        }

        //STEP 3F: Convert handler result into CloudPilot's response shape
        const response = {
            success: result.success,
            message: result.cloudPilotMessage || result.message || '',
            atlasResponse: result.atlasResponse || null,
            error: result.error || null
        };

        logCloudPilotMessage(response.message);
        return response;
    }

    //STEP 4: Request is not ready, so ask for the next missing field
    const missing = payload.actionState && payload.actionState.missingFields ? payload.actionState.missingFields : [];
    const nextMissingField = missing[0];

    //STEP 4A: Fallback if CloudPilot has no specific missing field
    if (!nextMissingField) {
        const response = {
            success: true,
            message: actionDefinition.messages.started || "I need more information to continue.",
            atlasResponse: null,
            error: null
        };

        logCloudPilotMessage(response.message);
        return response;
    }

    //STEP 4B: Get the missing-field question from the registry
    const missingFieldMessages = actionDefinition.messages && actionDefinition.messages.missingFields ? actionDefinition.messages.missingFields : {};

    const fromRegistry = missingFieldMessages[nextMissingField];

    const question = fromRegistry ? String(fromRegistry).trim() : ("I still need: " + nextMissingField);

    //STEP 4C: Only mark asked{} when we are actually sending the question
    if (question) {
        actionState.markAsked(payload.conversationID, nextMissingField);
    }

    //STEP 4D: Return the missing-field question
    const response = {
        success: true,
        message: question,
        atlasResponse: null,
        error: null
    };

    logCloudPilotMessage(response.message);
    return response;
}
    */

