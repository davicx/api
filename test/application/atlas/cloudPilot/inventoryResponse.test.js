jest.mock(
    '../../../../application/atlas/providers/atlas/ec2/scanEC2',
    () => ({
        scanEC2: jest.fn()
    })
);
jest.mock(
    '../../../../application/atlas/cloudPilot/scans/ec2/atlasEC2Formatter',
    () => ({
        formatAtlasEC2Output: jest.fn()
    })
);
jest.mock(
    '../../../../application/atlas/cloudPilot/scans/ec2/enrichEC2InstancesWithPricing',
    () => ({
        enrichEC2InstancesWithPricing: jest.fn(async (instances) => instances)
    })
);
jest.mock(
    '../../../../application/atlas/cloudPilot/scans/ec2/atlasEC2ScanNavigatorAdapter',
    () => ({
        buildEC2ScanNavigatorResponse: jest.fn(() => ({
            data: { tables: [{ id: 'ec2_instances' }] }
        }))
    })
);
jest.mock(
    '../../../../application/atlas/cloudPilot/scans/s3/atlasS3Functions',
    () => ({
        scanS3: jest.fn()
    })
);
jest.mock(
    '../../../../application/atlas/cloudPilot/scans/s3/atlasS3Formatter',
    () => ({
        formatAtlasS3Output: jest.fn()
    })
);
jest.mock(
    '../../../../application/atlas/cloudPilot/scans/s3/atlasS3ScanNavigatorAdapter',
    () => ({
        buildS3ScanNavigatorResponse: jest.fn(() => ({
            data: { tables: [{ id: 's3_buckets' }] }
        }))
    })
);

const ScanEC2Functions = require('../../../../application/atlas/providers/atlas/ec2/scanEC2');
const atlasEC2Formatter = require('../../../../application/atlas/cloudPilot/scans/ec2/atlasEC2Formatter');
const scanEC2Handler = require('../../../../application/atlas/cloudPilot/scans/ec2/scanEC2Handler');
const atlasS3Functions = require('../../../../application/atlas/cloudPilot/scans/s3/atlasS3Functions');
const atlasS3Formatter = require('../../../../application/atlas/cloudPilot/scans/s3/atlasS3Formatter');
const scanS3Handler = require('../../../../application/atlas/cloudPilot/scans/s3/scanS3Handler');

const ec2Formatted = {
    summary: { region: 'us-west-2' },
    instances: [
        { name: 'cloudpilot-demo', instanceID: 'i-abc', state: 'running', instanceType: 't3.medium' },
        { name: 'api', instanceID: 'i-def', state: 'running', instanceType: 't3.small' },
        { name: 'worker', instanceID: 'i-ghi', state: 'stopped', instanceType: 't3.micro' }
    ],
    findings: [{ findingID: 'ec2-lowcpu-i-abc', recommendationAction: 'RIGHTSIZE' }]
};

const s3Formatted = {
    summary: { region: 'us-west-2' },
    buckets: [
        { bucketName: 'kite', region: 'us-west-2' },
        { bucketName: 'logs', region: 'us-west-2' }
    ],
    findings: [{ findingID: 's3-versioning-kite' }]
};

describe('inventory responses stay out of the dashboard', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        ScanEC2Functions.scanEC2.mockResolvedValue({ success: true, data: { instances: [] } });
        atlasEC2Formatter.formatAtlasEC2Output.mockReturnValue(ec2Formatted);
        atlasS3Functions.scanS3.mockResolvedValue({ success: true, data: { buckets: [] } });
        atlasS3Formatter.formatAtlasS3Output.mockReturnValue(s3Formatted);
    });

    test('get_ec2_inventory returns the inventory sentence and no scan payload', async () => {
        const result = await scanEC2Handler({
            action: { type: 'get_ec2_inventory' },
            state: { collected: { region: 'us-west-2' } }
        });

        expect(result.success).toBe(true);
        expect(result.cloudPilotMessage).toContain('You have 3 EC2 instances');
        expect(result.atlasResponse).toBeNull();
    });

    test('scan_ec2 returns the full scan payload', async () => {
        const result = await scanEC2Handler({
            action: { type: 'scan_ec2' },
            state: { collected: { region: 'us-west-2' } }
        });

        expect(result.success).toBe(true);
        expect(result.cloudPilotMessage).toContain('Open the Dashboard');
        expect(result.atlasResponse.findings).toEqual(ec2Formatted.findings);
        expect(result.atlasResponse.instances).toEqual(ec2Formatted.instances);
        expect(result.atlasResponse.navigatorResponse.data.tables[0].id).toBe('ec2_instances');
    });

    test('get_s3_inventory returns the inventory sentence and no scan payload', async () => {
        const result = await scanS3Handler({
            action: { type: 'get_s3_inventory' },
            state: { collected: { region: 'us-west-2' } }
        });

        expect(result.success).toBe(true);
        expect(result.cloudPilotMessage).toContain('You have 2 S3 buckets');
        expect(result.atlasResponse).toBeNull();
    });

    test('scan_s3 returns the full scan payload', async () => {
        const result = await scanS3Handler({
            action: { type: 'scan_s3' },
            state: { collected: { region: 'us-west-2' } }
        });

        expect(result.success).toBe(true);
        expect(result.cloudPilotMessage).toContain('Open the Dashboard');
        expect(result.atlasResponse.findings).toEqual(s3Formatted.findings);
        expect(result.atlasResponse.buckets).toEqual(s3Formatted.buckets);
        expect(result.atlasResponse.navigatorResponse.data.tables[0].id).toBe('s3_buckets');
    });
});
