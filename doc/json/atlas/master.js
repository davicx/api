var processMessageOutcome = {
    success: false, 
    cloudPilotMessage: "",
    cloudPilot: {
        intent: null, // e.g. "scan_ec2", "toggle_ec2"
        action: {
            type: null, // e.g. "scan_ec2", "toggle_ec2"
            ready: false, 
            parameters: {}
        },
        state: {
            pendingAction: null, 
            missing: [], 
            collected: {}, 
            asked: {}, 

        }
    },
    atlas: null, 
    error: null 
};

var notSure = {
    pendingAction: "scan_ec2",
    missing: [],
    asked: {},
    collected: {
        region: "us-west-2",
        instanceId: "i-123"
    }
}