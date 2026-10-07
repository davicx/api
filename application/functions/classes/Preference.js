const db = require('./../conn');

/*
METHODS A: User Preference SQL (user_preference table)
	1) Method A1: Get Preferences By User Name
	2) Method A2: Get Preference By ID
	3) Method A3: Create Preference
	4) Method A4: Update Preference
	5) Method A5: Soft Delete Preference
*/

class Preference {

    static mapRow(row) {
        return {
            userPreferenceID: row.user_preference_id,
            userName: row.user_name,
            preferenceCategory: row.preference_category,
            preferenceTitle: row.preference_title,
            preferenceDescription: row.preference_description,
            displayOrder: row.display_order,
            active: row.active,
            updated: row.updated,
            created: row.created
        };
    }

    //Method A1: Get active preferences for a user
    static async getPreferencesByUserName(userName) {
        const connection = db.getConnection();
        const queryString =
            'SELECT * FROM user_preference WHERE user_name = ? AND active = 1 ORDER BY display_order ASC, user_preference_id ASC';

        const outcome = {
            success: false,
            preferences: [],
            errors: []
        };

        return new Promise(function (resolve) {
            connection.query(queryString, [userName], function (err, rows) {
                if (err) {
                    console.log('Preference.getPreferencesByUserName error', err);
                    outcome.errors.push(err);
                    return resolve(outcome);
                }
                outcome.preferences = (rows || []).map(Preference.mapRow);
                outcome.success = true;
                return resolve(outcome);
            });
        });
    }

    //Method A2: Get one preference by id (any active flag — for ownership checks)
    static async getPreferenceByID(userPreferenceID) {
        const connection = db.getConnection();
        const queryString = 'SELECT * FROM user_preference WHERE user_preference_id = ?';

        const outcome = {
            success: false,
            preference: null,
            found: false,
            errors: []
        };

        return new Promise(function (resolve) {
            connection.query(queryString, [userPreferenceID], function (err, rows) {
                if (err) {
                    console.log('Preference.getPreferenceByID error', err);
                    outcome.errors.push(err);
                    return resolve(outcome);
                }
                if (!rows || rows.length === 0) {
                    return resolve(outcome);
                }
                outcome.preference = Preference.mapRow(rows[0]);
                outcome.found = true;
                outcome.success = true;
                return resolve(outcome);
            });
        });
    }

    //Method A3: Create preference
    static async createPreference(preference) {
        const connection = db.getConnection();
        const queryString =
            'INSERT INTO user_preference (user_name, preference_category, preference_title, preference_description, display_order, active) VALUES (?, ?, ?, ?, ?, 1)';

        const outcome = {
            success: false,
            userPreferenceID: 0,
            preference: null,
            errors: []
        };

        return new Promise(function (resolve) {
            connection.query(
                queryString,
                [
                    preference.userName,
                    preference.preferenceCategory,
                    preference.preferenceTitle,
                    preference.preferenceDescription,
                    preference.displayOrder
                ],
                function (err, result) {
                    if (err) {
                        console.log('Preference.createPreference error', err);
                        outcome.errors.push(err);
                        return resolve(outcome);
                    }
                    outcome.userPreferenceID = result.insertId;
                    outcome.success = true;
                    outcome.preference = {
                        userPreferenceID: result.insertId,
                        userName: preference.userName,
                        preferenceCategory: preference.preferenceCategory,
                        preferenceTitle: preference.preferenceTitle,
                        preferenceDescription: preference.preferenceDescription,
                        displayOrder: preference.displayOrder,
                        active: 1
                    };
                    return resolve(outcome);
                }
            );
        });
    }

    //Method A4: Update preference (owner scoped)
    static async updatePreference(preference) {
        const connection = db.getConnection();
        const queryString =
            'UPDATE user_preference SET preference_category = ?, preference_title = ?, preference_description = ?, display_order = ? WHERE user_preference_id = ? AND user_name = ? AND active = 1';

        const outcome = {
            success: false,
            affectedRows: 0,
            errors: []
        };

        return new Promise(function (resolve) {
            connection.query(
                queryString,
                [
                    preference.preferenceCategory,
                    preference.preferenceTitle,
                    preference.preferenceDescription,
                    preference.displayOrder,
                    preference.userPreferenceID,
                    preference.userName
                ],
                function (err, result) {
                    if (err) {
                        console.log('Preference.updatePreference error', err);
                        outcome.errors.push(err);
                        return resolve(outcome);
                    }
                    outcome.affectedRows = result.affectedRows || 0;
                    outcome.success = outcome.affectedRows > 0;
                    return resolve(outcome);
                }
            );
        });
    }

    //Method A5: Soft delete (owner scoped)
    static async softDeletePreference(userPreferenceID, userName) {
        const connection = db.getConnection();
        const queryString =
            'UPDATE user_preference SET active = 0 WHERE user_preference_id = ? AND user_name = ? AND active = 1';

        const outcome = {
            success: false,
            affectedRows: 0,
            errors: []
        };

        return new Promise(function (resolve) {
            connection.query(queryString, [userPreferenceID, userName], function (err, result) {
                if (err) {
                    console.log('Preference.softDeletePreference error', err);
                    outcome.errors.push(err);
                    return resolve(outcome);
                }
                outcome.affectedRows = result.affectedRows || 0;
                outcome.success = outcome.affectedRows > 0;
                return resolve(outcome);
            });
        });
    }
}

module.exports = Preference;
