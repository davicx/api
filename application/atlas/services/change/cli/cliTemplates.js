/*
CLI command templates for change strategies (Mode 2).
MVP: create_ec2 only. Add buildDeleteEc2Cli / etc. when needed.
*/

const CREATE_EC2_AMIS = {
    'us-west-2': 'ami-029a761f237195c2c',
    'us-east-1': 'ami-08e6829e013be2292'
};

function buildCreateEc2Cli(collected) {
    const fields = collected || {};
    const name = pickValue(fields.name, 'production-micro');
    const region = pickValue(fields.region, 'us-west-2');
    const instanceType = pickValue(fields.instance_type, 't3.micro');
    const imageId = pickValue(fields.image_id, CREATE_EC2_AMIS[region] || CREATE_EC2_AMIS['us-west-2']);

    const command = [
        'aws ec2 run-instances \\',
        '  --image-id ' + imageId + ' \\',
        '  --instance-type ' + instanceType + ' \\',
        '  --count 1 \\',
        '  --region ' + region + ' \\',
        "  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=" +
            escapeTagValue(name) +
            "}]'"
    ].join('\n');

    return {
        title: 'Create EC2',
        command: command,
        cloudPilotMessage: [
            'Here are AWS CLI commands to create the EC2 instance you requested.',
            '',
            'This is a generated example for learning and review.',
            'Running these commands will create real AWS resources and may incur charges.',
            '',
            command
        ].join('\n')
    };
}

function pickValue(value, fallback) {
    if (value === null || value === undefined) {
        return fallback;
    }

    const text = String(value).trim();
    if (text === '') {
        return fallback;
    }

    return text;
}

function escapeTagValue(value) {
    return String(value).replace(/'/g, '');
}

module.exports = {
    buildCreateEc2Cli
};
