const actionMap = require('../../../../application/atlas/cloudPilot/masterCloudPilotCapabilities');
const {
    decideNextStep,
    capabilityAvailabilityGate
} = require('../../../../application/atlas/cloudPilot/decide/masterDecision');
const { RESPONSE_TYPE } = require('../../../../application/atlas/cloudPilot/requests/decisionTypes');
const CapabilitiesFunctions = require('../../../../application/atlas/cloudPilot/capabilities/capabilitiesFunctions');

const CAPABILITY_STATUS = actionMap.CAPABILITY_STATUS;
const capabilityStatus = actionMap.capabilityStatus;
const getCapabilityStatus = actionMap.getCapabilityStatus;
const isCapabilityLive = actionMap.isCapabilityLive;

describe('cloudPilotCapabilityStatus', () => {
    test('live capability is allowed', () => {
        expect(getCapabilityStatus('scan_ec2')).toBe(CAPABILITY_STATUS.LIVE);
        expect(isCapabilityLive('scan_ec2')).toBe(true);
        expect(actionMap.scan_ec2.allowed).toBe(true);
        expect(actionMap.scan_ec2.status).toBe(CAPABILITY_STATUS.LIVE);
    });

    test('in_development capability is not allowed', () => {
        expect(getCapabilityStatus('pause_ec2')).toBe(CAPABILITY_STATUS.IN_DEVELOPMENT);
        expect(isCapabilityLive('pause_ec2')).toBe(false);
        expect(actionMap.pause_ec2.allowed).toBe(false);
        expect(actionMap.pause_ec2.status).toBe(CAPABILITY_STATUS.IN_DEVELOPMENT);
    });

    test('coming_soon capability is not allowed', () => {
        expect(getCapabilityStatus('delete_ec2')).toBe(CAPABILITY_STATUS.COMING_SOON);
        expect(isCapabilityLive('delete_ec2')).toBe(false);
        expect(actionMap.delete_ec2.allowed).toBe(false);
        expect(actionMap.delete_ec2.status).toBe(CAPABILITY_STATUS.COMING_SOON);
    });

    test('every master capability has a status entry', () => {
        const actionKeys = Object.keys(actionMap);

        expect(actionKeys.length).toBeGreaterThan(0);

        for (let i = 0; i < actionKeys.length; i++) {
            const capabilityName = actionKeys[i];
            expect(Object.prototype.hasOwnProperty.call(capabilityStatus, capabilityName)).toBe(
                true
            );
            expect(actionMap[capabilityName].status).toBe(capabilityStatus[capabilityName]);
            expect(actionMap[capabilityName].allowed).toBe(
                capabilityStatus[capabilityName] === CAPABILITY_STATUS.LIVE
            );
        }
    });

    test('unknown or invalid statuses fail validation', () => {
        const validate = actionMap.validateCapabilityStatusCatalog;
        const actionKeys = Object.keys(actionMap);

        expect(() => {
            validate(actionKeys, capabilityStatus, CAPABILITY_STATUS);
        }).not.toThrow();

        expect(() => {
            validate(actionKeys, { ...capabilityStatus }, CAPABILITY_STATUS);
        }).not.toThrow();

        expect(() => {
            validate(
                actionKeys.concat(['missing_capability_typo']),
                capabilityStatus,
                CAPABILITY_STATUS
            );
        }).toThrow(/Missing capability status entry for "missing_capability_typo"/);

        expect(() => {
            validate(
                actionKeys,
                { ...capabilityStatus, not_a_real_capability: CAPABILITY_STATUS.LIVE },
                CAPABILITY_STATUS
            );
        }).toThrow(/Unknown capability in status catalog: "not_a_real_capability"/);

        expect(() => {
            validate(
                actionKeys,
                { ...capabilityStatus, scan_ec2: 'not_a_valid_status' },
                CAPABILITY_STATUS
            );
        }).toThrow(/Invalid capability status for "scan_ec2"/);
    });

    test('existing helper exports and action-map behavior still work', () => {
        expect(typeof actionMap.actionRequiresExecutionModeSelection).toBe('function');
        expect(typeof actionMap.capabilityRequiresConfirmation).toBe('function');
        expect(typeof actionMap.capabilityAllowsImmediateFulfill).toBe('function');
        expect(typeof actionMap.matchesScanEC2Intent).toBe('function');
        expect(typeof actionMap.validateCapabilityStatusCatalog).toBe('function');
        expect(typeof actionMap.getCapabilityStatus).toBe('function');
        expect(typeof actionMap.isCapabilityLive).toBe('function');

        expect(Object.keys(actionMap)).not.toContain('actionRequiresExecutionModeSelection');
        expect(Object.keys(actionMap)).not.toContain('capabilityStatus');
        expect(actionMap.scan_ec2.type).toBe('scan_ec2');
        expect(typeof actionMap.scan_ec2.match).toBe('function');
        expect(typeof actionMap.scan_ec2.executionFunction).toBe('function');
    });

    test('decide blocks OFF capabilities without creating a request', () => {
        const decision = decideNextStep({
            understanding: {
                action: 'pause_ec2',
                values: {},
                ambiguous: false
            },
            requestState: {}
        });

        expect(decision.response.type).toBe(RESPONSE_TYPE.CAPABILITY_NOT_AVAILABLE);
        expect(decision.response.action).toBe('pause_ec2');
        expect(decision.request).toBeNull();
        expect(decision.execute).toBeUndefined();
    });

    test('decide allows LIVE capabilities to start a request', () => {
        const decision = decideNextStep({
            understanding: {
                action: 'scan_ec2',
                values: {},
                ambiguous: false
            },
            requestState: {}
        });

        expect(decision.response.type).not.toBe(RESPONSE_TYPE.CAPABILITY_NOT_AVAILABLE);
        expect(decision.request).not.toBeNull();
        expect(decision.request.action).toBe('scan_ec2');
    });

    test('capabilityAvailabilityGate mirrors allowed policy', () => {
        expect(capabilityAvailabilityGate('scan_ec2')).toBeNull();
        expect(capabilityAvailabilityGate('pause_ec2').response.type).toBe(
            RESPONSE_TYPE.CAPABILITY_NOT_AVAILABLE
        );
        expect(capabilityAvailabilityGate('delete_ec2').response.type).toBe(
            RESPONSE_TYPE.CAPABILITY_NOT_AVAILABLE
        );
    });

    test('capabilities catalog includes only live actions and exposes status', () => {
        const eligible = CapabilitiesFunctions.getEligibleCapabilityActions();
        const catalog = CapabilitiesFunctions.buildCapabilitiesCatalog();

        for (let i = 0; i < eligible.length; i++) {
            expect(eligible[i].allowed).toBe(true);
            expect(eligible[i].status).toBe(CAPABILITY_STATUS.LIVE);
        }

        expect(eligible.some((action) => action.type === 'scan_ec2')).toBe(true);
        expect(eligible.some((action) => action.type === 'pause_ec2')).toBe(false);

        const flatActions = [];

        for (let i = 0; i < catalog.sections.length; i++) {
            flatActions.push.apply(flatActions, catalog.sections[i].actions);
        }

        for (let i = 0; i < flatActions.length; i++) {
            expect(flatActions[i].status).toBe(CAPABILITY_STATUS.LIVE);
        }
    });
});
