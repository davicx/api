

#APPENDIX
# app.include_router(hello_router)
# app.include_router(deploy_router)
# app.include_router(ai_router)

    #ask_to_apply(ec2_toggle_remediation)

    '''
        result = ec2_scanner.scan(clients["ec2"], clients["cloudwatch"])
        print_findings(result["findings"])
        findings = result["findings"]
    if findings:

        explanation = mock_explain_finding(findings[0])
        print("CloudPilot Analysis (mock):")
        print(explanation)

        # NEW PART
        finding = findings[0]

        if finding.remediation:
            ask_to_apply(finding.remediation)

    '''
# from utils.debug import print_findings  # add here if needed
# Learning mode: EC2 low-CPU scan only — uncomment when exploring AI / remediation flows
# from core.functions.ai.ai_functions import explain_finding, mock_explain_finding

# EC2 scan and operation routes live in separate route files.
# from api.routes.deploy_routes import router as deploy_router
# from api.routes.ai_routes import router as ai_router

# from api.services.comingSoon.remediation_service import ask_to_apply
# from api.routes.hello import router as hello_router


'''
Call EC2 Operation
from core.cloud.ec2.operations.toggle_instances import execute_toggle

result = execute_toggle({})

print(result)
'''
    
'''
def main():
    clients = create_session(PROFILE, REGION)
    print_connection_info(clients)

    result = ec2_scanner.scan(clients["ec2"], clients["cloudwatch"])
    print_findings(result["findings"])

    findings = result["findings"]
    if findings:
        explanation = mock_explain_finding(findings[0])
        print("CloudPilot Analysis (mock):")
        print(explanation)

if __name__ == "__main__":
    main()

'''
