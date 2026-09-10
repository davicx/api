1. Resource Dependencies (Crucial)
In cloud environments, nothing exists in a vacuum. If an AI suggests deleting an S3 bucket or resizing an EC2, it needs to know what might break.

Add: dependencies: [] or related_resources: [].

Example: For the S3 bucket, are there CloudFront distributions or IAM roles pointing to it?

2. "Reasoning" or "Evidence" Block
To help the AI explain why it's making a choice to a human user, provide a raw "evidence" string or array.

Add: evidence: ["CloudWatch Metric 'CPUUtilization' peaked at 1.2% in 14 days", "No CloudTrail 'GetBucket' events since Feb 20th"].

3. State Management
If the AI is going to perform the remediation, it needs to know if the resource is "Locked" or "Protected."

Add: is_deletable: false (e.g., if termination protection is on for EC2).

4. Categorization Refinement
You have category: "cost". Consider adding a subcategory or tags like ["finops", "optimization", "waste"]. This helps the AI group findings in a final executive summary.


Static rules  +  Human context  +  Memory  =  Smart system

CHAT: Asks user for context suggests, stores what they tell us 
