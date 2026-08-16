/*
S3 Inventory Search — operation context

Assembles ONE S3InventorySearchContext for this Search TASK.
Internal receives this object today (MVP has no OpenAI path yet).
Same shape as other Search operations so a later provider can share it.
*/

//Function A1: Build S3 Inventory Search context for this operation
function getS3InventorySearchContext(message) {
    return {
        userMessage: String(message || ''),
        task: {
            purpose: [
                'Classify whether the user is asking for S3 inventory truth',
                '(what buckets / how many / show / list) — not an explicit scan action',
                'and not a general-knowledge "what is S3" question.',
                '',
                'Classify only. Do not invent AWS bucket facts.'
            ].join('\n'),
            outputFormat: [
                'Return JSON only:',
                '{"question":"s3_inventory"}',
                'or',
                '{}'
            ].join('\n')
        }
    };
}

module.exports = {
    getS3InventorySearchContext
};
