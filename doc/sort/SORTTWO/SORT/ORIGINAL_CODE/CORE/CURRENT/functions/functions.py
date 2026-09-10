import boto3
from botocore.exceptions import NoCredentialsError, ProfileNotFound

from config.config import PROFILE, REGION
from core.ORIGINAL.logic.ec2_logic import run_ec2_scan_with_clients

'''
FUNCTIONS A: All Functions Related to Printing
	1) Function A1: Print Findings
	2) Function A2: Purchase Item
 
FUNCTIONS B: All Functions Related to Miscellaneous
	1) Function B1: Get all Group Items
	2) Function B2: Get all Group Items (Pagination)

'''

#Function A1: Print Findings
def print_findings(findings):
    print("\n===== CloudPilot EC2 Scan =====\n")

    if not findings:
        print("No issues found.")
        return

    total_savings = 0

    for f in findings:
        print(f"Instance: {f.resource_id}")
        print(f"Name: {f.name}")
        print(f"Instance Type: {f.instance_type}")
        print(f"Average CPU: {f.avg_cpu}%")
        print(f"Issue: {f.issue}")
        print(f"Recommendation: {f.recommendation}")
        print(f"Estimated Savings: ${f.estimated_savings}/month\n")

        total_savings += f.estimated_savings

    print("--------------------------------")
    print(f"Total Potential Savings: ${total_savings}/month\n")



def print_connection_info(clients):
    """Print AWS connection details from session clients."""
    print("\n===== CloudPilot AWS Connection =====\n")

    identity = clients["sts"].get_caller_identity()

    print(f"Connected to AWS Account: {identity['Account']}")
    print(f"User ARN: {identity['Arn']}")
    print(f"Region: {REGION}")
    print("\nConnection successful\n")


def check_ec2_instance(clients):
    """Run EC2 scanner and print findings. Expects clients from create_session()."""
    result = run_ec2_scan_with_clients(clients["ec2"], clients["cloudwatch"])
    print_findings(result["findings"])


def aws_test():
    try:
        session = boto3.Session(profile_name=PROFILE, region_name=REGION)
    except ProfileNotFound:
        print(f"Note: AWS profile '{PROFILE}' not found, using default profile.\n")
        session = boto3.Session(region_name=REGION)

    try:
        sts = session.client("sts")
        identity = sts.get_caller_identity()
    except NoCredentialsError:
        print("\n===== AWS credentials not found =====\n")
        print("Configure credentials using one of these options:\n")
        print("  1. AWS CLI:  aws configure")
        print("  2. Files:    ~/.aws/credentials  and  ~/.aws/config")
        print("     Add [atlas] (or [default]) with aws_access_key_id and aws_secret_access_key")
        print("  3. Env vars: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION")
        print("\nSee: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html\n")
        return

    print("\n===== CloudPilot AWS Connection =====\n")
    print(f"Connected to AWS Account: {identity['Account']}")
    print(f"User ARN: {identity['Arn']}")
    print(f"Region: {REGION}")
    print("\nConnection successful \n")
