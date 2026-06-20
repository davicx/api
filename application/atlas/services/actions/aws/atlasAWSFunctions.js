/*
//GOAL: This is where we call atlas. Atlas interacts and performs AWS Actions
FUNCTIONS A: Atlas AWS Functions
    1) Function A1: Inventory AWS
*/

const ATLAS_BASE_URL = process.env.ATLAS_BASE_URL || "http://127.0.0.1:8000";

//FUNCTIONS A: Atlas AWS
//Function A1: Inventory AWS
async function inventoryAWS() {

    // TODO: Later allow the user or registry defaults to specify regions.
    const response = await fetch(ATLAS_BASE_URL + "/inventory/aws", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            region: "us-west-2",
            services: ["ec2", "s3"]
        })
    });

    if (!response.ok) {
        throw new Error("Atlas AWS inventory failed with status " + response.status);
    }

    return await response.json();
}

module.exports = { inventoryAWS };
