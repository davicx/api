import boto3
from datetime import datetime, timedelta, timezone

REGION = "us-west-2"

session = boto3.Session(profile_name="atlas")
ec2 = session.client("ec2", region_name=REGION)
cloudwatch = session.client("cloudwatch", region_name=REGION)

savings_map = {
    "t3.large":   ("t3.medium", 15),
    "t3.medium":  ("t3.small",  10),
    "t3.small":   ("t3.micro",   5),
    "t2.large":   ("t2.medium", 15),
    "t2.medium":  ("t2.small",  10),
    "t2.small":   ("t2.micro",   5),
    "m5.large":   ("t3.large",  30),
    "m5.xlarge":  ("m5.large",  60),
}

end = datetime.now(timezone.utc)
start = end - timedelta(days=14)

print("\n" + "=" * 50)
print("  AWS Cost Optimizer — EC2 Scan")
print(f"  Region: {REGION}")
print("  Scanning last 14 days...")
print("=" * 50 + "\n")

instances = ec2.describe_instances(
    Filters=[{"Name": "instance-state-name", "Values": ["running"]}]
)

found_issues = 0

for reservation in instances["Reservations"]:
    for inst in reservation["Instances"]:
        instance_id = inst["InstanceId"]
        instance_type = inst["InstanceType"]

        name = "Unnamed"
        for tag in inst.get("Tags", []):
            if tag["Key"] == "Name":
                name = tag["Value"]

        metrics = cloudwatch.get_metric_statistics(
            Namespace="AWS/EC2",
            MetricName="CPUUtilization",
            Dimensions=[{"Name": "InstanceId", "Value": instance_id}],
            StartTime=start,
            EndTime=end,
            Period=86400,
            Statistics=["Average"],
        )

        datapoints = metrics["Datapoints"]
        if not datapoints:
            print(f"⚠️  No CloudWatch data for {name} ({instance_id}) — skipping\n")
            continue

        datapoints = sorted(datapoints, key=lambda x: x["Timestamp"])
        avg_cpu = sum(dp["Average"] for dp in datapoints) / len(datapoints)

        suggestion, savings = savings_map.get(instance_type, (None, 0))

        if avg_cpu < 10:
            found_issues += 1
            print("⚠️  Over-provisioned EC2 Detected")
            print(f"   Name:          {name}")
            print(f"   Instance ID:   {instance_id}")
            print(f"   Type:          {instance_type}")
            print(f"   Avg CPU:       {avg_cpu:.2f}%")
            if suggestion:
                print(f"   Suggestion:    {suggestion}")
                print(f"   Est. Savings:  ~${savings}/month")
            else:
                print("   Suggestion:    Review manually")
            print()
        else:
            print(f"✓ {name} looks fine — Avg CPU: {avg_cpu:.2f}%\n")

print("=" * 50)
print(f" Scan Complete — {found_issues} issue(s) found")
print("=" * 50 + "\n")

s3 = session.client("s3")

print("\nScanning S3 buckets...\n")

buckets = s3.list_buckets()["Buckets"]

for bucket in buckets:
    name = bucket["Name"]
    
    # Check lifecycle configuration
    try:
        lifecycle = s3.get_bucket_lifecycle_configuration(Bucket=name)
        has_lifecycle = True
    except s3.exceptions.ClientError:
        has_lifecycle = False

    if not has_lifecycle:
        print("⚠️  S3 Bucket Without Lifecycle Policy")
        print(f"   Bucket: {name}")
        print("   Suggestion: Add lifecycle rule to transition or expire old objects")
        print("   Est. Savings: Depends on storage size\n")
#policies
#users: atlas-cloud-scanner-dev