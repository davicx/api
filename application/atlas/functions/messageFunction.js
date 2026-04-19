/*
TABLE OF CONTENTS

FUNCTIONS A: All Message Helper Functions
    1) Function A1: Check if Message Exists
    2) Function A2: Get Message From
    3) Function A3: Build New Message (from HTTP req)
*/

//Function A1: Check if Message Exists

function buildNewMessage(req) {
    return {
        masterSite: req.body.masterSite || 'kite',
        messageType: req.body.messageType || 'text',
        messageFrom: req.body.messageFrom || req.body.postFrom || req.body.username,
        messageTo: req.body.messageTo || req.body.postTo || 'chat',
        groupID: Number(req.body.groupID || 0),
        conversationID: Number(req.body.conversationID || 0),
        messageCaption: req.body.messageCaption || req.body.message || req.body.postCaption,
        cloudKey: req.body.cloudKey || 'no_cloud_key',
        cloudBucket: req.body.cloudBucket || 'no_cloud_bucket',
        storageType: req.body.storageType || 'local'
    };
}