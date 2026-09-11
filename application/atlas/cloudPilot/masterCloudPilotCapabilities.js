const scanEC2Handler = require('./scans/ec2/scanEC2Handler');
const scanS3Handler = require('./scans/s3/scanS3Handler');
const toggleEC2Handler = require('./actions/toggleEC2/toggleEC2Handler');
const createEC2Handler = require('./actions/createEC2/createEC2Handler');
const deleteEC2Handler = require('./actions/deleteEC2/deleteEC2Handler');
const pauseEC2Handler = require('./actions/pauseEC2/pauseEC2Handler');
const resumeEC2Handler = require('./actions/resumeEC2/resumeEC2Handler');
const updateEC2TagHandler = require('./actions/updateEC2Tag/updateEC2TagHandler');
const inventoryAWSHandler = require('./scans/inventory/inventoryAWSHandler');
const billingAWSHandler = require('./scans/billing/billingAWSHandler');
const showAiUsageHandler = require('./scans/aiUsage/showAiUsageHandler');
const showCapabilitiesHandler = require('./capabilities/showCapabilitiesHandler');

/*
What this file answers:

* What actions exist? (MASTER APPLICATION SOURCE OF TRUTH)
* How are actions detected? (match rules — used by cloudPilotIntelligence/understand/search/searchMessageForAction.js)
* What handler runs when an action executes? (executionFunction — called via executions/functions/runAction.js)
* What facts can CloudPilot claim after a capability runs? (capability.cloudPilotCanAnswer — model projection)

File: masterCloudPilotCapabilities.js (formerly actionMap.js)

Examples: scan_ec2, toggle_ec2, create_ec2, delete_ec2, pause_ec2, resume_ec2, inventory_aws, show_billing, show_ai_usage, scan_s3, show_capabilities, general_chat

Model-facing projection: cloudPilotIntelligence/context/contextTypes/cloudPilotCapabilitiesContext.js
Do not dump match / executionFunction / messages into model context.
*/

