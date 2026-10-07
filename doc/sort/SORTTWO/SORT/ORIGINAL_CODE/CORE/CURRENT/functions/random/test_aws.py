import boto3
from botocore.exceptions import NoCredentialsError, ProfileNotFound


PROFILE = "atlas"
REGION = "us-west-2"


def test_connection():

    try:
        print("Connecting to AWS...")

        session = boto3.Session(profile_name=PROFILE, region_name=REGION)

        sts = session.client("sts")

        identity = sts.get_caller_identity()

        print("\n===== AWS Connection Successful =====\n")

        print(f"AWS Account: {identity['Account']}")
        print(f"User ARN: {identity['Arn']}")

        print("\n=====================================\n")

    except ProfileNotFound:
        print("\nERROR: AWS profile not found\n")

    except NoCredentialsError:
        print("\nERROR: AWS credentials not configured\n")


if __name__ == "__main__":
    test_connection()