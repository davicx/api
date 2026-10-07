const db = require('../../../functions/conn');

/*
FUNCTIONS A: Organization knowledge loader (CloudPilot owns facts)
    1) Function A1: findOrganizationKnowledge
    2) Function A2: loadOrganizationKnowledgeTags
    3) Function A3: formatOrganizationKnowledgeContext
    4) Function A4: loadOrganizationKnowledgeForReference

HELPERS
    1) Helper H1: normalizeMasterSite
    2) Helper H2: normalizeResourceType
    3) Helper H3: normalizeResourceReference
    4) Helper H4: mapKnowledgeRow
    5) Helper H5: queryByResourceName
    6) Helper H6: queryByDisplayName
    7) Helper H7: queryByTag
    8) Helper H8: runQuery

Resolution order (locked):
    1) resource_name
    2) display_name
    3) tag
Stop at first step that returns rows. LIMIT 2 each step for ambiguity.

Doc: doc/development/current/feature_organizational_knowledge.md Step 3
*/

//HELPERS
//Helper H1: Default / clean master_site
function normalizeMasterSite(masterSite) {
    const value = String(masterSite || '').trim();

    if (!value) {
        return 'kite';
    }

    // Message path sometimes uses product label; demo DB uses kite
    if (value.toLowerCase() === 'cloud pilot') {
        return 'kite';
    }

    return value;
}

//Helper H2: Map search knowledgeType → DB resource_type
function normalizeResourceType(resourceType) {
    const value = String(resourceType || '').trim().toLowerCase();

    if (!value || value === 's3' || value === 's3_bucket') {
        return 's3_bucket';
    }

    return value;
}

//Helper H3: Clean reference text from search
function normalizeResourceReference(resourceReference) {
    return String(resourceReference || '').trim();
}

//Helper H4: Map DB row → plain knowledge object (no cost)
function mapKnowledgeRow(row) {
    if (!row) {
        return null;
    }

    return {
        id: row.id,
        masterSite: String(row.master_site || '').trim(),
        resourceType: String(row.resource_type || '').trim(),
        resourceName: String(row.resource_name || '').trim(),
        displayName: row.display_name != null ? String(row.display_name).trim() : '',
        purpose: row.purpose != null ? String(row.purpose).trim() : '',
        notes: row.notes != null ? String(row.notes).trim() : '',
        importance: row.importance != null ? String(row.importance).trim() : '',
        recommendedAction:
            row.recommended_action != null ? String(row.recommended_action).trim() : ''
    };
}

//Helper H5: Lookup by exact AWS resource_name (case-insensitive)
async function queryByResourceName(connection, masterSite, resourceType, resourceReference) {
    return runQuery(
        connection,
        `SELECT
            id,
            master_site,
            resource_type,
            resource_name,
            display_name,
            purpose,
            notes,
            importance,
            recommended_action
         FROM cloudpilot_organization_knowledge
         WHERE master_site = ?
           AND resource_type = ?
           AND LOWER(resource_name) = LOWER(?)
         LIMIT 2`,
        [masterSite, resourceType, resourceReference]
    );
}

//Helper H6: Lookup by friendly display_name
async function queryByDisplayName(connection, masterSite, resourceType, resourceReference) {
    return runQuery(
        connection,
        `SELECT
            id,
            master_site,
            resource_type,
            resource_name,
            display_name,
            purpose,
            notes,
            importance,
            recommended_action
         FROM cloudpilot_organization_knowledge
         WHERE master_site = ?
           AND resource_type = ?
           AND LOWER(display_name) = LOWER(?)
         LIMIT 2`,
        [masterSite, resourceType, resourceReference]
    );
}

//Helper H7: Lookup by human tag / alias
async function queryByTag(connection, masterSite, resourceType, resourceReference) {
    return runQuery(
        connection,
        `SELECT
            ok.id,
            ok.master_site,
            ok.resource_type,
            ok.resource_name,
            ok.display_name,
            ok.purpose,
            ok.notes,
            ok.importance,
            ok.recommended_action
         FROM cloudpilot_organization_knowledge ok
         INNER JOIN cloudpilot_organization_knowledge_tags okt
             ON okt.organization_knowledge_id = ok.id
         WHERE ok.master_site = ?
           AND ok.resource_type = ?
           AND LOWER(okt.tag) = LOWER(?)
         LIMIT 2`,
        [masterSite, resourceType, resourceReference]
    );
}

