/*
FUNCTIONS A: AI usage chat message
    1) Function A1: buildAiUsageMessage
*/

//Function A1: Template reply for estimated OpenAI spend
function buildAiUsageMessage(summary) {
    const data = summary || {};
    const todayCost = formatUsd(data.today_cost);
    const monthCost = formatUsd(data.month_cost);
    const todayRequests = Number(data.today_requests) || 0;
    const monthRequests = Number(data.month_requests) || 0;
    const averageCost = formatUsd(data.average_request_cost);
    const modelLine = buildModelLine(data);

    if (monthRequests === 0 && todayRequests === 0) {
        return (
            'AI Usage (Estimated OpenAI spend)\n\n' +
            'No OpenAI requests recorded yet.\n\n' +
            'After CloudPilot calls OpenAI, you will see today and month totals here.'
        );
    }

    const lines = [
        'AI Usage (Estimated OpenAI spend)',
        '',
        'Today       ' + todayCost,
        'This Month  ' + monthCost,
        'Requests    ' + monthRequests + ' this month',
        '',
        'The average request this month is ' + averageCost + '.',
        modelLine,
        '',
        'This is CloudPilot’s estimate from each API call — not the OpenAI invoice.'
    ];

    return lines.join('\n');
}

function buildModelLine(data) {
    const models = Array.isArray(data.models) ? data.models : [];
    const primary = data.primary_model || (models[0] && models[0].model) || null;

    if (!primary) {
        return 'Model: unknown';
    }

    if (models.length === 1) {
        return 'Model: ' + primary;
    }

    const others = models
        .slice(1)
        .map(function formatOther(row) {
            return row.model + ' (' + row.request_count + ')';
        })
        .join(', ');

    return 'Model: ' + primary + ' (most used)' + (others ? '; also ' + others : '');
}

function formatUsd(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
        return '$0.00';
    }
    if (n > 0 && n < 0.01) {
        return '$' + n.toFixed(6);
    }
    return '$' + n.toFixed(2);
}

module.exports = {
    buildAiUsageMessage
};
