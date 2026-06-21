const ATLAS_BASE_URL = process.env.ATLAS_BASE_URL || 'http://127.0.0.1:8000';

/*
What this file answers:

* Where does Atlas HTTP happen?

This is the WHERE layer. All Atlas capabilities (scans, changes, inventory)
eventually call atlasPost() to POST JSON to Atlas.

See doc/development/action_map.md and doc/code/allCode.js (snapshot).
*/

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
