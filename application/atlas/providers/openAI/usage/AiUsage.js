const db = require('../../../../functions/conn');

/*
METHODS A: ai_usage persistence + summary
    1) Method A1: createUsage
    2) Method A2: getUsageSummary

Doc: doc/development/current/ai_usage.md
*/

class AiUsage {

    //Method A1: Insert one row after a successful OpenAI call
    static async createUsage(row) {
        const connection = db.getConnection();
        const data = row || {};

        const outcome = {
            success: false,
            usageId: null,
            errors: []
        };

        try {
            const insertResults = await runQuery(
                connection,
                `INSERT INTO ai_usage (
                    organization_id,
                    conversation_id,
                    request_id,
                    feature,
                    model,
                    input_tokens,
                    output_tokens,
                    total_tokens,
                    estimated_cost
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    nullableString(data.organizationId),
                    nullableString(data.conversationId),
                    nullableString(data.requestId),
                    nullableString(data.feature),
                    String(data.model || '').trim(),
                    Number(data.inputTokens) || 0,
                    Number(data.outputTokens) || 0,
                    Number(data.totalTokens) || 0,
                    Number(data.estimatedCost) || 0
                ]
            );

            outcome.success = true;
            outcome.usageId = insertResults.insertId;
            return outcome;
        } catch (err) {
            console.log('AiUsage.createUsage failed', err);
            outcome.errors.push(err);
            return outcome;
        }
    }

    //Method A2: Today + this month aggregates (optional organization filter)
    static async getUsageSummary(options) {
        const connection = db.getConnection();
        const organizationId = options && options.organizationId
            ? String(options.organizationId).trim()
            : '';

        const outcome = {
            success: false,
            data: null,
            errors: []
        };

        try {
            const orgClause = organizationId ? ' AND organization_id = ?' : '';
            const orgParams = organizationId ? [organizationId] : [];

            const todayRows = await runQuery(
                connection,
                `SELECT
                    COALESCE(SUM(estimated_cost), 0) AS total_cost,
                    COUNT(*) AS request_count
                 FROM ai_usage
                 WHERE DATE(created_at) = CURRENT_DATE` + orgClause,
                orgParams
            );

            const monthRows = await runQuery(
                connection,
                `SELECT
                    COALESCE(SUM(estimated_cost), 0) AS total_cost,
                    COUNT(*) AS request_count,
                    COALESCE(AVG(estimated_cost), 0) AS average_cost
                 FROM ai_usage
                 WHERE YEAR(created_at) = YEAR(CURRENT_DATE)
                   AND MONTH(created_at) = MONTH(CURRENT_DATE)` + orgClause,
                orgParams
            );

            const modelRows = await runQuery(
                connection,
                `SELECT model, COUNT(*) AS request_count
                 FROM ai_usage
                 WHERE YEAR(created_at) = YEAR(CURRENT_DATE)
                   AND MONTH(created_at) = MONTH(CURRENT_DATE)` + orgClause + `
                 GROUP BY model
                 ORDER BY request_count DESC, model ASC`,
                orgParams
            );

            const today = todayRows[0] || {};
            const month = monthRows[0] || {};
            const models = (modelRows || []).map(function mapModelRow(row) {
                return {
                    model: String(row.model || '').trim(),
                    request_count: Number(row.request_count) || 0
                };
            }).filter(function hasModel(row) {
                return row.model !== '';
            });

            outcome.success = true;
            outcome.data = {
                today_cost: roundMoney(today.total_cost),
                month_cost: roundMoney(month.total_cost),
                today_requests: Number(today.request_count) || 0,
                month_requests: Number(month.request_count) || 0,
                average_request_cost: roundMoney(month.average_cost),
                models: models,
                primary_model: models.length ? models[0].model : null
            };
            return outcome;
        } catch (err) {
            console.log('AiUsage.getUsageSummary failed', err);
            outcome.errors.push(err);
            return outcome;
        }
    }
}

function nullableString(value) {
    if (value === undefined || value === null) {
        return null;
    }
    const text = String(value).trim();
    return text === '' ? null : text;
}

function roundMoney(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
        return 0;
    }
    return Math.round(n * 1e6) / 1e6;
}

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

module.exports = AiUsage;
