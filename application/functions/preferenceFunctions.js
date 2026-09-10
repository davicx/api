/*
FUNCTIONS A: User Preference helpers
	1) Function A1: Normalize / validate preference input
	2) Function A2: Default clothing category
	3) Function A3: Ownership check
*/

const TITLE_MAX = 150;
const DESCRIPTION_MAX = 500;
const CATEGORY_MAX = 100;
const DEFAULT_CATEGORY = 'clothing';

function defaultPreferenceCategory() {
	return DEFAULT_CATEGORY;
}

function trimOrEmpty(value) {
	if (value == null) {
		return '';
	}
	return String(value).trim();
}

/**
 * Normalize create/edit body fields.
 * @returns {{ ok: boolean, errors: string[], preference: object }}
 */
function normalizePreferenceInput(body, options) {
	const opts = options || {};
	const requireTitle = opts.requireTitle !== false;

	const preferenceCategory = trimOrEmpty(body.preferenceCategory || body.category) || DEFAULT_CATEGORY;
	const preferenceTitle = trimOrEmpty(body.preferenceTitle || body.title);
	const preferenceDescription = trimOrEmpty(body.preferenceDescription || body.description || body.note);
	const displayOrderRaw = body.displayOrder != null ? body.displayOrder : body.sortOrder;
	const displayOrder = Number.isFinite(Number(displayOrderRaw)) ? Number(displayOrderRaw) : 0;

	const errors = [];

	if (preferenceCategory.length > CATEGORY_MAX) {
		errors.push('preferenceCategory too long (max ' + CATEGORY_MAX + ')');
	}
	if (requireTitle && !preferenceTitle) {
		errors.push('preferenceTitle is required');
	}
	if (preferenceTitle.length > TITLE_MAX) {
		errors.push('preferenceTitle too long (max ' + TITLE_MAX + ')');
	}
	if (preferenceDescription.length > DESCRIPTION_MAX) {
		errors.push('preferenceDescription too long (max ' + DESCRIPTION_MAX + ')');
	}

	return {
		ok: errors.length === 0,
		errors: errors,
		preference: {
			preferenceCategory: preferenceCategory,
			preferenceTitle: preferenceTitle || null,
			preferenceDescription: preferenceDescription || null,
			displayOrder: displayOrder
		}
	};
}

function isPreferenceOwner(currentUser, preferenceUserName) {
	return (
		String(currentUser || '').trim().toLowerCase() ===
		String(preferenceUserName || '').trim().toLowerCase()
	);
}

module.exports = {
	TITLE_MAX,
	DESCRIPTION_MAX,
	CATEGORY_MAX,
	DEFAULT_CATEGORY,
	defaultPreferenceCategory,
	normalizePreferenceInput,
	isPreferenceOwner
};
