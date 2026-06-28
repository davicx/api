const dayjs = require('dayjs');

/*
FUNCTIONS A: Atlas time formatting
    1) Function A1: formatRelativeTime
    2) Function A2: formatExactTimestamp
    3) Function A3: formatActionRecordKey
    4) Function A4: formatUtcCompactTimestamp
    5) Function A5: formatFriendlyMonthDay
*/

//Function A1: Human-readable relative time for activity tables ("2 hours ago", "Yesterday")
function formatRelativeTime(timestamp, referenceDate) {
    const date = parseTimestamp(timestamp);

    if (!date) {
        return '';
    }

    const now = parseTimestamp(referenceDate) || new Date();
    const diffMs = now.getTime() - date.getTime();

    if (diffMs < 0) {
        return formatExactTimestamp(date);
    }

    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
        return 'Just now';
    }

    if (diffMinutes < 60) {
        return diffMinutes === 1 ? '1 minute ago' : diffMinutes + ' minutes ago';
    }

    if (diffHours < 24 && isSameCalendarDay(date, now)) {
        return diffHours === 1 ? '1 hour ago' : diffHours + ' hours ago';
    }

    if (isYesterday(date, now)) {
        return 'Yesterday';
    }

    if (diffDays < 7) {
        return diffDays === 1 ? '1 day ago' : diffDays + ' days ago';
    }

    if (diffDays < 14) {
        return 'Last week';
    }

    return formatExactTimestamp(date);
}

//Function A2: Exact timestamp for details / hover (ISO-style, local-neutral)
function formatExactTimestamp(timestamp) {
    const date = parseTimestamp(timestamp);

    if (!date) {
        return '';
    }

    return dayjs(date).format('MMM D, YYYY h:mm A');
}

//Function A3: Computer record key — action_name + date + time (no seconds)
//Example: toggle_ec2_may_2_2026_2:00_pm
function formatActionRecordKey(actionName, timestamp) {
    const date = parseTimestamp(timestamp) || new Date();
    const keyActionName = String(actionName || 'change').trim().toLowerCase();
    const month = dayjs(date).format('MMMM').toLowerCase();
    const day = dayjs(date).date();
    const year = dayjs(date).year();
    let hour = dayjs(date).hour();
    const minute = dayjs(date).minute();
    const ampm = hour >= 12 ? 'pm' : 'am';

    hour = hour % 12;

    if (hour === 0) {
        hour = 12;
    }

    const minuteText = minute < 10 ? '0' + minute : String(minute);

    return keyActionName + '_' + month + '_' + day + '_' + year + '_' + hour + ':' + minuteText + '_' + ampm;
}

//Function A4: UTC compact timestamp for display_name_internal — yyyymmdd_hhmmss
function formatUtcCompactTimestamp(timestamp) {
    const date = parseTimestamp(timestamp) || new Date();

    return (
        padNumber(date.getUTCFullYear(), 4) +
        padNumber(date.getUTCMonth() + 1, 2) +
        padNumber(date.getUTCDate(), 2) +
        '_' +
        padNumber(date.getUTCHours(), 2) +
        padNumber(date.getUTCMinutes(), 2) +
        padNumber(date.getUTCSeconds(), 2)
    );
}

//Function A5: Friendly month + day for default request display_name — e.g. June 26
function formatFriendlyMonthDay(timestamp) {
    const date = parseTimestamp(timestamp);

    if (!date) {
        return '';
    }

    return dayjs(date).format('MMMM D');
}

function padNumber(value, length) {
    return String(value).padStart(length, '0');
}

function parseTimestamp(value) {
    if (!value) {
        return null;
    }

    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
}

function isSameCalendarDay(left, right) {
    return (
        left.getFullYear() === right.getFullYear() &&
        left.getMonth() === right.getMonth() &&
        left.getDate() === right.getDate()
    );
}

function isYesterday(date, now) {
    const startOfToday = startOfDay(now);
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    return date >= startOfYesterday && date < startOfToday;
}

function startOfDay(date) {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
}

module.exports = {
    formatRelativeTime,
    formatExactTimestamp,
    formatActionRecordKey,
    formatUtcCompactTimestamp,
    formatFriendlyMonthDay
};
