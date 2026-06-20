const {
    STATUS,
    initialStatusForNewAction,
    statusWhenFieldsComplete,
    isWaitingOnConfirmation,
    isWaitingOnExecutionMode,
    isCollectingFields,
    shouldUpdateStatusWhenFieldsComplete
} = require('../../../../application/atlas/services/requests/functions/requestStatusFunctions');

describe('actionStatusFunctions', () => {
    test('initialStatusForNewAction returns waiting_on_fields when missing list not empty', () => {
        expect(initialStatusForNewAction(['region'])).toBe(STATUS.WAITING_ON_FIELDS);
    });

    test('initialStatusForNewAction returns waiting_on_confirmation when no required fields', () => {
        expect(initialStatusForNewAction([])).toBe(STATUS.WAITING_ON_CONFIRMATION);
    });

    test('statusWhenFieldsComplete returns waiting_on_execution_mode when mode required', () => {
        expect(statusWhenFieldsComplete(true, null)).toBe(STATUS.WAITING_ON_EXECUTION_MODE);
    });

    test('statusWhenFieldsComplete returns waiting_on_confirmation when mode set or not required', () => {
        expect(statusWhenFieldsComplete(true, 'automatic')).toBe(STATUS.WAITING_ON_CONFIRMATION);
        expect(statusWhenFieldsComplete(false, null)).toBe(STATUS.WAITING_ON_CONFIRMATION);
    });

    test('isWaitingOnConfirmation accepts legacy ready', () => {
        expect(isWaitingOnConfirmation('waiting_on_confirmation')).toBe(true);
        expect(isWaitingOnConfirmation('ready')).toBe(true);
        expect(isWaitingOnConfirmation('waiting_on_fields')).toBe(false);
    });

    test('shouldUpdateStatusWhenFieldsComplete from collecting fields', () => {
        expect(
            shouldUpdateStatusWhenFieldsComplete('waiting_on_fields', false, null)
        ).toBe(true);
    });

    test('shouldUpdateStatusWhenFieldsComplete from execution mode to confirmation', () => {
        expect(
            shouldUpdateStatusWhenFieldsComplete(
                'waiting_on_execution_mode',
                true,
                'automatic'
            )
        ).toBe(true);
    });
});
