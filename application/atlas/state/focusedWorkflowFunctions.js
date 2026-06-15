/*
FUNCTIONS A: focused_workflow_id (P2C — in-process per conversation)

    1) Function A1: getFocusedWorkflowId
    2) Function A2: setFocusedWorkflowId
    3) Function A3: clearFocusedWorkflowId

NOTES:
- In-memory only (single Node process). Resets on restart — DB row is still loaded via getOpenActionForConversation.
- Bare "4" / "yes" and field updates target this id when set (England rule for the active turn).
*/

const focusedStore = new Map();

//FUNCTIONS A: focused_workflow_id
//Function A1: Read focused workflow id for a conversation
function getFocusedWorkflowId(conversationID) {
    const key = normalizeConversationKey(conversationID);
    if (!key) {
        return null;
    }

    const stored = focusedStore.get(key);
    const id = Number(stored);

    return Number.isFinite(id) && id > 0 ? id : null;
}

//Function A2: Set focused workflow id for a conversation
function setFocusedWorkflowId(conversationID, workflowId) {
    const key = normalizeConversationKey(conversationID);
    const id = Number(workflowId);

    if (!key || !Number.isFinite(id) || id <= 0) {
        return null;
    }

    focusedStore.set(key, id);
    return id;
}

//Function A3: Clear focused workflow id (no open workflow / stale focus)
function clearFocusedWorkflowId(conversationID) {
    const key = normalizeConversationKey(conversationID);
    if (!key) {
        return;
    }

    focusedStore.delete(key);
}

function normalizeConversationKey(conversationID) {
    const id = Number(conversationID || 0);
    if (!Number.isFinite(id) || id <= 0) {
        return null;
    }
    return String(id);
}

module.exports = {
    getFocusedWorkflowId,
    setFocusedWorkflowId,
    clearFocusedWorkflowId
};