//Helper H8: Promise wrapper for mysql query
function runQuery(connection, queryString, params) {
    return new Promise(function (resolve, reject) {
        connection.query(queryString, params, function (err, results) {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
}

//FUNCTIONS A: Organization knowledge loader
//Function A1: Resolve one reference → found | ambiguous | not_found
async function findOrganizationKnowledge(masterSite, resourceType, resourceReference) {
    const site = normalizeMasterSite(masterSite);
    const type = normalizeResourceType(resourceType);
    const reference = normalizeResourceReference(resourceReference);

    const outcome = {
        status: 'not_found',
        matchedBy: null,
        record: null,
        records: [],
        tags: [],
        masterSite: site,
        resourceType: type,
        resourceReference: reference,
        error: null
    };

    if (!reference) {
        outcome.status = 'invalid';
        return outcome;
    }

    const connection = db.getConnection();

    try {
        //STEP 1: resource_name
        const byNameRows = await queryByResourceName(connection, site, type, reference);
        if (byNameRows && byNameRows.length > 0) {
            return buildFindOutcome(outcome, 'resource_name', byNameRows);
        }

        //STEP 2: display_name
        const byDisplayRows = await queryByDisplayName(connection, site, type, reference);
        if (byDisplayRows && byDisplayRows.length > 0) {
            return buildFindOutcome(outcome, 'display_name', byDisplayRows);
        }

        //STEP 3: tag
        const byTagRows = await queryByTag(connection, site, type, reference);
        if (byTagRows && byTagRows.length > 0) {
            return buildFindOutcome(outcome, 'tag', byTagRows);
        }

        return outcome;
    } catch (err) {
        console.log('findOrganizationKnowledge failed', err);
        outcome.status = 'error';
        outcome.error = err && err.message ? err.message : String(err);
        return outcome;
    }
}

function buildFindOutcome(baseOutcome, matchedBy, rows) {
    const records = [];

    for (let i = 0; i < rows.length; i++) {
        const mapped = mapKnowledgeRow(rows[i]);
        if (mapped) {
            records.push(mapped);
        }
    }

    baseOutcome.matchedBy = matchedBy;
    baseOutcome.records = records;

    if (records.length >= 2) {
        baseOutcome.status = 'ambiguous';
        baseOutcome.record = null;
        return baseOutcome;
    }

    if (records.length === 1) {
        baseOutcome.status = 'found';
        baseOutcome.record = records[0];
        return baseOutcome;
    }

    baseOutcome.status = 'not_found';
    return baseOutcome;
}

//Function A2: Load tags for one knowledge row
async function loadOrganizationKnowledgeTags(organizationKnowledgeId) {
    const knowledgeId = Number(organizationKnowledgeId);

    if (!Number.isFinite(knowledgeId) || knowledgeId < 1) {
        return [];
    }

    const connection = db.getConnection();

    try {
        const rows = await runQuery(
            connection,
            `SELECT tag
             FROM cloudpilot_organization_knowledge_tags
             WHERE organization_knowledge_id = ?
             ORDER BY tag ASC`,
            [knowledgeId]
        );

        const tags = [];

        for (let i = 0; i < rows.length; i++) {
            const tag = rows[i] && rows[i].tag != null ? String(rows[i].tag).trim() : '';
            if (tag) {
                tags.push(tag);
            }
        }

        return tags;
    } catch (err) {
        console.log('loadOrganizationKnowledgeTags failed', err);
        return [];
    }
}

//Function A3: Format Chat context block from a find outcome (facts only; no cost)
function formatOrganizationKnowledgeContext(findOutcome) {
    const outcome = findOutcome || {};

    if (outcome.status === 'ambiguous') {
        const names = [];
        const records = Array.isArray(outcome.records) ? outcome.records : [];

        for (let i = 0; i < records.length; i++) {
            if (records[i] && records[i].resourceName) {
                names.push(records[i].resourceName);
            }
        }

        return [
            'Organization S3 Knowledge',
            '',
            'Ambiguous match for "' + String(outcome.resourceReference || '') + '".',
            'Matched resources: ' + (names.length ? names.join(', ') : 'multiple'),
            'Ask the user which resource they mean. Do not invent org facts.'
        ].join('\n');
    }

    if (outcome.status !== 'found' || !outcome.record) {
        return '';
    }

    const record = outcome.record;
    const tags = Array.isArray(outcome.tags) ? outcome.tags : [];
    const lines = [
        'Organization S3 Knowledge',
        '',
        'resource_name: ' + record.resourceName,
        'display_name: ' + (record.displayName || '—'),
        'purpose: ' + (record.purpose || '—'),
        'notes: ' + (record.notes || '—'),
        'importance: ' + (record.importance || '—'),
        'recommended_action: ' + (record.recommendedAction || '—')
    ];

    if (tags.length > 0) {
        lines.push('tags: ' + tags.join(', '));
    }

    lines.push('');
    lines.push(
        'Use only these organizational facts. Do not invent purpose or importance.'
    );
    lines.push('Live AWS cost/state (if any) comes from scan data — not from this block.');

    return lines.join('\n');
}

//Function A4: Find + attach tags + context string for Chat
async function loadOrganizationKnowledgeForReference(
    masterSite,
    resourceType,
    resourceReference
) {
    const findOutcome = await findOrganizationKnowledge(
        masterSite,
        resourceType,
        resourceReference
    );

    if (findOutcome.status === 'found' && findOutcome.record && findOutcome.record.id) {
        findOutcome.tags = await loadOrganizationKnowledgeTags(findOutcome.record.id);
    }

    findOutcome.contextBlock = formatOrganizationKnowledgeContext(findOutcome);

    return findOutcome;
}

module.exports = {
    findOrganizationKnowledge,
    loadOrganizationKnowledgeTags,
    formatOrganizationKnowledgeContext,
    loadOrganizationKnowledgeForReference,
    normalizeResourceType
};