/*
===============================================================================
CANONICAL STATIC ACTION DEFINITIONS
===============================================================================

This file is the central action map for CloudPilot action definitions.

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

const actionMap = {

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
        executionFunction: inventoryAWSHandler,

        //Capability discovery (optional presentation for show_capabilities)
        capability: {
            section: 'Explore AWS',
            description: 'Inventory your AWS resources'
        },

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

    //SERVICE: AWS
    //Action: AWS Billing summary
    show_billing: {
        //Identity
        type: 'show_billing',
        actionLabel: 'AWS Billing',

        //Policy
        allowed: true,

        //Orchestration
        actionTier: 'informational',
        requiresWorkflow: false,
        requiresExecution: true,

        //Intent Detection
        match: (text) =>
            text.includes('show my billing') ||
            text.includes('show my aws bill') ||
            text.includes('show aws billing') ||
            text.includes('why is my aws bill') ||
            text.includes('why is my bill so high') ||
            text.includes('where is my money going') ||
            text.includes('what am i being charged'),

        //Fields Required Before Ready
        requiredFields: [],

        //Optional Defaults
        defaults: {
            period_days: 30
        },

        //Execution
        executionFunction: billingAWSHandler,

        //Capability discovery (optional presentation for show_capabilities)
        capability: {
            section: 'Explore AWS',
            description: 'Review AWS billing'
        },

        //User-Facing System Messages
        messages: {
            started: 'Preparing AWS billing summary.',
            missingFields: {},
            ready: 'Everything is ready for AWS billing.',
            executing: 'Loading AWS billing.',
            success: 'Here is your AWS billing summary.',
            failed: 'AWS billing summary failed.'
        }
    },

    //SERVICE: CloudPilot
    //Action: OpenAI / AI usage summary (local cloud_pilot_ai_usage table — not AWS)
    show_ai_usage: {
        //Identity
        type: 'show_ai_usage',
        actionLabel: 'AI Usage',

        //Policy
        allowed: true,

        //Orchestration
        actionTier: 'informational',
        requiresWorkflow: false,
        requiresExecution: true,

        // Not an Action (toggle_ec2, …). Detected as Question via searchForAiSpend → question=ai_spend.
        // match kept empty so actionMap rules do not treat spend questions as actions.
        match: () => false,

        //Fields Required Before Ready
        requiredFields: [],

        //Optional Defaults
        defaults: {},

        //Execution
        executionFunction: showAiUsageHandler,

        //Capability discovery (optional presentation for show_capabilities)
        capability: {
            section: 'CloudPilot',
            description: 'View OpenAI usage'
        },

        //User-Facing System Messages
        messages: {
            started: 'Checking OpenAI usage.',
            missingFields: {},
            ready: 'Everything is ready for AI usage.',
            executing: 'Loading AI usage.',
            success: 'Here is your estimated OpenAI spend.',
            failed: 'AI usage summary failed.'
        }
    },

    //SERVICE: CloudPilot
    //Action: Show what CloudPilot can do (live actionMap catalog)
    show_capabilities: {
        //Identity
        type: 'show_capabilities',
        actionLabel: 'Show Capabilities',

        //Policy
        allowed: true,

        //Orchestration
        actionTier: 'informational',
        requiresWorkflow: false,
        requiresExecution: true,

        //Intent Detection — avoid bare "help" so "help me create ec2" stays create_ec2
        match: (text) => {
            const normalized = String(text || '').toLowerCase().trim();

            if (
                normalized === 'help' ||
                normalized === 'help?' ||
                normalized === 'help!'
            ) {
                return true;
            }

            return (
                normalized.includes('what can you do') ||
                normalized.includes('what do you do') ||
                normalized.includes('what are your capabilities') ||
                normalized.includes('what can cloudpilot do') ||
                normalized.includes('what services do you support') ||
                normalized.includes('what do you support') ||
                normalized.includes('show capabilities') ||
                normalized.includes('list capabilities')
            );
        },

        //Fields Required Before Ready
        requiredFields: [],

        //Optional Defaults
        defaults: {},

        //Execution
        executionFunction: showCapabilitiesHandler,

        //User-Facing System Messages
        messages: {
            started: 'Preparing CloudPilot capabilities.',
            missingFields: {},
            ready: 'Everything is ready for capabilities.',
            executing: 'Loading capabilities.',
            success: 'Here is how CloudPilot can help you today.',
            failed: 'Capabilities summary failed.'
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
        match: (text) => matchesScanEC2Intent(text),

        //Fields Required Before Ready
        requiredFields: [
            'region'
        ],

        //Optional Defaults
        defaults: {},

        //Execution
        executionFunction: scanEC2Handler,

        //Capability discovery (optional presentation for show_capabilities)
        // cloudPilotCanAnswer = truthful facts after AWS → Atlas → formatter → conversation
        capability: {
            section: 'Explore AWS',
            description: 'Scan EC2 instances for issues',
            cloudPilotCanAnswer: [
                'instance identity and name',
                'instance state',
                'instance type',
                'tags',
                'region',
                'average CPU utilization',
                'estimated On-Demand compute cost when a stored rate exists'
            ],
            scope: 'Regional. Default MVP region: us-west-2.'
        },

        //User-Facing System Messages
        messages: {
            started: 'Preparing EC2 scan.',
            missingFields: {},
            ready: 'Everything is ready for the EC2 scan.',
            executing: 'Running EC2 scan.',
            success: 'EC2 scan completed.',
            failed: 'EC2 scan failed.'
        }
    },

    //SERVICE: S3
    //Action: Scan S3
    scan_s3: {
        //Identity
        type: 'scan_s3',
        actionLabel: 'Scan S3',

        //Policy
        allowed: true,

        //Orchestration
        actionTier: 'informational',
        requiresWorkflow: true,
        requiresExecution: false,

        //Intent Detection
        match: (text) => matchesScanS3Intent(text),

        //Fields Required Before Ready
        requiredFields: [
            'region'
        ],

        //Optional Defaults
        defaults: {},

        //Execution
        executionFunction: scanS3Handler,

        //Capability discovery (optional presentation for show_capabilities)
        // cloudPilotCanAnswer = truthful facts after AWS → Atlas → formatter → conversation
        capability: {
            section: 'Explore AWS',
            description: 'Scan S3 buckets',
            cloudPilotCanAnswer: [
                'bucket names',
                'tags',
                'bucket region',
                'default encryption',
                'versioning',
                'public access signals',
                'lifecycle rules',
                'access logging'
            ],
            scope: 'Account-wide bucket inventory.'
        },

        //User-Facing System Messages
        messages: {
            started: 'Preparing S3 scan.',
            missingFields: {},
            ready: 'Everything is ready for the S3 scan.',
            executing: 'Running S3 scan.',
            success: 'S3 scan completed.',
            failed: 'S3 scan failed.'
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

        //Change strategies (destructive actions only; scan/inventory skip this)
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
        executionFunction: toggleEC2Handler,

        //Capability discovery (optional presentation for show_capabilities)
        capability: {
            section: 'Manage EC2',
            description: 'Switch between primary and secondary instances'
        },

        //User-Facing System Messages
        messages: {
            started: 'Preparing EC2 toggle.',
            missingFields: {},
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

        //Change strategies (destructive actions only; scan/inventory skip this)
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
        executionFunction: createEC2Handler,

        //Capability discovery (optional presentation for show_capabilities)
        capability: {
            section: 'Manage EC2',
            description: 'Create EC2 instances'
        },

        //User-Facing System Messages
        messages: {
            started: 'Preparing EC2 create.',
            missingFields: {},
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

        //Change strategies (destructive actions only; scan/inventory skip this)
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
        executionFunction: deleteEC2Handler,

        //Capability discovery (optional presentation for show_capabilities)
        capability: {
            section: 'Manage EC2',
            description: 'Delete EC2 instances'
        },

        //User-Facing System Messages
        messages: {
            started: 'Preparing EC2 delete.',
            missingFields: {},
            ready: 'Everything is ready for the EC2 delete.',
            executing: 'Terminating EC2 instance.',
            success: 'EC2 instance termination requested.',
            failed: 'EC2 delete failed.'
        }
    },

    //SERVICE: EC2
    //Action: Update EC2 tag (Phase G golden path)
    update_ec2_tag: {
        //Identity
        type: 'update_ec2_tag',
        actionLabel: 'Update EC2 Tag',

        //Policy
        allowed: true,

        //Orchestration
        actionTier: 'destructive',
        requiresWorkflow: true,
        requiresExecution: false,

        //Change strategies (destructive actions only)
        executionModes: [
            'instructions',
            'cli',
            'pr',
            'automatic'
        ],

        //Intent Detection
        match: (text) => {
            const normalized = String(text || '').toLowerCase();
            if (normalized.includes('update') && normalized.includes('tag') && normalized.includes('ec2')) {
                return true;
            }
            if (normalized.includes('update') && normalized.includes('tag') && normalized.includes('instance')) {
                return true;
            }
            if (normalized.includes('update') && normalized.includes('cloudpilot-test')) {
                return true;
            }
            if (normalized.includes('update ec2 tag')) {
                return true;
            }
            return false;
        },

        //Fields Required Before Ready (tag_key defaults to CloudPilot-Test)
        requiredFields: [
            'region',
            'instance_id',
            'tag_key',
            'tag_value'
        ],

        //Optional Defaults
        defaults: {
            tag_key: 'CloudPilot-Test'
        },

        //Execution
        executionFunction: updateEC2TagHandler,

        //Capability discovery (optional presentation for show_capabilities)
        capability: {
            section: 'Manage EC2',
            description: 'Update EC2 tags'
        },

        //User-Facing System Messages
        messages: {
            started: 'Preparing EC2 tag update.',
            missingFields: {},
            ready: 'Everything is ready for the EC2 tag update.',
            executing: 'Updating EC2 tag.',
            success: 'EC2 tag updated.',
            failed: 'EC2 tag update failed.'
        }
    },

    //SERVICE: EC2
    //Action: Pause EC2 (AWS StopInstances)
    pause_ec2: {
        //Identity
        type: 'pause_ec2',
        actionLabel: 'Pause EC2',

        //Policy
        allowed: true,

        //Orchestration
        actionTier: 'destructive',
        requiresWorkflow: true,
        requiresExecution: false,

        //Change strategies — no PR for pause/resume
        executionModes: [
            'instructions',
            'cli',
            'automatic'
        ],

        //Intent Detection
        match: (text) => {
            const normalized = String(text || '').toLowerCase();

            if (
                normalized.includes('delete') ||
                normalized.includes('terminate') ||
                normalized.includes('toggle') ||
                normalized.includes('switch')
            ) {
                return false;
            }

            if (normalized.includes('pause')) {
                return true;
            }

            if (
                normalized.includes('stop') &&
                (normalized.includes('ec2') || normalized.includes('instance'))
            ) {
                return true;
            }

            return false;
        },

        //Fields Required Before Ready
        requiredFields: [
            'region',
            'instance_id'
        ],

        // Verify target exists in Atlas before execution-mode speech
        // Doc: doc/development/finished/feature_verify_request.md
        verifyResource: {
            resourceType: 'ec2',
            regionField: 'region',
            scanAction: 'scan_ec2',
            targets: [
                { idField: 'instance_id' }
            ]
        },

        //Optional Defaults
        defaults: {},

        //Execution
        executionFunction: pauseEC2Handler,

        //Capability discovery (optional presentation for show_capabilities)
        capability: {
            section: 'Manage EC2',
            description: 'Pause (stop) one EC2 instance'
        },

        //User-Facing System Messages
        messages: {
            started: 'Preparing to pause an EC2 instance.',
            missingFields: {},
            ready: 'Everything is ready to pause the EC2 instance.',
            executing: 'Pausing EC2 instance.',
            success: 'EC2 instance paused.',
            failed: 'EC2 pause failed.'
        }
    },

    //SERVICE: EC2
    //Action: Resume EC2 (AWS StartInstances)
    resume_ec2: {
        //Identity
        type: 'resume_ec2',
        actionLabel: 'Resume EC2',

        //Policy
        allowed: true,

        //Orchestration
        actionTier: 'destructive',
        requiresWorkflow: true,
        requiresExecution: false,

        //Change strategies — no PR for pause/resume
        executionModes: [
            'instructions',
            'cli',
            'automatic'
        ],

        //Intent Detection
        match: (text) => {
            const normalized = String(text || '').toLowerCase();

            if (
                normalized.includes('create') ||
                normalized.includes('toggle') ||
                normalized.includes('switch')
            ) {
                return false;
            }

            if (normalized.includes('resume')) {
                return true;
            }

            if (
                normalized.includes('start') &&
                (normalized.includes('ec2') || normalized.includes('instance'))
            ) {
                return true;
            }

            return false;
        },

        //Fields Required Before Ready
        requiredFields: [
            'region',
            'instance_id'
        ],

        // Verify target exists in Atlas before execution-mode speech
        // Doc: doc/development/finished/feature_verify_request.md
        verifyResource: {
            resourceType: 'ec2',
            regionField: 'region',
            scanAction: 'scan_ec2',
            targets: [
                { idField: 'instance_id' }
            ]
        },

        //Optional Defaults
        defaults: {},

        //Execution
        executionFunction: resumeEC2Handler,

        //Capability discovery (optional presentation for show_capabilities)
        capability: {
            section: 'Manage EC2',
            description: 'Resume (start) one EC2 instance'
        },

        //User-Facing System Messages
        messages: {
            started: 'Preparing to resume an EC2 instance.',
            missingFields: {},
            ready: 'Everything is ready to resume the EC2 instance.',
            executing: 'Resuming EC2 instance.',
            success: 'EC2 instance resumed.',
            failed: 'EC2 resume failed.'
        }
    }
};

/*
Natural S3 data questions reuse scan_s3.

General knowledge ("what is S3?" / "what is a bucket?") stays General Chat.
Named-bucket purpose ("what is this bucket for?") stays org knowledge.
Account/current-data questions ("what buckets do I have?") require a real scan.
*/
function matchesScanS3Intent(message) {
    const text = String(message || '').toLowerCase().trim();

    if (!text) {
        return false;
    }

    if (isS3DefinitionQuestion(text)) {
        return false;
    }

    const mentionsS3 = /\bs3\b/.test(text);
    const mentionsBuckets = /\bbuckets\b/.test(text);

    if (!mentionsS3 && !mentionsBuckets) {
        return false;
    }

    // Existing explicit command
    if (/\bscan\b/.test(text) && mentionsS3) {
        return true;
    }

    const asksForOwnedData =
        /\b(my|our)\s+(s3\s+)?buckets\b/.test(text) ||
        /\b(my|our)\s+s3\b/.test(text) ||
        /\b(do|does)\s+(i|we)\s+have\b/.test(text) ||
        /\b(in\s+my|in\s+our)\s+(aws\s+)?account\b/.test(text);

    const asksToInspect =
        /\b(show|list|find|display)\b/.test(text) ||
        /\bhow\s+many\b/.test(text) ||
        /\b(what|which)\s+(s3\s+)?buckets\b/.test(text) ||
        /\b(any|are)\s+(s3\s+)?buckets\b/.test(text);

    return (
        asksToInspect &&
        (
            asksForOwnedData ||
            /\bhow\s+many\b/.test(text) ||
            /\b(show|list|find|display)\b/.test(text)
        )
    );
}

