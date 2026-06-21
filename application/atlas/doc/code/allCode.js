/*
CloudPilot code snapshot — capabilities/atlas/

NOT runtime. Read-only copy for navigation. Live source:
  application/atlas/capabilities/atlas/

What this folder is:
  How we POST to Atlas. Shared by scan, change, and inventory capabilities.

Who calls atlasPost (live):
  capabilities/scans/scanEC2.js
  capabilities/scans/scanS3.js
  capabilities/changes/changeEC2.js    ← toggleEC2 wired; createEC2/deleteEC2 in same file
  capabilities/inventory/getAllResources.js ← placeholder
  services/actions/ec2/atlasEC2Functions.js ← legacy create/delete shims

Does NOT call Atlas:
  capabilities/conversation/generalChat.js  ← OpenAI (C6)

Last updated: 2026-06-09
*/

// =============================================================================
// FILE: application/atlas/capabilities/atlas/atlasPost.js
// =============================================================================

const ATLAS_BASE_URL = process.env.ATLAS_BASE_URL || 'http://127.0.0.1:8000';

/*
FUNCTIONS A: Atlas HTTP — POST JSON to Atlas (used by capabilities)
    1) Function A1: atlasPost
*/

//Function A1: POST to Atlas; return JSON envelope (success:false is not thrown)
async function atlasPost(path, requestBody) {
    let response;

    try {
        response = await fetch(ATLAS_BASE_URL + path, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
    } catch (fetchError) {
        return {
            success: false,
            message: 'Could not reach Atlas.',
            errors: ['atlas_unreachable'],
            data: {}
        };
    }

    let body = null;

    try {
        body = await response.json();
    } catch (parseError) {
        return {
            success: false,
            message: 'Atlas returned an invalid response.',
            errors: ['atlas_unreachable'],
            data: {}
        };
    }

    if (body && typeof body.success === 'boolean') {
        return body;
    }

    return {
        success: false,
        message: 'Atlas request failed with status ' + response.status,
        errors: ['atlas_unreachable'],
        data: {}
    };
}

module.exports = { atlasPost };
