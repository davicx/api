/*
//GOAL: This is where we call atlas. Atlas interacts and performs AWS Actions
FUNCTIONS A: Atlas Scanner Functions
    1) Function A1: Scan EC2
    2) Function A2: Create EC2
    3) Function A3: Delete EC2
    4) Function A4: Toggle EC2
FUNCTIONS B: Atlas mutation fetch
    1) Function B1: fetchAtlasMutation
*/

const ATLAS_BASE_URL = process.env.ATLAS_BASE_URL || "http://127.0.0.1:8000";

//FUNCTIONS B: Atlas mutation fetch
//Function B1: POST to Atlas; return JSON envelope (success:false is not thrown)
async function fetchAtlasMutation(path, requestBody) {
    let response;

    try {
        response = await fetch(ATLAS_BASE_URL + path, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });
    } catch (fetchError) {
        return {
            success: false,
            message: "Could not reach Atlas.",
            errors: ["atlas_unreachable"],
            data: {}
        };
    }

    let body = null;

    try {
        body = await response.json();
    } catch (parseError) {
        return {
            success: false,
            message: "Atlas returned an invalid response.",
            errors: ["atlas_unreachable"],
            data: {}
        };
    }

    if (body && typeof body.success === "boolean") {
        return body;
    }

    return {
        success: false,
        message: "Atlas EC2 request failed with status " + response.status,
        errors: ["atlas_unreachable"],
        data: {}
    };
}

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
    return fetchAtlasMutation("/ec2/create", requestBody);
}

//Function A3: Delete EC2 (Atlas /ec2/delete)
async function deleteEC2(requestBody) {
    return fetchAtlasMutation("/ec2/delete", requestBody);
}

//Function A4: Toggle EC2 (Atlas /ec2/toggle)
async function toggleEC2(requestBody) {
    return fetchAtlasMutation("/ec2/toggle", requestBody);
}

module.exports = { scanEC2, createEC2, deleteEC2, toggleEC2 };
