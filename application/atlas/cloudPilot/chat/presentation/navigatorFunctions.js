const NAVIGATOR_TABLE_VIEW_TYPE = "table";
const NAVIGATOR_COLUMN_TYPES = {
    TEXT: "text",
    CURRENCY: "currency",
    STATUS: "status",
    NUMBER: "number",
    ACTION: "action"
};


/*
 
FUNCTIONS A: All Functions Related to Navigator Responses
	1) Function A1: Create Empty Navigator Data
	2) Function A2: Create Navigator Response
	3) Function A3: Create Empty Navigator Table

FUNCTIONS B: All Navigator Table Column Helper Functions
	1) Function B1: Create Navigator Table Column
	2) Function B2: Normalize Navigator Table Columns
	3) Function B3: Check Supported Navigator Column Type
 
*/

//FUNCTIONS A: All Functions Related to Navigator Responses
//Function A1: Create Empty Navigator Data
function createEmptyNavigatorData() {
    return {
        meta: {},
        stats: [],
        cards: [],
        tables: [],
        alerts: [],
        actions: [],
        raw: null
    };
}

//Function A2: Create Navigator Response
function createNavigatorResponse(options = {}) {
    const data =
        options.data && typeof options.data === "object"
            ? options.data
            : {};

    return {
        success: options.success === true,
        message: options.message || "",
        statusCode: options.statusCode || 200,
        errors: Array.isArray(options.errors) ? options.errors : [],
        currentUser: options.currentUser || null,
        data: {
            ...createEmptyNavigatorData(),
            ...data
        }
    };
}

//Function A3: Create Empty Navigator Table
function createEmptyNavigatorTable(options = {}) {
    return {
        id: options.id || "",
        view_type: NAVIGATOR_TABLE_VIEW_TYPE,
        title: options.title || "",
        columns: normalizeNavigatorTableColumns(options.columns),
        rows: Array.isArray(options.rows) ? options.rows : []
    };
}

//FUNCTIONS B: All Navigator Table Column Helper Functions
//Function B1: Create Navigator Table Column
function createNavigatorTableColumn(options = {}) {
    const column = {
        key: options.key || "",
        label: options.label || ""
    };

    if (isSupportedNavigatorColumnType(options.type)) {
        column.type = options.type;
    }

    if (options.clickable === true) {
        column.clickable = true;
    }

    if (options.detailKey) {
        column.detail_key = options.detailKey;
    }

    return column;
}

//Function B2: Normalize Navigator Table Columns
function normalizeNavigatorTableColumns(columns) {
    if (!Array.isArray(columns)) {
        return [];
    }

    return columns.map((column) => {
        const normalizedColumn = {
            ...column
        };

        if (normalizedColumn.type && !isSupportedNavigatorColumnType(normalizedColumn.type)) {
            delete normalizedColumn.type;
        }

        return normalizedColumn;
    });
}

//Function B3: Check Supported Navigator Column Type
function isSupportedNavigatorColumnType(columnType) {
    return Object.values(NAVIGATOR_COLUMN_TYPES).includes(columnType);
}

//Function B4: Key/value pairs → detail table (tags, metadata, etc.)
function buildKeyValueTable(pairs, options = {}) {
    const rows = Array.isArray(pairs)
        ? pairs.map((pair, index) => {
            const key =
                pair && pair.key != null ? String(pair.key) : "";
            const value =
                pair && pair.value != null ? String(pair.value) : "";

            return {
                row_id: key || "kv_" + index,
                key: key,
                value: value,
                actions: null
            };
        })
        : [];

    return createEmptyNavigatorTable({
        id: options.id || "key_value",
        title: options.title || "",
        columns: [
            createNavigatorTableColumn({
                key: "key",
                label: options.keyLabel || "Key",
                type: NAVIGATOR_COLUMN_TYPES.TEXT
            }),
            createNavigatorTableColumn({
                key: "value",
                label: options.valueLabel || "Value",
                type: NAVIGATOR_COLUMN_TYPES.TEXT
            }),
            createNavigatorTableColumn({
                key: "actions",
                label: options.actionsLabel || "Actions",
                type: NAVIGATOR_COLUMN_TYPES.TEXT
            })
        ],
        rows: rows
    });
}

module.exports = {
    NAVIGATOR_TABLE_VIEW_TYPE,
    NAVIGATOR_COLUMN_TYPES,
    createEmptyNavigatorData,
    createNavigatorResponse,
    createEmptyNavigatorTable,
    createNavigatorTableColumn,
    normalizeNavigatorTableColumns,
    isSupportedNavigatorColumnType,
    buildKeyValueTable
};
