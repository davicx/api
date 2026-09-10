import boto3


def create_session(profile_name: str, region: str):
    session = boto3.Session(profile_name=profile_name)
    return {
        "ec2": session.client("ec2", region_name=region),
        "cloudwatch": session.client("cloudwatch", region_name=region),
        "s3": session.client("s3", region_name=region),
        "rds": session.client("rds", region_name=region),
    }
