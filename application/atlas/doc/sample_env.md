# CloudPilot / API — sample `.env`

Copy these into `api/.env` on another machine. **Fill in secrets locally** — do not commit real keys.

Path: `api/.env` (API process loads this; Atlas reads `process.env` from there).

```env
HELLO = "hiya"
currentMasterUser = "davey"

#LOCATION
#App Location
APP_LOCATION = "local"
#APP_LOCATION = "aws"

#Storage Location
FILE_LOCATION = "local"
#FILE_LOCATION = "aws"


#BUCKET
#AWS_BUCKET_NAME="insta-app-bucket-tutorial"
AWS_BUCKET_NAME="kite-us-west-two"

#FOLDER
PROFILE = "profile"
POSTS = "posts"
GROUPS = "groups"

#REGIONS
AWS_REGION="us-west-2"
AWS_ACCESS_KEY="YOUR_AWS_ACCESS_KEY"
AWS_SECRET_KEY="YOUR_AWS_SECRET_KEY"

#SECRETS
ACCESS_TOKEN_SECRET = "YOUR_ACCESS_TOKEN_SECRET"
REFRESH_TOKEN_SECRET = "YOUR_REFRESH_TOKEN_SECRET"

#API EXTERNAL
OPENAI_API_KEY=YOUR_OPENAI_API_KEY

# ==================================================
# CLOUDPILOT AI
# Front door: cloudPilotIntelligence/CloudPilotIntelligence.js
# Config: application/atlas/config/cloudPilotAIConfig.js
# ==================================================

# MASTER — OFF always wins over every feature below
CLOUDPILOT_AI_ENABLED=false


# ==================================================
# OPENAI SETTINGS (transport / history for live sends)
# ==================================================

OPENAI_SEND_CONVERSATION_HISTORY=true
OPENAI_CONVERSATION_HISTORY_LIMIT=12


# ==================================================
# INDIVIDUAL AI FEATURES (each on/off independently)
# internal = CloudPilot logic
# openai   = OpenAI (only when master is true)
# ==================================================

# Chat/message response (+ Capabilities wording)
CLOUDPILOT_MESSAGE_RESPONSE=internal

# Find AWS region in user message
CLOUDPILOT_REGION_SEARCH=internal

# Find requested action (Internal rules first; optional OpenAI fallback)
CLOUDPILOT_ACTION_SEARCH=internal

# Detect AI spend / OpenAI usage questions (classify only — CloudPilot answers from DB)
CLOUDPILOT_AI_SPEND_SEARCH=internal

# Detect open-requests questions (classify only — CloudPilot answers from request state)
CLOUDPILOT_OPEN_REQUESTS_SEARCH=internal


# ==================================================
# AI TOKEN LIMITS (per feature)
# ==================================================

CLOUDPILOT_MESSAGE_TOKEN_LIMIT=500
CLOUDPILOT_REGION_TOKEN_LIMIT=40
CLOUDPILOT_ACTION_TOKEN_LIMIT=40
CLOUDPILOT_AI_SPEND_TOKEN_LIMIT=40
CLOUDPILOT_OPEN_REQUESTS_TOKEN_LIMIT=40


# ==================================================
# AI LOGGING (each switch is independent — not one LOGS_ON)
# ==================================================

# SEARCH block — how understand classified the message (Region / Action / …)
CLOUDPILOT_SEARCH_LOGS=true

# Verbose message / STEP 7a–7c dumps
CLOUDPILOT_MESSAGE_LOGS=false

# Compact pipeline line: STEP 3 Region Search / Region Found
CLOUDPILOT_REGION_LOGS=true

# Action-search debug
CLOUDPILOT_ACTION_LOGS=false

# INITIAL STATE / FINAL STATE action dumps
CLOUDPILOT_ACTION_STATE_LOGS=false

# Building Identity / Situation / Current Question / Knowledge
CLOUDPILOT_CONTEXT_LOGS=false

# Per-capability OPENAI: <Capability> (Request N) blocks (Preview when AI off)
CLOUDPILOT_OPENAI_LOGS=true

GITHUB_TOKEN=YOUR_GITHUB_TOKEN
GITHUB_OWNER=davicx
GITHUB_REPO=cloudpilot_infrastructure
GITHUB_DEFAULT_BRANCH=cloud_pilot_mvp
```

## Region OpenAI demo

```env
CLOUDPILOT_AI_ENABLED=true
CLOUDPILOT_MESSAGE_RESPONSE=internal
CLOUDPILOT_REGION_SEARCH=openai
CLOUDPILOT_ACTION_SEARCH=internal
CLOUDPILOT_SEARCH_LOGS=true
CLOUDPILOT_REGION_LOGS=true
CLOUDPILOT_OPENAI_LOGS=true
CLOUDPILOT_CONTEXT_LOGS=false
CLOUDPILOT_ACTION_STATE_LOGS=false
CLOUDPILOT_MESSAGE_LOGS=false
```

## Quiet local development (OpenAI off)

```env
CLOUDPILOT_AI_ENABLED=false
CLOUDPILOT_MESSAGE_RESPONSE=internal
CLOUDPILOT_REGION_SEARCH=internal
CLOUDPILOT_ACTION_SEARCH=internal
CLOUDPILOT_SEARCH_LOGS=true
CLOUDPILOT_OPENAI_LOGS=true
CLOUDPILOT_REGION_LOGS=true
CLOUDPILOT_CONTEXT_LOGS=false
CLOUDPILOT_ACTION_STATE_LOGS=false
CLOUDPILOT_MESSAGE_LOGS=false
CLOUDPILOT_ACTION_LOGS=false
```

Restart the API after changing `.env`.

## Secrets checklist

Replace every `YOUR_*` value:

| Variable | Notes |
|----------|--------|
| `OPENAI_API_KEY` | Required for any `openai` feature |
| `AWS_ACCESS_KEY` / `AWS_SECRET_KEY` | AWS / Atlas access |
| `ACCESS_TOKEN_SECRET` / `REFRESH_TOKEN_SECRET` | App JWT secrets |
| `GITHUB_TOKEN` | PR / GitHub strategy demos |

Config is read by `application/atlas/config/cloudPilotAIConfig.js`.

**How-to:** [development/how_to/use_openai_chat.md](./development/how_to/use_openai_chat.md)
