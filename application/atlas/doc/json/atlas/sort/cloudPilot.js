const cloudPilot = {

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
