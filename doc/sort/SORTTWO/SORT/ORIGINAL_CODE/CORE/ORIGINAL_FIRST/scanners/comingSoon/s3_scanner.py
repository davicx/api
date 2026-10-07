# S3 scan — not wired to the MVP scan API yet. See ``scan_logic`` / ``ec2_logic`` for active flow.

from botocore.exceptions import ClientError

from core.models import Finding


def scan(s3):
    findings = []

    buckets = s3.list_buckets()["Buckets"]

    for bucket in buckets:
        name = bucket["Name"]

        try:
            s3.get_bucket_lifecycle_configuration(Bucket=name)
        except ClientError as e:
            if e.response["Error"]["Code"] != "NoSuchLifecycleConfiguration":
                raise
            findings.append(
                Finding(
                    service="S3",
                    resource_id=name,
                    name=name,
                    issue="No lifecycle policy",
                    recommendation="Add lifecycle rule to transition or expire old objects",
                    estimated_savings=0,
                )
            )

    return findings
