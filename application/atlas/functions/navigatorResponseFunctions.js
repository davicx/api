const NAVIGATOR_TABLE_VIEW_TYPE = "table";

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

function createEmptyNavigatorTable(options = {}) {
    return {
        id: options.id || "",
        view_type: NAVIGATOR_TABLE_VIEW_TYPE,
        title: options.title || "",
        columns: Array.isArray(options.columns) ? options.columns : [],
        rows: Array.isArray(options.rows) ? options.rows : []
    };
}

module.exports = {
    NAVIGATOR_TABLE_VIEW_TYPE,
    createEmptyNavigatorData,
    createNavigatorResponse,
    createEmptyNavigatorTable
};
