/*
//GOAL: This is where we call atlas. Atlas interacts and performs AWS Actions
FUNCTIONS A: Atlas Scanner Functions
    1) Function A1: Scan EC2
    2) Function A2: Create EC2
*/

const ATLAS_BASE_URL = process.env.ATLAS_BASE_URL || "http://127.0.0.1:8000";

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
    // TEMP: skip HTTP to Atlas (no AWS create yet)
    // const response = await fetch(ATLAS_BASE_URL + "/ec2/create", {
    //     method: "POST",
    //     headers: {
    //         "Content-Type": "application/json"
    //     },
    //     body: JSON.stringify(requestBody)
    // });
    //
    // if (!response.ok) {
    //     throw new Error("Atlas EC2 create failed with status " + response.status);
    // }
    //
    // return await response.json();

    console.log("TEMP (createEC2): requestBody:", JSON.stringify(requestBody, null, 2));
    return {
        success: false,
        data: {},
        message: "TEMP: Atlas EC2 create not called",
        errors: ["temp_atlas_skipped"]
    };
}

module.exports = { scanEC2, createEC2 };
