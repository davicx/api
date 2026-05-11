const actionPrompts = {
    create_ec2: {
        requiredFields: [
            "region",
            "instance_type",
            "os"
        ],

        defaults: {
            instance_type: "t2.micro",
            os: "amazon-linux"
        },

        questions: {
            region: "Which AWS region?",
            instance_type: "What instance type would you like?",
            os: "Which OS would you like? (Amazon Linux or Ubuntu)"
        },

        confirmation: {
            title: "CloudPilot is ready to create:"
        },

        tags: {
            "managed-by": "cloudpilot",
            "environment": "demo",
            "delete-me-soon": "true"
        }
    }
};

module.exports = actionPrompts;
