/*
//GOAL: Call Atlas for S3 scan actions
FUNCTIONS A: Atlas S3 Functions
    1) Function A1: Scan S3
*/

const ATLAS_BASE_URL = process.env.ATLAS_BASE_URL || "http://127.0.0.1:8000";

//Function A1: Scan S3
async function scanS3(region) {

    const response = await fetch(ATLAS_BASE_URL + "/scan/s3", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            scan_type: "full",
            region: region,
            rules: []
        })
    });

    if (!response.ok) {
        throw new Error("Atlas S3 scan failed with status " + response.status);
    }

    return await response.json();
}

module.exports = { scanS3 };