function isS3DefinitionQuestion(text) {
    return (
        /\bwhat\s+is\s+(an?\s+)?s3\b/.test(text) ||
        /\bwhat\s+is\s+(an?\s+)?s3\s+bucket\b/.test(text) ||
        /\bwhat\s+is\s+a\s+bucket\b/.test(text)
    );
}

/*
Natural EC2 data questions reuse scan_ec2.

General knowledge ("what is an EC2 instance?") stays General Chat.
Account/current-data questions ("how many do I have?") require a real scan.
*/
function matchesScanEC2Intent(message) {
    const text = String(message || '').toLowerCase().trim();

    if (!text || !/\bec2\b/.test(text)) {
        return false;
    }

    // Existing explicit command
    if (/\bscan\b/.test(text)) {
        return true;
    }

    const mentionsInstances = /\b(instances?|servers?)\b/.test(text);

    if (!mentionsInstances) {
        return false;
    }

    const asksForOwnedData =
        /\b(my|our)\s+(ec2\s+)?(instances?|servers?)\b/.test(text) ||
        /\b(do|does)\s+(i|we)\s+have\b/.test(text) ||
        /\b(in\s+my|in\s+our)\s+(aws\s+)?account\b/.test(text);

    const asksToInspect =
        /\b(show|list|find|display)\b/.test(text) ||
        /\bhow\s+many\b/.test(text) ||
        /\b(what|which)\s+ec2\s+(instances?|servers?)\b/.test(text) ||
        /\b(any|are)\s+ec2\s+(instances?|servers?)\b/.test(text);

    const asksForCurrentState =
        /\b(running|stopped|pending|terminated|active)\b/.test(text);

    return (
        asksToInspect &&
        (
            asksForOwnedData ||
            asksForCurrentState ||
            /\bhow\s+many\b/.test(text) ||
            /\b(show|list|find|display)\b/.test(text)
        )
    );
}

function actionRequiresExecutionModeSelection(actionDefinition) {
    return Boolean(
        actionDefinition &&
        Array.isArray(actionDefinition.executionModes) &&
        actionDefinition.executionModes.length > 0
    );
}

module.exports = actionMap;

Object.defineProperty(module.exports, 'actionRequiresExecutionModeSelection', {
    value: actionRequiresExecutionModeSelection,
    enumerable: false
});

Object.defineProperty(module.exports, 'matchesScanEC2Intent', {
    value: matchesScanEC2Intent,
    enumerable: false
});

Object.defineProperty(module.exports, 'matchesScanS3Intent', {
    value: matchesScanS3Intent,
    enumerable: false
});
