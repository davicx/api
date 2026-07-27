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
# ==================================================

# MASTER
# false = all CloudPilot GenAI features are disabled.
# Master OFF always wins over individual settings.
CLOUDPILOT_AI_ENABLED=false


# ==================================================
# OPENAI SETTINGS
# ==================================================

OPENAI_SEND_CONVERSATION_HISTORY=true
OPENAI_CONVERSATION_HISTORY_LIMIT=12


# ==================================================
# INDIVIDUAL AI FEATURES
# internal = CloudPilot logic
# openai   = OpenAI implementation
# ==================================================

# Chat/message response
CLOUDPILOT_MESSAGE_RESPONSE=internal

# Find AWS region in user message
CLOUDPILOT_REGION_SEARCH=internal

# Find requested action in user message
CLOUDPILOT_ACTION_SEARCH=internal


# ==================================================
# AI TOKEN LIMITS
# ==================================================
# Maximum tokens OpenAI may generate for each feature

CLOUDPILOT_MESSAGE_TOKEN_LIMIT=500
CLOUDPILOT_REGION_TOKEN_LIMIT=40
CLOUDPILOT_ACTION_TOKEN_LIMIT=40


# ==================================================
# AI LOGGING
# ==================================================

CLOUDPILOT_MESSAGE_LOGS=false
CLOUDPILOT_REGION_LOGS=false
CLOUDPILOT_ACTION_LOGS=false

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
CLOUDPILOT_REGION_LOGS=true
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
