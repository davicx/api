-- =============================================================================
-- To Do seed — CloudPilot Chat context (remaining only)
-- =============================================================================
-- Source: doc/development/cloud_pilot_chat.md
-- Category: chat context
-- Skipped done (Phase C1): contextTypes, buildAIContext/buildAISystemMessage,
--   OPEN_AI toggle, sendGeneralChat system prompt wiring
-- =============================================================================

INSERT INTO todo (
    organization_id,
    project_id,
    title,
    description,
    category,
    status,
    stage,
    priority,
    display_order
) VALUES
-- Phase C1b — Conversation history (CloudPilotContext)
(
    'Cloud Pilot',
    'cloud_pilot_chat',
    'Create CloudPilotContext class',
    'Add services/context/classes/CloudPilotContext.js with get recent messages + format for AI ({ role, content }).',
    'chat context',
    'open',
    'mvp',
    1,
    1
),
(
    'Cloud Pilot',
    'cloud_pilot_chat',
    'Reuse Message.getConversationMessages for history',
    'Load conversation thread from existing messages table (LIMIT). Do not create a new chat messages table.',
    'chat context',
    'open',
    'mvp',
    1,
    2
),
(
    'Cloud Pilot',
    'cloud_pilot_chat',
    'Wire speakGeneral to send conversation history',
    'When OPENAI_SEND_CONVERSATION_HISTORY=true, load history via CloudPilotContext and pass into the OpenAI request.',
    'chat context',
    'open',
    'mvp',
    1,
    3
),
(
    'Cloud Pilot',
    'cloud_pilot_chat',
    'Support conversationMessages in sendGeneralChat',
    'Update sendGeneralChat({ systemMessage, conversationMessages }) so history is included with the system message.',
    'chat context',
    'open',
    'mvp',
    1,
    4
),
(
    'Cloud Pilot',
    'cloud_pilot_chat',
    'Log conversation block in request log',
    'When OPENAI_LOG_REQUEST=true, log conversation history under STEP 7c / request log.',
    'chat context',
    'open',
    'mvp',
    2,
    5
),

-- Phase C2 — General chat reliable
(
    'Cloud Pilot',
    'cloud_pilot_chat',
    'Fallback when OpenAI fails or key missing',
    'Return template/stub reply instead of empty response when API key is missing or OpenAI errors.',
    'chat context',
    'open',
    'mvp',
    1,
    6
),
(
    'Cloud Pilot',
    'cloud_pilot_chat',
    'Capabilities intent in Type 2 Situation',
    'Add supported EC2 capabilities into Situation + template fallback for "What can you do?" (mvp.md M0b).',
    'chat context',
    'open',
    'mvp',
    1,
    7
),

-- Phase C3 — Workflow-aware Type 2
(
    'Cloud Pilot',
    'cloud_pilot_chat',
    'Pass open request into Situation builder',
    'When an open request exists, pass requestState (action, display_name, missing fields) into Type 2 Situation.',
    'chat context',
    'open',
    'mvp',
    2,
    8
),
(
    'Cloud Pilot',
    'cloud_pilot_chat',
    'Answer waiting-on from request row',
    'Support "What am I waiting on?" from the request row — no LLM guessing.',
    'chat context',
    'open',
    'mvp',
    2,
    9
),

-- Phase C4 — Post-scan summaries (highest demo value)
(
    'Cloud Pilot',
    'cloud_pilot_chat',
    'Build current_facts after scan_ec2',
    'After scan_ec2 success, build current_facts from formatter output for Situation/Knowledge.',
    'chat context',
    'open',
    'mvp',
    1,
    10
),
(
    'Cloud Pilot',
    'cloud_pilot_chat',
    'Load EC2 rule snippets for scan explainers',
    'Load ec2_low_cpu and missing_team_tag snippets from services/knowledge/ec2Rules.js into Knowledge.',
    'chat context',
    'open',
    'mvp',
    1,
    11
),
(
    'Cloud Pilot',
    'cloud_pilot_chat',
    'AI wrap post-scan cloudPilotMessage',
    'When AI enabled, wrap cloudPilotMessage after scan; else use atlasEC2MessageBuilder template. Never send raw Atlas JSON to OpenAI.',
    'chat context',
    'open',
    'mvp',
    1,
    12
),

-- Phase C5 — Knowledge files
(
    'Cloud Pilot',
    'cloud_pilot_chat',
    'Add product knowledge ec2Rules.js',
    'Create services/knowledge/ec2Rules.js with data objects for ec2_low_cpu and ec2_missing_team_tag only (MVP).',
    'chat context',
    'open',
    'mvp',
    2,
    13
),

-- Phase C6 — Org knowledge from database
(
    'Cloud Pilot',
    'cloud_pilot_chat',
    'Org knowledge from database by groupID',
    'Add table or JSON column keyed by groupID; getOrganizationKnowledgeContext reads DB and defaults to {}. Not required for MVP demo.',
    'chat context',
    'open',
    'mvp',
    3,
    14
);
