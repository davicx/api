const cliTemplates = require('./cliTemplates');

/*
CLI EXECUTION — user picked option 2

STEP 7 response only.
MVP: create_ec2 template only. Same pattern as Instructions (action + collected).

FUNCTIONS A: CLI Execution
    1) Function A1: buildCliStrategy
*/

function buildCliStrategy(chatType, actionKey, collected) {
    //STEP 1: Load and Validate Action
    const key = actionKey ? String(actionKey).trim() : '';

    if (!key) {
        return {
            success: false,
            cloudPilotMessage:
                'You chose CLI Commands, but I could not tell which action to generate commands for.',
            chatType: chatType,
            atlasResponse: null,
            error: 'missing_action'
        };
    }

    //STEP 2: Generate CLI Commands
    if (key === 'create_ec2') {
        const cli = cliTemplates.buildCreateEc2Cli(collected || {});

        //STEP 3: Build CLI Response
        return {
            success: true,
            cloudPilotMessage: cli.cloudPilotMessage,
            chatType: chatType,
            atlasResponse: {
                type: 'cli',
                action: key,
                title: cli.title,
                command: cli.command
            },
            error: null
        };
    }

    //STEP 3: Build Missing CLI Response
    return {
        success: false,
        cloudPilotMessage:
            'You chose CLI Commands, but I do not have a CLI template for ' +
            key +
            ' yet.',
        chatType: chatType,
        atlasResponse: null,
        error: 'cli_template_not_found'
    };
}

module.exports = { buildCliStrategy };
